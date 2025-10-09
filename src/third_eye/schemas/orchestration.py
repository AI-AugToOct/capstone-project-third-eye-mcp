"""Schemas for orchestration requests and responses."""
from __future__ import annotations

from typing import Any, Dict, List

from pydantic import Field

from .common import RequestContext, StrictBaseModel


class OrchestrationFlowRequest(StrictBaseModel):
    """Request to run an automated orchestration flow."""

    context: RequestContext
    flow_type: str = Field(..., description="Flow to run: clarification, code_pipeline, text_pipeline")
    params: Dict[str, Any] = Field(default_factory=dict, description="Flow-specific parameters")


class OrchestrationStatusRequest(StrictBaseModel):
    """Request pipeline status for a session."""

    context: RequestContext


class AgentToolResponse(StrictBaseModel):
    """
    Agent-friendly tool response format.

    This format provides clear guidance on what to do next,
    making it easier for agents to understand and act.
    """

    success: bool = Field(..., description="Whether the operation succeeded")
    message: str = Field(..., description="Human-readable status message")

    # Guidance for next action
    next_action: str | None = Field(None, description="What the agent should do next")
    available_tools: List[str] | None = Field(None, description="Tools currently available to call")
    required_inputs: Dict[str, str] | None = Field(
        None,
        description="Inputs needed for next step (key: field name, value: description)"
    )

    # Original response data
    data: Dict[str, Any] | None = Field(None, description="Structured response data")
    error: str | None = Field(None, description="Error message if failed")

    # Recovery information
    can_retry: bool = Field(False, description="Whether this operation can be retried")
    retry_after_seconds: int | None = Field(None, description="Wait time before retry")
    recovery_hint: str | None = Field(
        None,
        description="Suggestion for how to recover from error"
    )


class PipelineStatusResponse(StrictBaseModel):
    """Pipeline status summary."""

    session_id: str
    completed_phases: List[str]
    available_eyes: List[str]
    in_code_path: bool
    in_text_path: bool
    ready_for_approval: bool
    next_recommended_action: str | None = None
