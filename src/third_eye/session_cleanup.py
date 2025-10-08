"""Session TTL and cleanup mechanism."""
from __future__ import annotations

import asyncio
import logging
import time
from typing import List

from .config import CONFIG
from .cache import get_redis

LOG = logging.getLogger(__name__)

SESSION_TTL_SECONDS = 604800
SESSION_KEY_PREFIX = "session_ttl:"


async def set_session_ttl(session_id: str, ttl_seconds: int = SESSION_TTL_SECONDS) -> None:
    redis = await get_redis()
    if not redis:
        return

    try:
        expires_at = int(time.time()) + ttl_seconds
        await redis.set(f"{SESSION_KEY_PREFIX}{session_id}", str(expires_at), ex=ttl_seconds + 86400)
        LOG.info(f"Set TTL for session {session_id}: {ttl_seconds}s")
    except Exception as exc:
        LOG.error(f"Failed to set session TTL for {session_id}: {exc}")


async def touch_session(session_id: str) -> None:
    redis = await get_redis()
    if not redis:
        return

    try:
        expires_at = int(time.time()) + SESSION_TTL_SECONDS
        await redis.set(f"{SESSION_KEY_PREFIX}{session_id}", str(expires_at), ex=SESSION_TTL_SECONDS + 86400)
    except Exception as exc:
        LOG.error(f"Failed to touch session {session_id}: {exc}")


async def check_session_expired(session_id: str) -> bool:
    redis = await get_redis()
    if not redis:
        return False

    try:
        expires_at_str = await redis.get(f"{SESSION_KEY_PREFIX}{session_id}")
        if not expires_at_str:
            return False

        expires_at = int(expires_at_str)
        return time.time() > expires_at
    except Exception as exc:
        LOG.error(f"Failed to check session expiry for {session_id}: {exc}")
        return False


async def get_expired_sessions() -> List[str]:
    redis = await get_redis()
    if not redis:
        return []

    try:
        expired = []
        current_time = int(time.time())

        async for key in redis.scan_iter(match=f"{SESSION_KEY_PREFIX}*"):
            expires_at_str = await redis.get(key)
            if expires_at_str and int(expires_at_str) < current_time:
                session_id = key.decode() if isinstance(key, bytes) else key
                session_id = session_id.replace(SESSION_KEY_PREFIX, "")
                expired.append(session_id)

        return expired
    except Exception as exc:
        LOG.error(f"Failed to get expired sessions: {exc}")
        return []


async def cleanup_expired_sessions() -> int:
    redis = await get_redis()
    if not redis:
        return 0

    try:
        expired = await get_expired_sessions()
        if not expired:
            return 0

        LOG.info(f"Found {len(expired)} expired sessions to clean up")

        cleaned = 0
        for session_id in expired:
            try:
                await redis.delete(f"{SESSION_KEY_PREFIX}{session_id}")

                session_keys_pattern = f"*{session_id}*"
                deleted_keys = []
                async for key in redis.scan_iter(match=session_keys_pattern, count=100):
                    deleted_keys.append(key)

                if deleted_keys:
                    await redis.delete(*deleted_keys)

                cleaned += 1
                LOG.info(f"Cleaned up session {session_id}")
            except Exception as exc:
                LOG.error(f"Failed to cleanup session {session_id}: {exc}")

        return cleaned
    except Exception as exc:
        LOG.error(f"Session cleanup failed: {exc}")
        return 0


async def run_cleanup_loop(interval_seconds: int = 86400) -> None:
    while True:
        try:
            LOG.info("Starting session cleanup task")
            cleaned = await cleanup_expired_sessions()
            LOG.info(f"Session cleanup complete: {cleaned} sessions removed")
        except Exception as exc:
            LOG.error(f"Session cleanup loop error: {exc}")

        await asyncio.sleep(interval_seconds)
