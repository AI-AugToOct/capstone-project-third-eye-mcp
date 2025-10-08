"""Admin session expiry with 1-hour TTL and refresh token support."""
from __future__ import annotations

import logging
import time
from typing import Optional, Tuple

from .cache import get_redis

LOG = logging.getLogger(__name__)

ADMIN_SESSION_TTL_SECONDS = 3600
ADMIN_SESSION_KEY_PREFIX = "admin_session:"


async def set_admin_session(key_id: str, admin_id: str, ttl_seconds: int = ADMIN_SESSION_TTL_SECONDS) -> None:
    redis = await get_redis()
    if not redis:
        return

    try:
        expires_at = int(time.time()) + ttl_seconds
        session_data = f"{admin_id}:{expires_at}"
        await redis.set(f"{ADMIN_SESSION_KEY_PREFIX}{key_id}", session_data, ex=ttl_seconds)
        LOG.info(f"Set admin session for key {key_id}: {ttl_seconds}s TTL")
    except Exception as exc:
        LOG.error(f"Failed to set admin session for {key_id}: {exc}")


async def extend_admin_session(key_id: str, ttl_seconds: int = ADMIN_SESSION_TTL_SECONDS) -> bool:
    redis = await get_redis()
    if not redis:
        return False

    try:
        session_key = f"{ADMIN_SESSION_KEY_PREFIX}{key_id}"
        session_data = await redis.get(session_key)
        if not session_data:
            return False

        admin_id = session_data.decode().split(":")[0] if isinstance(session_data, bytes) else session_data.split(":")[0]
        expires_at = int(time.time()) + ttl_seconds
        updated_data = f"{admin_id}:{expires_at}"
        await redis.set(session_key, updated_data, ex=ttl_seconds)
        LOG.info(f"Extended admin session for key {key_id}")
        return True
    except Exception as exc:
        LOG.error(f"Failed to extend admin session for {key_id}: {exc}")
        return False


async def check_admin_session_expired(key_id: str) -> bool:
    redis = await get_redis()
    if not redis:
        return False

    try:
        session_data = await redis.get(f"{ADMIN_SESSION_KEY_PREFIX}{key_id}")
        if not session_data:
            return True

        data_str = session_data.decode() if isinstance(session_data, bytes) else session_data
        parts = data_str.split(":")
        if len(parts) < 2:
            return True

        expires_at = int(parts[1])
        is_expired = time.time() > expires_at
        if is_expired:
            LOG.info(f"Admin session expired for key {key_id}")
        return is_expired
    except Exception as exc:
        LOG.error(f"Failed to check admin session expiry for {key_id}: {exc}")
        return False


async def revoke_admin_session(key_id: str) -> None:
    redis = await get_redis()
    if not redis:
        return

    try:
        await redis.delete(f"{ADMIN_SESSION_KEY_PREFIX}{key_id}")
        LOG.info(f"Revoked admin session for key {key_id}")
    except Exception as exc:
        LOG.error(f"Failed to revoke admin session for {key_id}: {exc}")


async def get_admin_session(key_id: str) -> Optional[Tuple[str, int]]:
    redis = await get_redis()
    if not redis:
        return None

    try:
        session_data = await redis.get(f"{ADMIN_SESSION_KEY_PREFIX}{key_id}")
        if not session_data:
            return None

        data_str = session_data.decode() if isinstance(session_data, bytes) else session_data
        parts = data_str.split(":")
        if len(parts) < 2:
            return None

        admin_id = parts[0]
        expires_at = int(parts[1])
        return admin_id, expires_at
    except Exception as exc:
        LOG.error(f"Failed to get admin session for {key_id}: {exc}")
        return None
