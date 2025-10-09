"""Overseer navigator tool providing pipeline guidance."""
from __future__ import annotations

import asyncio
import json
import time
import logging
from typing import Any, Dict

from ..constants import (
    DataKey,
    EyeTag,
    Heading,
    NEWLINE,
    NextAction,
    StatusCode,
)
from ..schemas import EyeResponse, NavigatorRequest, RequestContext
from ..examples import (
    EXAMPLE_CONTEXT,
    EXAMPLE_NAVIGATOR,
    EXAMPLE_SHARINGAN,
)
from ._shared import build_response, execute_eye, execute_eye_async
from .registry import get_registry, PipelinePhase

LOG = logging.getLogger(__name__)

_OVERVIEW_MD = (
    f"{Heading.OVERSEER_INTRO.value}{NEWLINE}"
    "Third Eye MCP is an Overseer. Host agents own all deliverables. This navigator is the required entry point; no other eye will respond until it runs." 
)

_REQUEST_ENVELOPE = {
    "context": {
        "session_id": "sess-<unique>",
        "user_id": "user-<optional>",
        "lang": "auto",
        "budget_tokens": 0,
    },
    "payload": {},
    "reasoning_md": "Required when submitting plans, diffs, tests, docs, or drafts.",
}

_REQUEST_SCHEMA_MD = (
    f"{Heading.REQUEST_ENVELOPE.value}{NEWLINE}"
    "Every tool call uses this JSON wrapper. The MCP bridge populates `context` automatically; clients only need to provide `payload` (and `reasoning_md` when required)."
    f"{NEWLINE}```json\n{json.dumps(_REQUEST_ENVELOPE, indent=2)}\n```"
)

_PIPELINE_MD = NEWLINE.join(
    [
        Heading.OVERSEER_NEXT_STEPS.value,
        "- The MCP bridge auto-populates session context; clients only send payload (and reasoning when required).",
        "- Call `sharingan/clarify` to score ambiguity and gather questions.",
        "- Use `helper/rewrite_prompt` to engineer a ROLE/TASK/CONTEXT/REQUIREMENTS/OUTPUT brief.",
        "- Run `jogan/confirm_intent` to ensure scope and token budgets are approved.",
        "- Follow the Code branch (Rinnegan + Mangekyō phases) for implementation work.",
        "- Follow the Text branch (Rinnegan -> Tenseigan -> Byakugan) for factual or narrative work.",
        "- Finish with `rinnegan/final_approval` once every gate returns ok=true.",
    ]
)

_CONTRACT = {
    "tools": {
        "overseer/navigator": {
            "purpose": "Explain contract and point to Sharingan.",
            "payload": {"goal": "Optional free-form description"},
        },
        "sharingan/clarify": {
            "payload": {"prompt": "string", "lang": "auto|en|ar"},
        },
        "helper/rewrite_prompt": {
            "payload": {
                "user_prompt": "string",
                "clarification_answers_md": "Markdown list responding to Sharingan questions",
            },
        },
        "jogan/confirm_intent": {
            "payload": {
                "refined_prompt_md": "Markdown from Prompt Helper",
                "estimated_tokens": "int",
            },
        },
        "rinnegan/plan_review": {
            "payload": {"submitted_plan_md": "Markdown plan"},
            "reasoning_md": "Explain plan rationale",
        },
        "mangekyo/review_scaffold": {
            "payload": {
                "files": "[{path, intent, reason}]",
            },
            "reasoning_md": "Explain file coverage",
        },
        "mangekyo/review_impl": {
            "payload": {"diffs_md": "```diff ...```"},
            "reasoning_md": "Explain design choices",
        },
        "mangekyo/review_tests": {
            "payload": {
                "diffs_md": "```diff ...```",
                "coverage_summary_md": "Coverage data",
            },
            "reasoning_md": "Explain coverage strategy",
        },
        "mangekyo/review_docs": {
            "payload": {"diffs_md": "```diff ...```"},
            "reasoning_md": "Explain documentation changes",
        },
        "tenseigan/validate_claims": {
            "payload": {"draft_md": "Markdown draft"},
            "reasoning_md": "Evidence gathering notes",
        },
        "byakugan/consistency_check": {
            "payload": {"topic": "string", "draft_md": "Markdown"},
            "reasoning_md": "Compare against history",
        },
        "rinnegan/final_approval": {
            "payload": {
                "plan_approved": "bool",
                "scaffold_approved": "bool",
                "impl_approved": "bool",
                "tests_approved": "bool",
                "docs_approved": "bool",
                "text_validated": "bool",
                "consistent": "bool",
            },
        },
    },
    "envelope": _REQUEST_ENVELOPE,
    "notes": {
        "reasoning_md": "Mandatory whenever submitting work product.",
        "session_id": "Keep constant so checks can reference history.",
        "budget_tokens": "Set >0 only if you want budgeting enforcement; negative budgets are rejected.",
    },
}

