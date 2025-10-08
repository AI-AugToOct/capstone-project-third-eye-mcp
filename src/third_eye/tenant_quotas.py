"""Tenant-level quota enforcement and tracking."""
from __future__ import annotations

import logging
import time
from typing import Optional, Dict, Any

from .cache import get_redis
from .config import CONFIG

LOG = logging.getLogger(__name__)

TENANT_QUOTA_PREFIX = "tenant_quota:"
TENANT_USAGE_PREFIX = "tenant_usage:"
DEFAULT_TENANT_QUOTA = 1_000_000


async def get_tenant_quota(tenant_id: str) -> int:
    redis = await get_redis()
    if not redis:
        return DEFAULT_TENANT_QUOTA

    try:
        quota = await redis.get(f"{TENANT_QUOTA_PREFIX}{tenant_id}")
        return int(quota) if quota else DEFAULT_TENANT_QUOTA
    except Exception as exc:
        LOG.error(f"Failed to get tenant quota for {tenant_id}: {exc}")
        return DEFAULT_TENANT_QUOTA


async def set_tenant_quota(tenant_id: str, quota: int) -> None:
    redis = await get_redis()
    if not redis:
        return

    try:
        await redis.set(f"{TENANT_QUOTA_PREFIX}{tenant_id}", str(quota))
        LOG.info(f"Set tenant quota for {tenant_id}: {quota}")
    except Exception as exc:
        LOG.error(f"Failed to set tenant quota for {tenant_id}: {exc}")


async def get_tenant_usage(tenant_id: str, window_seconds: int = 86400) -> Dict[str, Any]:
    redis = await get_redis()
    if not redis:
        return {"requests": 0, "tokens": 0}

    try:
        current_window = int(time.time() / window_seconds)
        key = f"{TENANT_USAGE_PREFIX}{tenant_id}:{current_window}"

        requests = await redis.hget(key, "requests")
        tokens = await redis.hget(key, "tokens")

        return {
            "requests": int(requests) if requests else 0,
            "tokens": int(tokens) if tokens else 0,
            "window_start": current_window * window_seconds,
            "window_end": (current_window + 1) * window_seconds,
        }
    except Exception as exc:
        LOG.error(f"Failed to get tenant usage for {tenant_id}: {exc}")
        return {"requests": 0, "tokens": 0}


async def increment_tenant_usage(
    tenant_id: str,
    requests: int = 1,
    tokens: int = 0,
    window_seconds: int = 86400
) -> None:
    redis = await get_redis()
    if not redis:
        return

    try:
        current_window = int(time.time() / window_seconds)
        key = f"{TENANT_USAGE_PREFIX}{tenant_id}:{current_window}"

        pipeline = redis.pipeline()
        pipeline.hincrby(key, "requests", requests)
        pipeline.hincrby(key, "tokens", tokens)
        pipeline.expire(key, window_seconds * 2)
        await pipeline.execute()

    except Exception as exc:
        LOG.error(f"Failed to increment tenant usage for {tenant_id}: {exc}")


async def check_tenant_quota(tenant_id: str, tokens_needed: int = 0) -> tuple[bool, Optional[str]]:
    if not tenant_id:
        return True, None

    quota = await get_tenant_quota(tenant_id)
    usage = await get_tenant_usage(tenant_id)

    current_tokens = usage.get("tokens", 0)

    if current_tokens + tokens_needed > quota:
        return False, f"Tenant quota exceeded: {current_tokens}/{quota} tokens used"

    return True, None


async def reset_tenant_usage(tenant_id: str) -> None:
    redis = await get_redis()
    if not redis:
        return

    try:
        pattern = f"{TENANT_USAGE_PREFIX}{tenant_id}:*"
        async for key in redis.scan_iter(match=pattern):
            await redis.delete(key)
        LOG.info(f"Reset usage for tenant {tenant_id}")
    except Exception as exc:
        LOG.error(f"Failed to reset tenant usage for {tenant_id}: {exc}")
