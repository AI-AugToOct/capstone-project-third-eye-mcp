"""
Orchestration utilities for Navigator to actively invoke eyes.

This module provides higher-level orchestration patterns that Navigator
can use to delegate complex workflows across multiple eyes.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from ..schemas import RequestContext
from .registry import get_registry, PipelinePhase

LOG = logging.getLogger(__name__)


class OrchestrationError(Exception):
    """Raised when orchestration fails."""

    pass


async def run_clarification_flow(
    context: RequestContext, prompt: str, lang: str = "auto"
) -> Dict[str, Any]:
    """
    Run the clarification flow: Sharingan -> Helper -> Jogan.

    This is a common pattern that Navigator can use to process
    an ambiguous prompt into a refined, confirmed brief.

    Returns:
        Final Jogan response with refined prompt and approval
    """
    registry = get_registry()

    LOG.info(f"[Orchestrator] Starting clarification flow for session {context.session_id}")

    # Step 1: Sharingan clarify
    try:
        clarify_result = await registry.invoke(
            "sharingan/clarify",
            context,
            payload={"prompt": prompt, "lang": lang},
        )
        if not clarify_result.get("ok"):
            raise OrchestrationError(f"Sharingan failed: {clarify_result.get('md')}")

        questions = clarify_result.get("data", {}).get("questions", [])
        LOG.info(f"[Orchestrator] Sharingan generated {len(questions)} questions")

    except Exception as e:
        LOG.error(f"[Orchestrator] Sharingan invocation failed: {e}")
        raise OrchestrationError(f"Clarification failed at Sharingan: {e}") from e

    # Step 2: If no questions, we can skip to confirmation
    if not questions or len(questions) == 0:
        LOG.info("[Orchestrator] No clarification needed, creating structured brief")
        # Create a proper structured prompt based on the original request
        refined_prompt = f"""### ROLE
Task executor with full domain knowledge

### TASK
{prompt}

### CONTEXT
- Direct user request requiring implementation
- No clarification needed - prompt is sufficiently clear
- Standard quality and documentation requirements apply

### REQUIREMENTS
- Follow best practices for the domain
- Include appropriate error handling
- Provide clear documentation
- Test thoroughly before delivery

