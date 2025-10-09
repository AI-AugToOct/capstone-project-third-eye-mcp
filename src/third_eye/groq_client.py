"""Async Groq API client with retry and structured logging."""
from __future__ import annotations

import os
from typing import Any, Dict, Iterable

import httpx
from tenacity import AsyncRetrying, RetryError, retry_if_exception_type, stop_after_attempt, wait_exponential

from .config import CONFIG
from .logging import get_logger, log_json

LOG = get_logger("groq-client")


class GroqClient:
    """Minimal Groq HTTP API wrapper."""

    def __init__(
        self,
        *,
        base_url: str | None = None,
        api_key: str | None = None,
        timeout: float | None = None,
    ) -> None:
        self._base_url = (base_url or CONFIG.groq.base_url).rstrip("/")
        self._api_key = api_key or os.getenv("GROQ_API_KEY")
        self._timeout = timeout or CONFIG.timeouts.default_seconds
        self._defaults = CONFIG.groq.inference_defaults
        self._retry_attempts = CONFIG.retries.max_attempts
        self._backoff_seconds = CONFIG.timeouts.retry_backoff_seconds

        # Allow bootstrap without API key, but fail on actual usage
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers=headers,
            timeout=self._timeout,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def list_models(self) -> list[str]:
        if not self._api_key:
            raise RuntimeError("GROQ_API_KEY is required for API operations")
        response = await self._client.get("/models")
        response.raise_for_status()
        data = response.json()
        models = [item.get("id") for item in data.get("data", []) if item.get("id")]
        return [mid for mid in models if isinstance(mid, str)]

    async def chat(
        self,
        model: str,
        messages: list[dict[str, Any]],
        *,
        force_json: bool | None = None,
        max_output_tokens: int | None = None,
    ) -> str:
        if not self._api_key:
            raise RuntimeError("GROQ_API_KEY is required for API operations")
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
        }
        self._apply_defaults(payload, force_json=force_json, max_output_tokens=max_output_tokens)
        data = await self._post_json("/chat/completions", payload)
        choice = data["choices"][0]["message"]
        content = choice.get("content", "")
        if isinstance(content, list):
            content = "".join(part.get("text", "") for part in content if isinstance(part, dict))
        if not isinstance(content, str):  # pragma: no cover - defensive
            raise ValueError("Groq completion content missing or invalid")
        return content

    async def embeddings(self, model: str, input_texts: Iterable[str]) -> list[list[float]]:
        payload = {"model": model, "input": list(input_texts)}
        data = await self._post_json("/embeddings", payload)
        return [item["embedding"] for item in data.get("data", [])]

    def _apply_defaults(
        self,
        payload: Dict[str, Any],
        *,
        force_json: bool | None,
        max_output_tokens: int | None,
    ) -> None:
        payload.setdefault("temperature", self._defaults.temperature)
        payload.setdefault("top_p", self._defaults.top_p)
        payload.setdefault("max_output_tokens", max_output_tokens or self._defaults.max_output_tokens)
        json_mode = self._defaults.json_mode if force_json is None else force_json
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

    async def _post_json(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        try:
            async for attempt in AsyncRetrying(
                retry=retry_if_exception_type((httpx.RequestError, httpx.HTTPStatusError)),
                stop=stop_after_attempt(self._retry_attempts),
                wait=wait_exponential(multiplier=self._backoff_seconds or 0.5, min=self._backoff_seconds or 0.5, max=10),
            ):
                with attempt:
                    response = await self._client.post(path, json=payload)
                    response.raise_for_status()
                    elapsed = getattr(response, "elapsed", None)
                    latency_ms = elapsed.total_seconds() * 1000 if elapsed else None
                    log_json(
                        LOG,
                        "[GROQ]",
                        tool=payload.get("model"),
                        latency_ms=latency_ms,
                        max_output_tokens=payload.get("max_output_tokens"),
                    )
                    return response.json()
        except RetryError as exc:  # pragma: no cover - network failure path
            log_json(LOG, "[GROQ]", tool=payload.get("model"), error=str(exc))
            raise RuntimeError("Failed to contact Groq API") from exc


_groq_instance: GroqClient | None = None


def get_groq_client() -> GroqClient:
    """Get or create the global Groq client instance."""
    global _groq_instance
    if _groq_instance is None:
        _groq_instance = GroqClient()
    return _groq_instance


def reset_groq_client() -> None:
    """Reset the global Groq client instance (useful after key updates)."""
    global _groq_instance
    if _groq_instance is not None:
        # Don't await here - just set to None, old instance will be cleaned up
        _groq_instance = None


async def shutdown_groq_client() -> None:
    """Shutdown the global Groq client if it exists."""
    global _groq_instance
    if _groq_instance is not None:
        await _groq_instance.close()
        _groq_instance = None


# Backward compatibility - will be lazy-initialized on first access
class _GroqSingleton:
    def __getattr__(self, name):
        return getattr(get_groq_client(), name)

    async def __aenter__(self):
        return await get_groq_client().__aenter__()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return await get_groq_client().__aexit__(exc_type, exc_val, exc_tb)

GROQ = _GroqSingleton()


__all__ = ["get_groq_client", "reset_groq_client", "GroqClient", "shutdown_groq_client", "GROQ"]
