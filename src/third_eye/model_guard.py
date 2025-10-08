"""Model availability validation on startup."""
from __future__ import annotations

from typing import Iterable

from .config import CONFIG
from .logging import get_logger, log_json
from .providers import REGISTRY

LOG = get_logger("model-guard")


async def ensure_models_available() -> None:
    provider = REGISTRY.get()
    try:
        available = await provider.list_models()
        required = _collect_required_models()
        missing = sorted(set(required) - set(available))
        if missing:
            for model in missing:
                log_json(
                    LOG,
                    "[BOOT]",
                    error="missing_model",
                    model=model,
                    hint="Update config.yaml or choose an available Groq model",
                )
            raise SystemExit(1)
        log_json(LOG, "[BOOT]", models_checked=len(required), available=len(available))
    except RuntimeError as e:
        if "GROQ_API_KEY is required" in str(e):
            log_json(LOG, "[BOOT]", demo_mode=True, hint="Model validation skipped - configure Groq API key in admin console")
        else:
            raise


def _collect_required_models() -> Iterable[str]:
    return CONFIG.groq.models.all_models()


__all__ = ["ensure_models_available"]