### OUTPUT
Deliver the requested solution with:
- Clean, maintainable code
- Comprehensive documentation
- Test coverage where applicable
- Clear usage instructions"""

        # Estimate tokens based on prompt complexity
        estimated_tokens = max(1000, len(prompt.split()) * 150)  # ~150 tokens per word complexity
    else:
        # Return control with instructions for user input
        return {
            "ok": True,
            "orchestration_status": "awaiting_user_input",
            "message": "Clarification questions generated. Provide answers to proceed.",
            "questions": questions,
            "next_step": "Invoke helper/rewrite_prompt with clarification_answers_md",
            "session_id": context.session_id,
        }

    # Step 3: Jogan confirm (assuming we have refined prompt)
    try:
        confirm_result = await registry.invoke(
            "jogan/confirm_intent",
            context,
            payload={
                "refined_prompt_md": refined_prompt,
                "estimated_tokens": estimated_tokens,
            },
        )
        LOG.info("[Orchestrator] Clarification flow completed")
        return confirm_result

    except Exception as e:
        LOG.error(f"[Orchestrator] Jogan invocation failed: {e}")
        raise OrchestrationError(f"Confirmation failed at Jogan: {e}") from e


async def run_code_pipeline(
    context: RequestContext,
    plan_md: str,
    reasoning_md: str,
) -> Dict[str, Any]:
    """
    Run the full code pipeline: Plan Review -> Scaffold -> Impl -> Tests -> Docs.

    This orchestrates the complete code review workflow.

    Args:
        context: Session context
        plan_md: Markdown plan to review
        reasoning_md: Reasoning for the plan

    Returns:
        Results from each phase
    """
    registry = get_registry()
    results = {}

    LOG.info(f"[Orchestrator] Starting code pipeline for session {context.session_id}")

    # Phase 1: Plan Review
    try:
        plan_result = await registry.invoke(
            "rinnegan/plan_review",
            context,
            payload={"submitted_plan_md": plan_md},
            reasoning_md=reasoning_md,
        )
        results["plan_review"] = plan_result

        if not plan_result.get("ok"):
            return {
                "ok": False,
                "phase_failed": "plan_review",
                "message": "Plan review failed. Address feedback before proceeding.",
                "results": results,
            }

    except Exception as e:
        LOG.error(f"[Orchestrator] Plan review failed: {e}")
        return {
            "ok": False,
            "phase_failed": "plan_review",
            "error": str(e),
            "results": results,
        }

    LOG.info("[Orchestrator] Code pipeline: Plan approved, awaiting scaffold")

    return {
        "ok": True,
        "orchestration_status": "plan_approved",
        "message": "Plan approved. Submit scaffold via mangekyo/review_scaffold to continue.",
        "next_phase": "scaffolding",
        "results": results,
    }


async def run_text_pipeline(
    context: RequestContext,
    draft_md: str,
    topic: str,
    reasoning_md: str,
) -> Dict[str, Any]:
    """
    Run the text pipeline: Tenseigan (validate claims) -> Byakugan (consistency).

    Args:
        context: Session context
        draft_md: Text draft to validate
        topic: Topic of the draft
        reasoning_md: Evidence and reasoning

    Returns:
        Validation results
    """
    registry = get_registry()
    results = {}

    LOG.info(f"[Orchestrator] Starting text pipeline for session {context.session_id}")

    # Phase 1: Validate claims
    try:
        validate_result = await registry.invoke(
            "tenseigan/validate_claims",
            context,
            payload={"draft_md": draft_md},
            reasoning_md=reasoning_md,
        )
        results["validate_claims"] = validate_result

        if not validate_result.get("ok"):
            return {
                "ok": False,
                "phase_failed": "validate_claims",
                "message": "Claim validation failed. Address issues before proceeding.",
                "results": results,
            }

    except Exception as e:
        LOG.error(f"[Orchestrator] Claim validation failed: {e}")
        return {
            "ok": False,
            "phase_failed": "validate_claims",
            "error": str(e),
            "results": results,
        }

    # Phase 2: Consistency check
    try:
        consistency_result = await registry.invoke(
            "byakugan/consistency_check",
            context,
            payload={"topic": topic, "draft_md": draft_md},
            reasoning_md=reasoning_md,
        )
        results["consistency_check"] = consistency_result

        if not consistency_result.get("ok"):
            return {
                "ok": False,
                "phase_failed": "consistency_check",
                "message": "Consistency check failed. Resolve inconsistencies.",
                "results": results,
            }

    except Exception as e:
        LOG.error(f"[Orchestrator] Consistency check failed: {e}")
        return {
            "ok": False,
            "phase_failed": "consistency_check",
            "error": str(e),
            "results": results,
        }

    LOG.info("[Orchestrator] Text pipeline completed successfully")

    return {
        "ok": True,
        "orchestration_status": "text_validated",
        "message": "Text pipeline complete. Proceed to final_approval.",
        "results": results,
    }


def get_pipeline_status(context: RequestContext) -> Dict[str, Any]:
    """
    Get current pipeline status for a session.

    Returns:
        Status summary with completed phases and next available steps
    """
    registry = get_registry()
    completed = registry.get_completed_phases(context)
    available = registry.list_available(context)

    return {
        "session_id": context.session_id,
        "completed_phases": [p.value for p in completed],
        "available_eyes": available,
        "in_code_path": PipelinePhase.SCAFFOLDING in completed
        or PipelinePhase.IMPLEMENTATION in completed,
        "in_text_path": PipelinePhase.VALIDATION in completed,
        "ready_for_approval": (
            PipelinePhase.DOCUMENTATION in completed
            or PipelinePhase.CONSISTENCY in completed
        ),
    }
