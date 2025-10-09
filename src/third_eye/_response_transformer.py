"""
Transform internal EyeResponse format to agent-friendly format.

This module bridges the gap between our internal validation responses
and what agents need to understand and act on.
"""
from __future__ import annotations

from typing import Any, Dict, List

from .constants import StatusCode, NextAction
from .schemas import AgentToolResponse


def to_agent_response(eye_result: Dict[str, Any]) -> AgentToolResponse:
    """
    Transform internal eye response to agent-friendly format.

    Args:
        eye_result: Raw eye response with ok, code, md, data, etc.

    Returns:
        AgentToolResponse with clear guidance
    """
    ok = eye_result.get("ok", False)
    code = eye_result.get("code", "")
    md = eye_result.get("md", "")
    data = eye_result.get("data", {})
    next_action = eye_result.get("next_action", "")

    # Extract available tools from data if present
    available_tools = data.get("available_eyes", [])
    if not available_tools and "next_action_md" in data:
        # Parse from next_action_md if available
        pass

    # Build agent-friendly message
    if ok:
        message = _build_success_message(code, md, data)
        next_action_text = _build_next_action(next_action, data)

        return AgentToolResponse(
            success=True,
            message=message,
            next_action=next_action_text,
            available_tools=available_tools or None,
            data=data,
            can_retry=False,
        )
    else:
        message = _build_error_message(code, md, data)
        recovery_hint = _build_recovery_hint(code, data)
        can_retry = _is_retryable(code)

        return AgentToolResponse(
            success=False,
            message=message,
            error=md,
            recovery_hint=recovery_hint,
            can_retry=can_retry,
            data=data,
        )


def _build_success_message(code: str, md: str, data: Dict[str, Any]) -> str:
    """Build clear success message from response."""
    # Map status codes to friendly messages
    if code == StatusCode.OK_OVERSEER_GUIDE.value:
        return "Navigator initialized. Pipeline guidance ready."
    elif code == StatusCode.OK_SHARINGAN_NO_QUESTIONS.value:
        return "Prompt is clear. No clarification needed."
    elif code == StatusCode.OK_SHARINGAN_QUESTIONS.value:
        q_count = len(data.get("questions", []))
        return f"Found {q_count} ambiguities. Answer questions to proceed."
    elif code == StatusCode.OK_JOGAN_APPROVED.value:
        return "Intent confirmed. Requirements validated."
    elif code == StatusCode.OK_PLAN_APPROVED.value:
        return "Plan approved. Proceed with implementation."
    elif "APPROVED" in code:
        return "Review passed. Continue to next phase."
    else:
        # Default: use markdown summary
        return md.split("\n")[0] if md else "Operation completed successfully."


def _build_error_message(code: str, md: str, data: Dict[str, Any]) -> str:
    """Build clear error message from response."""
    # Map error codes to friendly messages
    if code == StatusCode.E_BAD_PAYLOAD_SCHEMA.value:
        return "Invalid request format. Check payload schema."
    elif code == StatusCode.E_BUDGET_EXCEEDED.value:
        return "Token budget exceeded. Reduce scope or increase budget."
    elif code == StatusCode.E_REASONING_MISSING.value:
        return "Reasoning required but not provided."
    elif code == StatusCode.E_PIPELINE_OUT_OF_ORDER.value:
        return "Pipeline order violation. Complete prerequisites first."
    elif "FAILED" in code:
        return f"Validation failed: {md}"
    else:
        return md if md else "Operation failed."


def _build_next_action(next_action: str, data: Dict[str, Any]) -> str | None:
    """Build clear next action instruction."""
    if not next_action:
        return None

    # Enhance next action with specifics
    if next_action == NextAction.BEGIN_WITH_SHARINGAN.value:
        return "Call sharingan/clarify with your prompt to identify ambiguities"
    elif next_action == NextAction.SUBMIT_CLARIFICATION.value:
        return "Call helper/rewrite_prompt with clarification answers"
    elif next_action == NextAction.CONFIRM_INTENT.value:
        return "Call jogan/confirm_intent with refined prompt"
    elif next_action == NextAction.REVIEW_PLAN.value:
        return "Call rinnegan/plan_review with your implementation plan"
    elif "scaffold" in next_action.lower():
        return "Call mangekyo/review_scaffold with file structure"
    elif "impl" in next_action.lower():
        return "Call mangekyo/review_impl with implementation diffs"
    else:
        return next_action


def _build_recovery_hint(code: str, data: Dict[str, Any]) -> str | None:
    """Provide recovery hints for errors."""
    if code == StatusCode.E_BAD_PAYLOAD_SCHEMA.value:
        return "Check the schema in the contract. Ensure all required fields are present."
    elif code == StatusCode.E_BUDGET_EXCEEDED.value:
        return "Increase budget_tokens in context or reduce request scope."
    elif code == StatusCode.E_REASONING_MISSING.value:
        return "Add reasoning_md field with explanation of your approach."
    elif code == StatusCode.E_PIPELINE_OUT_OF_ORDER.value:
        expected = data.get("expected_next", [])
        if expected:
            return f"Call one of these tools first: {', '.join(expected)}"
        return "Check pipeline status and call required prerequisite tools."
    else:
        return None


def _is_retryable(code: str) -> bool:
    """Determine if error is retryable."""
    # Schema errors are not retryable (need to fix request)
    non_retryable = {
        StatusCode.E_BAD_PAYLOAD_SCHEMA.value,
        StatusCode.E_REASONING_MISSING.value,
    }

    # These can be retried after changes
    retryable = {
        StatusCode.E_BUDGET_EXCEEDED.value,
        StatusCode.E_PIPELINE_OUT_OF_ORDER.value,
    }

    if code in non_retryable:
        return False
    if code in retryable:
        return True

    # Default: assume retryable for transient errors
    return "INTERNAL" in code or "TIMEOUT" in code


def wrap_response_with_agent_format(eye_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Wrap eye result with agent-friendly format while preserving original.

    Returns:
        Dict with both 'agent_response' and original fields
    """
    agent_response = to_agent_response(eye_result)

    return {
        **eye_result,  # Preserve original response
        "agent_response": agent_response.model_dump(),  # Add agent-friendly version
    }
