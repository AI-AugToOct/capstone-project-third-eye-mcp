"""
Eye Registry: Enable eye-to-eye delegation and orchestration.

This registry allows Navigator and other eyes to invoke eyes directly,
transforming the system from reactive validation to active orchestration.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Awaitable, Callable, Dict, List, Set

from ..schemas import EyeResponse, RequestContext

LOG = logging.getLogger(__name__)


class PipelinePhase(str, Enum):
    """Pipeline phases for stage enforcement."""
    ENTRY = "entry"
    CLARIFICATION = "clarification"
    REFINEMENT = "refinement"
    CONFIRMATION = "confirmation"
    PLANNING = "planning"
    SCAFFOLDING = "scaffolding"
    IMPLEMENTATION = "implementation"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    VALIDATION = "validation"
    CONSISTENCY = "consistency"
    APPROVAL = "approval"


@dataclass
class EyeCapability:
    """Metadata describing an eye's capabilities and requirements."""

    name: str
    handler: Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]]
    phase: PipelinePhase
    description: str

    # Pipeline enforcement
    requires_phases: Set[PipelinePhase] = field(default_factory=set)
    provides_phases: Set[PipelinePhase] = field(default_factory=set)

    # Orchestration hints
    can_run_parallel: bool = False
    is_entry_point: bool = False
    requires_reasoning: bool = False

    # Dependencies
    requires_data_keys: Set[str] = field(default_factory=set)
    provides_data_keys: Set[str] = field(default_factory=set)


class EyeRegistry:
    """
    Registry for eye capabilities enabling dynamic orchestration.

    Responsibilities:
    - Register eyes with their capabilities and dependencies
    - Invoke eyes with proper context propagation
    - Track pipeline state per session
    - Enable Navigator to orchestrate multi-eye workflows
    """

    def __init__(self):
        self._eyes: Dict[str, EyeCapability] = {}
        self._phase_to_eyes: Dict[PipelinePhase, List[str]] = {}
        self._session_phases: Dict[str, Set[PipelinePhase]] = {}

    def register(self, capability: EyeCapability) -> None:
        """Register an eye capability."""
        if capability.name in self._eyes:
            LOG.warning(f"Eye '{capability.name}' already registered, overwriting")

        self._eyes[capability.name] = capability

        # Build phase index
        if capability.phase not in self._phase_to_eyes:
            self._phase_to_eyes[capability.phase] = []
        self._phase_to_eyes[capability.phase].append(capability.name)

        LOG.info(f"Registered eye '{capability.name}' for phase {capability.phase.value}")

    def get(self, name: str) -> EyeCapability | None:
        """Get eye capability by name."""
        return self._eyes.get(name)

    def get_by_phase(self, phase: PipelinePhase) -> List[EyeCapability]:
        """Get all eyes for a given phase."""
        eye_names = self._phase_to_eyes.get(phase, [])
        return [self._eyes[name] for name in eye_names if name in self._eyes]

    def list_available(self, context: RequestContext) -> List[str]:
        """List eyes available for current session state."""
        session_id = context.session_id
        completed = self._session_phases.get(session_id, set())

        available = []
        for name, cap in self._eyes.items():
            # Check if all required phases are completed
            if cap.requires_phases.issubset(completed):
                available.append(name)

        return available

    def mark_phase_complete(self, context: RequestContext, phase: PipelinePhase) -> None:
        """Mark a phase as completed for a session."""
        session_id = context.session_id
        if session_id not in self._session_phases:
            self._session_phases[session_id] = set()

        self._session_phases[session_id].add(phase)
        LOG.info(f"Session {session_id}: Phase {phase.value} completed")

    def get_completed_phases(self, context: RequestContext) -> Set[PipelinePhase]:
        """Get all completed phases for a session."""
        return self._session_phases.get(context.session_id, set()).copy()

    async def invoke(
        self,
        eye_name: str,
        context: RequestContext,
        payload: Dict[str, Any],
        reasoning_md: str | None = None,
    ) -> Dict[str, Any]:
        """
        Invoke an eye by name with context propagation.

        This is the core orchestration method that enables:
        - Navigator to delegate to other eyes
        - Eyes to invoke other eyes for sub-tasks
        - Full context propagation across invocations
        """
        capability = self._eyes.get(eye_name)
        if not capability:
            raise ValueError(f"Unknown eye: {eye_name}")

        # Check if requirements are met
        completed = self._session_phases.get(context.session_id, set())
        missing = capability.requires_phases - completed
        if missing:
            missing_names = [p.value for p in missing]
            raise RuntimeError(
                f"Eye '{eye_name}' requires phases {missing_names} to be completed first. "
                f"Completed phases: {[p.value for p in completed]}"
            )

        # Check reasoning requirement
        if capability.requires_reasoning and not reasoning_md:
            raise ValueError(f"Eye '{eye_name}' requires reasoning_md to be provided")

        # Build request envelope
        request_envelope = {
            "context": context.model_dump(),
            "payload": payload,
        }
        if reasoning_md:
            request_envelope["reasoning_md"] = reasoning_md

        LOG.info(f"Invoking eye '{eye_name}' for session {context.session_id}")

        # Invoke handler
        response = await capability.handler(request_envelope)

        # Mark phases as complete if successful
        if response.get("ok"):
            for phase in capability.provides_phases:
                self.mark_phase_complete(context, phase)

        return response

    def can_invoke(self, eye_name: str, context: RequestContext) -> tuple[bool, str]:
        """
        Check if an eye can be invoked in current state.

        Returns:
            (can_invoke, reason)
        """
        capability = self._eyes.get(eye_name)
        if not capability:
            return False, f"Unknown eye: {eye_name}"

        completed = self._session_phases.get(context.session_id, set())
        missing = capability.requires_phases - completed

        if missing:
            missing_names = [p.value for p in missing]
            return False, f"Missing required phases: {missing_names}"

        return True, "OK"

    def reset_session(self, session_id: str) -> None:
        """Clear session state (useful for testing or session cleanup)."""
        if session_id in self._session_phases:
            del self._session_phases[session_id]
            LOG.info(f"Reset session state for {session_id}")


# Global registry instance
EYE_REGISTRY = EyeRegistry()


def get_registry() -> EyeRegistry:
    """Get the global eye registry instance."""
    return EYE_REGISTRY