_EXAMPLE_REQUEST: Dict[str, Any] = {
    "payload": {
        "goal": "Generate a quarterly engineering report",
    },
}


async def navigate_async(raw: Dict[str, Any]) -> Dict[str, Any]:
    return await execute_eye_async(
        tag=EyeTag.OVERSEER,
        model=NavigatorRequest,
        handler=_handle,
        raw=raw,
        example=_EXAMPLE_REQUEST,
    )


def navigate(raw: Dict[str, Any]) -> Dict[str, Any]:
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(navigate_async(raw))
    raise RuntimeError("navigate() cannot be called from an active event loop; use await navigate_async() instead.")


def _handle(request: NavigatorRequest) -> EyeResponse:
    """Active orchestrator that delegates work based on goal analysis."""
    goal = request.payload.goal if request.payload else None
    context = request.context
    if context is None:
        context = RequestContext(
            session_id=f"sess-{int(time.time()*1000):x}",
            user_id=None,
            lang="auto",
            budget_tokens=0,
        )
        request.context = context

    registry = get_registry()

    # Mark entry phase complete
    registry.mark_phase_complete(context, PipelinePhase.ENTRY)

    # Get available next actions based on completed phases
    available_eyes = registry.list_available(context)
    completed_phases = registry.get_completed_phases(context)

    LOG.info(
        f"Navigator invoked for session {context.session_id}. "
        f"Completed phases: {[p.value for p in completed_phases]}. "
        f"Available eyes: {available_eyes}"
    )

    # Build orchestration guidance
    summary_lines = [_OVERVIEW_MD]
    if goal:
        summary_lines.append(
            f"**Goal**: {goal}\n\n"
            f"Navigator will actively orchestrate your pipeline using LLM analysis."
        )
        # LLM will determine the path - no hardcoded heuristics
        is_code = False
        is_text = False

        if is_code:
            path_guidance = (
                "1. **Clarification** (`sharingan/clarify`) - Identify ambiguities\n"
                "2. **Refinement** (`helper/rewrite_prompt`) - Structure requirements\n"
                "3. **Confirmation** (`jogan/confirm_intent`) - Validate scope\n"
                "4. **Planning** (`rinnegan/plan_review`) - Review implementation plan\n"
                "5. **Code Path**: Scaffold → Implementation → Tests → Docs\n"
                "6. **Final Approval** (`rinnegan/final_approval`) - Verify all gates pass"
            )
        elif is_text:
            path_guidance = (
                "1. **Clarification** (`sharingan/clarify`) - Identify ambiguities\n"
                "2. **Refinement** (`helper/rewrite_prompt`) - Structure brief\n"
                "3. **Confirmation** (`jogan/confirm_intent`) - Validate scope\n"
                "4. **Text Path**: Validate Claims → Consistency Check\n"
                "5. **Final Approval** (`rinnegan/final_approval`) - Verify all gates pass"
            )
        else:
            path_guidance = (
                "1. Start with `sharingan/clarify` to understand your requirements\n"
                "2. Navigator will guide you through the appropriate path"
            )

        summary_lines.append(f"\n{path_guidance}")
    else:
        summary_lines.append(
            "No goal provided. Start with `sharingan/clarify` to define your requirements."
        )

    md = NEWLINE.join(summary_lines)

    # Provide dynamic next action based on available eyes
    if "sharingan/clarify" in available_eyes:
        next_action = NextAction.BEGIN_WITH_SHARINGAN.value
    else:
        next_action = f"Available tools: {', '.join(available_eyes[:3])}"

    data = {
        DataKey.SUMMARY_MD.value: md,
        DataKey.INSTRUCTIONS_MD.value: _PIPELINE_MD,
        DataKey.SCHEMA_MD.value: _REQUEST_SCHEMA_MD,
        DataKey.EXAMPLE_MD.value: f"```json\n{json.dumps(_EXAMPLE_CLARIFY_CALL, indent=2)}\n```",
        DataKey.CONTRACT_JSON.value: _CONTRACT,
        DataKey.NEXT_ACTION_MD.value: f"{Heading.NEXT_ACTION.value}{NEWLINE}{next_action}",
        "session_context": context.model_dump(),
        "completed_phases": [p.value for p in completed_phases],
        "available_eyes": available_eyes,
        "orchestration_hint": "Navigator tracks your progress and dynamically suggests next steps",
    }

    return build_response(
        tag=EyeTag.OVERSEER,
        ok=True,
        code=StatusCode.OK_OVERSEER_GUIDE,
        md=md,
        data=data,
        next_action=next_action,
    )


