"""
Initialize Eye Registry with all eye capabilities.

This module registers all eyes with their capabilities, dependencies,
and orchestration metadata at application startup.
"""
from __future__ import annotations

import logging

from .registry import EYE_REGISTRY, EyeCapability, PipelinePhase
from ..constants import DataKey

LOG = logging.getLogger(__name__)


def register_all_eyes() -> None:
    """Register all eyes in the registry at application startup."""

    # Import all eye handlers
    from .overseer import navigate_async
    from .sharingan import clarify_async
    from .helper.rewrite_prompt import rewrite_prompt_async
    from .jogan import confirm_intent_async
    from .rinnegan import (
        plan_requirements_async,
        plan_review_async,
        final_approval_async,
    )
    from .mangekyo import (
        review_scaffold_async,
        review_impl_async,
        review_tests_async,
        review_docs_async,
    )
    from .tenseigan import validate_claims_async
    from .byakugan import consistency_check_async

    # ========== Entry Point ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="overseer/navigator",
            handler=navigate_async,
            phase=PipelinePhase.ENTRY,
            description="Entry point - explains contract and initiates pipeline",
            is_entry_point=True,
            can_run_parallel=False,
            requires_reasoning=False,
            requires_phases=set(),
            provides_phases={PipelinePhase.ENTRY},
            provides_data_keys={
                DataKey.SUMMARY_MD.value,
                DataKey.INSTRUCTIONS_MD.value,
                DataKey.SCHEMA_MD.value,
                DataKey.CONTRACT_JSON.value,
            },
        )
    )

    # ========== Clarification Phase ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="sharingan/clarify",
            handler=clarify_async,
            phase=PipelinePhase.CLARIFICATION,
            description="Analyze prompt ambiguity and generate clarifying questions",
            can_run_parallel=False,
            requires_reasoning=False,
            requires_phases={PipelinePhase.ENTRY},
            provides_phases={PipelinePhase.CLARIFICATION},
            provides_data_keys={
                DataKey.SCORE.value,
                DataKey.QUESTIONS_MD.value,
            },
        )
    )

    # ========== Refinement Phase ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="helper/rewrite_prompt",
            handler=rewrite_prompt_async,
            phase=PipelinePhase.REFINEMENT,
            description="Transform user prompt + answers into structured ROLE/TASK/CONTEXT brief",
            can_run_parallel=False,
            requires_reasoning=False,
            requires_phases={PipelinePhase.CLARIFICATION},
            provides_phases={PipelinePhase.REFINEMENT},
            requires_data_keys={DataKey.QUESTIONS_MD.value},
            provides_data_keys={DataKey.PROMPT_MD.value},
        )
    )

    # ========== Confirmation Phase ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="jogan/confirm_intent",
            handler=confirm_intent_async,
            phase=PipelinePhase.CONFIRMATION,
            description="Validate refined prompt structure and confirm intent",
            can_run_parallel=False,
            requires_reasoning=False,
            requires_phases={PipelinePhase.REFINEMENT},
            provides_phases={PipelinePhase.CONFIRMATION},
            requires_data_keys={DataKey.PROMPT_MD.value},
        )
    )

    # ========== Planning Phase ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="rinnegan/plan_requirements",
            handler=plan_requirements_async,
            phase=PipelinePhase.PLANNING,
            description="Extract and structure requirements from brief",
            can_run_parallel=False,
            requires_reasoning=False,
            requires_phases={PipelinePhase.CONFIRMATION},
            provides_phases={PipelinePhase.PLANNING},
        )
    )

    EYE_REGISTRY.register(
        EyeCapability(
            name="rinnegan/plan_review",
            handler=plan_review_async,
            phase=PipelinePhase.PLANNING,
            description="Review submitted implementation plan",
            can_run_parallel=False,
            requires_reasoning=True,
            requires_phases={PipelinePhase.CONFIRMATION},
            provides_phases={PipelinePhase.PLANNING},
        )
    )

    # ========== Scaffolding Phase ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="mangekyo/review_scaffold",
            handler=review_scaffold_async,
            phase=PipelinePhase.SCAFFOLDING,
            description="Review file structure and scaffold decisions",
            can_run_parallel=False,
            requires_reasoning=True,
            requires_phases={PipelinePhase.PLANNING},
            provides_phases={PipelinePhase.SCAFFOLDING},
        )
    )

    # ========== Implementation Phase ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="mangekyo/review_impl",
            handler=review_impl_async,
            phase=PipelinePhase.IMPLEMENTATION,
            description="Review implementation diffs for correctness and design",
            can_run_parallel=False,
            requires_reasoning=True,
            requires_phases={PipelinePhase.SCAFFOLDING},
            provides_phases={PipelinePhase.IMPLEMENTATION},
        )
    )

    # ========== Testing Phase ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="mangekyo/review_tests",
            handler=review_tests_async,
            phase=PipelinePhase.TESTING,
            description="Review test coverage and test quality",
            can_run_parallel=False,
            requires_reasoning=True,
            requires_phases={PipelinePhase.IMPLEMENTATION},
            provides_phases={PipelinePhase.TESTING},
        )
    )

    # ========== Documentation Phase ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="mangekyo/review_docs",
            handler=review_docs_async,
            phase=PipelinePhase.DOCUMENTATION,
            description="Review documentation completeness and clarity",
            can_run_parallel=False,
            requires_reasoning=True,
            requires_phases={PipelinePhase.IMPLEMENTATION},
            provides_phases={PipelinePhase.DOCUMENTATION},
        )
    )

    # ========== Validation Phase (Text Branch) ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="tenseigan/validate_claims",
            handler=validate_claims_async,
            phase=PipelinePhase.VALIDATION,
            description="Validate factual claims in text drafts",
            can_run_parallel=False,
            requires_reasoning=True,
            requires_phases={PipelinePhase.CONFIRMATION},
            provides_phases={PipelinePhase.VALIDATION},
        )
    )

    # ========== Consistency Phase (Text Branch) ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="byakugan/consistency_check",
            handler=consistency_check_async,
            phase=PipelinePhase.CONSISTENCY,
            description="Check consistency across drafts and history",
            can_run_parallel=False,
            requires_reasoning=True,
            requires_phases={PipelinePhase.VALIDATION},
            provides_phases={PipelinePhase.CONSISTENCY},
        )
    )

    # ========== Final Approval ==========
    EYE_REGISTRY.register(
        EyeCapability(
            name="rinnegan/final_approval",
            handler=final_approval_async,
            phase=PipelinePhase.APPROVAL,
            description="Final gate - verify all pipeline gates passed",
            can_run_parallel=False,
            requires_reasoning=False,
            requires_phases={
                PipelinePhase.PLANNING,
                # Either code or text branch must complete
            },
            provides_phases={PipelinePhase.APPROVAL},
        )
    )

    LOG.info(f"Registered {len(EYE_REGISTRY._eyes)} eyes in registry")


# Call at module import time to ensure registry is populated
register_all_eyes()
