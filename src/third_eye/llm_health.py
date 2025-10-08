"""LLM provider health check for readiness probe."""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional

from .config import CONFIG
from .providers.base import REGISTRY
from .constants import ToolName, PersonaKey

LOG = logging.getLogger(__name__)

_LAST_CHECK_TIME: float = 0
_LAST_CHECK_RESULT: bool = False
_CHECK_CACHE_TTL = 30


async def check_llm_health() -> bool:
    global _LAST_CHECK_TIME, _LAST_CHECK_RESULT

    if time.time() - _LAST_CHECK_TIME < _CHECK_CACHE_TTL:
        return _LAST_CHECK_RESULT

    try:
        provider = REGISTRY.get()

        test_payload = {
            "prompt": "Health check",
            "messages": [
                {"role": "system", "content": "You are a health check responder."},
                {"role": "user", "content": "Respond with OK"}
            ]
        }

        response = await asyncio.wait_for(
            provider.invoke(
                tool=ToolName.OVERSEER_NAVIGATOR,
                persona_key=PersonaKey.OVERSEER,
                payload=test_payload
            ),
            timeout=5.0
        )

        _LAST_CHECK_TIME = time.time()
        _LAST_CHECK_RESULT = bool(response and response.get("content"))

        if not _LAST_CHECK_RESULT:
            LOG.warning("LLM health check failed: empty response")

        return _LAST_CHECK_RESULT

    except asyncio.TimeoutError:
        LOG.error("LLM health check timeout")
        _LAST_CHECK_TIME = time.time()
        _LAST_CHECK_RESULT = False
        return False
    except Exception as exc:
        LOG.error(f"LLM health check error: {exc}")
        _LAST_CHECK_TIME = time.time()
        _LAST_CHECK_RESULT = False
        return False