async def orchestrate_async(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    The Overseer orchestrates intelligently with configurable validation strictness.
    This is the true entry point that decides which eyes to invoke.

    Set strict_mode=False to allow partial/draft submissions for iterative validation.
    """
    from ._shared import build_llm_response_async, build_response
    from .registry import get_registry
    from ._orchestrator import run_clarification_flow

    # Extract context and payload
    context = raw.get("context")
    if context is None:
        context = RequestContext(
            session_id=f"sess-{int(time.time()*1000):x}",
            user_id=None,
            lang="auto",
            budget_tokens=0,
        )
    elif isinstance(context, dict):
        context = RequestContext(**context)

    payload = raw.get("payload", {})
    reasoning_md = raw.get("reasoning_md", "")
    strict_mode = raw.get("strict_mode", True)

    # VALIDATION: Check required fields based on strictness mode
    validation_errors = []

    if not payload:
        validation_errors.append("payload is required and cannot be empty")
    else:
        intent = payload.get("intent", "")
        work = payload.get("work", {})
        context_info = payload.get("context_info", {})

        if strict_mode:
            if not intent or len(intent.strip()) < 5:
                validation_errors.append("intent is required (minimum 5 characters)")

            if not work or not isinstance(work, dict) or len(work) == 0:
                validation_errors.append("work is required and must contain at least one property")

            if not context_info or not isinstance(context_info, dict) or len(context_info) == 0:
                validation_errors.append("context_info is required and must contain at least one property")

            if not reasoning_md or len(reasoning_md.strip()) < 10:
                validation_errors.append("reasoning_md is required (minimum 10 characters)")
        else:
            if not intent or len(intent.strip()) < 1:
                validation_errors.append("intent is required (minimum 1 character in relaxed mode)")

    # REJECT only truly invalid submissions
    if validation_errors:
        return build_response(
            tag=EyeTag.OVERSEER,
            ok=False,
            code=StatusCode.E_BAD_PAYLOAD_SCHEMA,
            md=f"### 🚨 SUBMISSION REJECTED - INCOMPLETE\n\n**Validation mode: {'STRICT' if strict_mode else 'RELAXED'}**\n\n**Issues found:**\n" +
               "\n".join(f"- {error}" for error in validation_errors) +
               (f"\n\n**Required structure (strict mode):**\n```json\n{{\n  \"payload\": {{\n    \"intent\": \"Clear validation request (min 5 chars)\",\n    \"work\": {{ \"code|plan|draft|requirements\": \"actual content\" }},\n    \"context_info\": {{ \"project details\": \"values\" }}\n  }},\n  \"reasoning_md\": \"Your justification (min 10 chars)\",\n  \"strict_mode\": true\n}}\n```\n\n**Tip:** Set `\"strict_mode\": false` for partial/draft submissions." if strict_mode else
                "\n\n**Relaxed mode active** - Only intent is required for iterative validation.\n\n**Tip:** Set `\"strict_mode\": true` for full validation."),
            data={
                "validation_errors": validation_errors,
                "enforcement_level": "strict" if strict_mode else "relaxed",
                "submission_status": "rejected",
                "strict_mode": strict_mode,
                "session_context": context.model_dump()
            },
            next_action="Fix validation errors and resubmit complete work package"
        ).model_dump()

    registry = get_registry()
    intent = payload.get("intent", "")
    work = payload.get("work", {})
    context_info = payload.get("context_info", {})

    LOG.info(f"Overseer orchestrating for session {context.session_id}: {intent[:100]}...")

    # Step 1: The Overseer contemplates what to do using its persona
    try:
        orchestration_decision = await build_llm_response_async(
            tag=EyeTag.OVERSEER,
            tool=ToolName.OVERSEER_NAVIGATOR,
            persona=PersonaKey.OVERSEER,
            payload={
                "intent": intent,
                "work": work,
                "context_info": context_info,
                "session_history": _get_session_history(context.session_id),
                "completed_phases": [p.value for p in registry.get_completed_phases(context)]
            }
        )

        # Extract the orchestration plan from the LLM response
        plan_data = orchestration_decision.data
        eyes_needed = plan_data.get("eyes_needed", [])
        analysis = plan_data.get("analysis", "")
        reasoning = plan_data.get("reasoning", "")

        LOG.info(f"Overseer decision for {context.session_id}: {eyes_needed}")

    except Exception as e:
        LOG.error(f"Overseer LLM call failed: {e}")
        return build_response(
            tag=EyeTag.OVERSEER,
            ok=False,
            code=StatusCode.E_LLM_ERROR,
            md=f"### 🔴 LLM Connection Error\n\n**Unable to process orchestration request** due to LLM provider unavailability.\n\n**Error:** {str(e)}\n\n**Recovery Steps:**\n1. Check LLM provider status (Groq/OpenAI/etc.)\n2. Verify API keys and rate limits\n3. Check network connectivity\n4. Review health endpoint: `/health/ready`\n5. Retry request after provider recovery\n\n**Fallback Option:** If this persists, submit work directly to individual eyes:\n- `/sharingan/clarify` for ambiguity detection\n- `/rinnegan/plan_review` for plan validation\n- `/tenseigan/validate_claims` for fact-checking\n- `/byakugan/consistency_check` for consistency\n\n**Status:** Try again in 30 seconds or contact support if issue persists.",
            data={
                "error_type": "llm_unavailable",
                "error_message": str(e),
                "recovery_actions": [
                    "check_llm_provider_status",
                    "verify_api_credentials",
                    "check_network",
                    "review_health_endpoint",
                    "retry_after_30s"
                ],
                "fallback_endpoints": {
                    "clarification": "/sharingan/clarify",
                    "plan_review": "/rinnegan/plan_review",
                    "fact_check": "/tenseigan/validate_claims",
                    "consistency": "/byakugan/consistency_check"
                },
                "session_context": context.model_dump()
            },
            next_action="Check LLM provider health, then retry or use fallback endpoints"
        ).model_dump()

    # Step 2: Execute the orchestration plan
    if not eyes_needed:
        # Simple request - no validation needed
        return build_response(
            tag=EyeTag.OVERSEER,
            ok=True,
            code=StatusCode.OK_OVERSEER_GUIDE,
            md=f"### Request Analysis\n{analysis}\n\nRequest is clear and requires no validation.",
            data={
                "analysis": analysis,
                "reasoning": reasoning,
                "confidence": 1.0,
                "eyes_skipped": ["all"],
                "session_context": context.model_dump()
            },
            next_action="Proceed with implementation - no validation needed"
        ).model_dump()

    # Step 3: Intelligently orchestrate through needed eyes
    results = {}
    total_eyes = len(eyes_needed)

    try:
        from ..pipeline_bus import emit_progress_event

        await emit_progress_event(
            session_id=context.session_id,
            stage="orchestration_start",
            message="Starting intelligent orchestration",
            progress=0.0,
            total_stages=total_eyes + 2,
            current_stage=0,
        )

        for idx, eye_name in enumerate(eyes_needed):
            await emit_progress_event(
                session_id=context.session_id,
                stage=f"eye_{eye_name}",
                message=f"Executing {eye_name} validation",
                progress=(idx + 1) / (total_eyes + 2),
                total_stages=total_eyes + 2,
                current_stage=idx + 1,
            )

            if eye_name == "sharingan":
                # Use clarification flow for ambiguous requests
                result = await run_clarification_flow(context, intent, context.lang)
                if result.get("awaiting_user_input"):
                    return result  # Stop for clarification
                results["sharingan"] = result

            elif eye_name == "rinnegan" and work.get("plan"):
                # Validate submitted plans
                plan_result = await registry.invoke(
                    "rinnegan/plan_review",
                    context,
                    payload={"submitted_plan_md": work.get("plan")},
                    reasoning_md=work.get("reasoning", "Orchestrator validation")
                )
                if not plan_result.get("ok"):
                    return plan_result  # Stop for revision
                results["rinnegan"] = plan_result

            elif eye_name == "tenseigan" and work.get("draft"):
                # Validate factual claims in text
                claims_result = await registry.invoke(
                    "tenseigan/validate_claims",
                    context,
                    payload={"draft_md": work.get("draft")},
                    reasoning_md="Orchestrator fact-checking"
                )
                results["tenseigan"] = claims_result

            elif eye_name == "byakugan":
                # Check consistency if we have prior context
                if work.get("draft") and work.get("topic"):
                    consistency_result = await registry.invoke(
                        "byakugan/consistency_check",
                        context,
                        payload={
                            "topic": work.get("topic"),
                            "draft_md": work.get("draft")
                        },
                        reasoning_md="Orchestrator consistency check"
                    )
                    results["byakugan"] = consistency_result

        # Step 4: Synthesize results
        await emit_progress_event(
            session_id=context.session_id,
            stage="synthesis",
            message="Synthesizing validation results",
            progress=(total_eyes + 1) / (total_eyes + 2),
            total_stages=total_eyes + 2,
            current_stage=total_eyes + 1,
        )

        all_passed = all(r.get("ok", False) for r in results.values())
        confidence = _calculate_confidence(results)

        await emit_progress_event(
            session_id=context.session_id,
            stage="complete",
            message="Orchestration complete",
            progress=1.0,
            total_stages=total_eyes + 2,
            current_stage=total_eyes + 2,
        )

        return build_response(
            tag=EyeTag.OVERSEER,
            ok=all_passed,
            code=StatusCode.OK_OVERSEER_GUIDE if all_passed else StatusCode.E_ORCHESTRATION_FAILED,
            md=f"### Orchestration Complete\n{analysis}\n\n**Reasoning:** {reasoning}",
            data={
                "analysis": analysis,
                "reasoning": reasoning,
                "validations": results,
                "eyes_used": eyes_needed,
                "confidence": confidence,
                "session_context": context.model_dump()
            },
            next_action="Validation complete" if all_passed else "Address validation issues"
        ).model_dump()

    except Exception as e:
        LOG.error(f"Orchestration failed for {context.session_id}: {e}")
        return build_response(
            tag=EyeTag.OVERSEER,
            ok=False,
            code=StatusCode.E_ORCHESTRATION_FAILED,
            md=f"### ⚠️ Orchestration Error\n\n**Partial orchestration failure** during validation pipeline execution.\n\n**Error:** {str(e)}\n\n**Recovery Steps:**\n1. Review validation results in `data.validations` (partially completed)\n2. Check if specific eye failed (sharingan/rinnegan/tenseigan/byakugan)\n3. Retry orchestration after fixing identified issues\n4. If issue persists, submit directly to failing eye endpoint\n5. Contact support with session_id for debugging\n\n**Completed Validations:** {', '.join(results.keys()) if results else 'none'}\n\n**Failed At:** {eyes_needed[len(results)] if results and len(results) < len(eyes_needed) else 'unknown'}\n\n**Debug Info:**\n- Session: {context.session_id}\n- Intent: {intent[:50]}...\n- Eyes Planned: {', '.join(eyes_needed)}\n\n**Next Steps:** Fix the error above, then resubmit or contact support.",
            data={
                "analysis": analysis if 'analysis' in locals() else "Unknown",
                "error": str(e),
                "error_type": type(e).__name__,
                "completed_validations": list(results.keys()),
                "planned_eyes": eyes_needed if 'eyes_needed' in locals() else [],
                "partial_results": results if results else {},
                "recovery_actions": [
                    "review_partial_results",
                    "identify_failing_eye",
                    "retry_orchestration",
                    "use_direct_eye_endpoint",
                    "contact_support_with_session_id"
                ],
                "session_context": context.model_dump()
            },
            next_action="Fix identified error, then retry orchestration or contact support"
        ).model_dump()


def orchestrate(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Synchronous wrapper for orchestrate_async."""
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(orchestrate_async(raw))
    raise RuntimeError("orchestrate() cannot be called from an active event loop; use await orchestrate_async() instead.")


def _get_session_history(session_id: str) -> str:
    """Get session history for context (simplified for now)."""
    return f"Session {session_id} - history tracking not yet implemented"


def _fallback_orchestration(intent: str, work: Dict[str, Any]) -> list[str]:
    """Fallback orchestration logic when LLM is unavailable."""
    intent_lower = intent.lower()
    eyes = []

    # Simple heuristics as fallback
    # NO HEURISTICS - Fail loudly so we know LLM is required
    raise RuntimeError(
        "Overseer orchestration requires LLM for intelligent eye selection. "
        "Heuristic fallbacks removed - ensure Groq API key is configured."
    )


def _calculate_confidence(results: Dict[str, Any]) -> float:
    """Calculate overall confidence score from validation results."""
    if not results:
        return 1.0

    scores = []
    for result in results.values():
        if result.get("ok"):
            scores.append(0.9)
        else:
            scores.append(0.3)

    return sum(scores) / len(scores) if scores else 0.5


__all__ = ["navigate", "navigate_async", "orchestrate", "orchestrate_async"]
_EXAMPLE_CLARIFY_CALL = {
    "payload": EXAMPLE_SHARINGAN["payload"],
}
