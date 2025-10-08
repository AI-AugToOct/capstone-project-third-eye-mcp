"""
Recoverable error system with actionable recovery instructions.

This module defines errors that agents can automatically recover from
by following provided instructions.
"""
from __future__ import annotations

from typing import Any, Dict, List


class RecoverableError(Exception):
    """
    Error that can be recovered from by following instructions.

    Unlike fatal errors, these provide:
    - Clear description of what went wrong
    - Step-by-step recovery instructions
    - Required inputs for retry
    - Whether automatic retry is safe
    """

    def __init__(
        self,
        message: str,
        *,
        error_code: str,
        recovery_steps: List[str],
        required_inputs: Dict[str, str] | None = None,
        auto_retryable: bool = False,
        retry_after_seconds: int | None = None,
        context: Dict[str, Any] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.recovery_steps = recovery_steps
        self.required_inputs = required_inputs or {}
        self.auto_retryable = auto_retryable
        self.retry_after_seconds = retry_after_seconds
        self.context = context or {}

    def to_agent_dict(self) -> Dict[str, Any]:
        """Convert to agent-friendly dictionary."""
        return {
            "error": self.message,
            "error_code": self.error_code,
            "recoverable": True,
            "recovery_steps": self.recovery_steps,
            "required_inputs": self.required_inputs,
            "auto_retryable": self.auto_retryable,
            "retry_after_seconds": self.retry_after_seconds,
            "context": self.context,
        }


class MissingReasoningError(RecoverableError):
    """Reasoning field required but not provided."""

    def __init__(self, tool_name: str):
        super().__init__(
            message=f"{tool_name} requires reasoning_md field",
            error_code="E_REASONING_MISSING",
            recovery_steps=[
                f"Add reasoning_md field to your {tool_name} request",
                "Provide detailed explanation of your approach and rationale",
                "Retry the request with reasoning included",
            ],
            required_inputs={
                "reasoning_md": "Markdown explanation of your approach, design decisions, and rationale"
            },
            auto_retryable=False,
        )


class BudgetExceededError(RecoverableError):
    """Token budget exceeded."""

    def __init__(self, requested: int, available: int, session_id: str):
        super().__init__(
            message=f"Requested {requested} tokens but only {available} available",
            error_code="E_BUDGET_EXCEEDED",
            recovery_steps=[
                f"Increase budget_tokens in context (currently {available})",
                "Or reduce scope of request to fit within budget",
                "Retry with adjusted budget or scope",
            ],
            required_inputs={
                "budget_tokens": f"Increase from {available} to at least {requested}"
            },
            auto_retryable=False,
            context={"requested": requested, "available": available, "session_id": session_id},
        )


class PipelineOrderError(RecoverableError):
    """Tool called out of order."""

    def __init__(self, attempted: str, expected: List[str], session_id: str):
        expected_str = ", ".join(expected) if expected else "overseer/navigator"
        super().__init__(
            message=f"Cannot call {attempted} yet. Call {expected_str} first",
            error_code="E_PIPELINE_OUT_OF_ORDER",
            recovery_steps=[
                f"Call one of these required tools first: {expected_str}",
                "Complete the prerequisite phase",
                f"Then retry {attempted}",
            ],
            required_inputs={},
            auto_retryable=False,
            context={
                "attempted": attempted,
                "expected_next": expected,
                "session_id": session_id,
            },
        )


class SchemaValidationError(RecoverableError):
    """Request payload doesn't match schema."""

    def __init__(self, tool_name: str, errors: List[str], example: Dict[str, Any] | None = None):
        error_list = "\n".join(f"  - {e}" for e in errors)
        super().__init__(
            message=f"{tool_name} payload validation failed:\n{error_list}",
            error_code="E_BAD_PAYLOAD_SCHEMA",
            recovery_steps=[
                "Review the tool's schema in the contract",
                "Fix the validation errors listed above",
                "Ensure all required fields are present",
                "Retry with corrected payload",
            ],
            required_inputs={},
            auto_retryable=False,
            context={"tool_name": tool_name, "validation_errors": errors, "example": example},
        )


class MissingContextError(RecoverableError):
    """Session context missing or invalid."""

    def __init__(self, issue: str):
        super().__init__(
            message=f"Invalid session context: {issue}",
            error_code="E_INVALID_CONTEXT",
            recovery_steps=[
                "Ensure context object contains required fields",
                "Required: session_id, lang, budget_tokens",
                "The MCP bridge should auto-inject context",
                "If calling directly, provide valid context",
            ],
            required_inputs={
                "context.session_id": "Unique session identifier",
                "context.lang": "Language code (auto, en, or ar)",
                "context.budget_tokens": "Token budget (0 for unlimited)",
            },
            auto_retryable=False,
            context={"issue": issue},
        )


class RateLimitError(RecoverableError):
    """Rate limit exceeded, retry after delay."""

    def __init__(self, retry_after: int):
        super().__init__(
            message=f"Rate limit exceeded. Retry after {retry_after} seconds",
            error_code="E_RATE_LIMIT",
            recovery_steps=[
                f"Wait {retry_after} seconds",
                "Retry the same request",
            ],
            required_inputs={},
            auto_retryable=True,
            retry_after_seconds=retry_after,
        )


class LLMTimeoutError(RecoverableError):
    """LLM call timed out."""

    def __init__(self, timeout_seconds: int):
        super().__init__(
            message=f"LLM request timed out after {timeout_seconds}s",
            error_code="E_LLM_TIMEOUT",
            recovery_steps=[
                "Retry the request (may succeed on next attempt)",
                "Or reduce request complexity to decrease processing time",
            ],
            required_inputs={},
            auto_retryable=True,
            retry_after_seconds=5,
        )


class LLMCircuitBreakerError(RecoverableError):
    """Circuit breaker open for LLM service."""

    def __init__(self, service: str, retry_after: int):
        super().__init__(
            message=f"LLM service {service} temporarily unavailable (circuit breaker open)",
            error_code="E_LLM_CIRCUIT_OPEN",
            recovery_steps=[
                f"Wait {retry_after} seconds for circuit breaker to reset",
                "Or use an alternative approach that doesn't require this service",
                "Retry after waiting period",
            ],
            required_inputs={},
            auto_retryable=True,
            retry_after_seconds=retry_after,
            context={"service": service},
        )


def to_http_response(error: RecoverableError, status_code: int = 400) -> Dict[str, Any]:
    """
    Convert recoverable error to HTTP response format.

    Args:
        error: Recoverable error instance
        status_code: HTTP status code (400 for client errors, 429 for rate limits, etc.)

    Returns:
        Dict suitable for FastAPI JSONResponse
    """
    response = error.to_agent_dict()
    response["status_code"] = status_code

    # Map error codes to HTTP status codes
    if error.error_code == "E_RATE_LIMIT":
        response["status_code"] = 429
    elif error.error_code in ("E_LLM_TIMEOUT", "E_LLM_CIRCUIT_OPEN"):
        response["status_code"] = 503
    elif error.error_code in ("E_REASONING_MISSING", "E_BAD_PAYLOAD_SCHEMA", "E_INVALID_CONTEXT"):
        response["status_code"] = 400
    elif error.error_code in ("E_BUDGET_EXCEEDED", "E_PIPELINE_OUT_OF_ORDER"):
        response["status_code"] = 409

    return response
