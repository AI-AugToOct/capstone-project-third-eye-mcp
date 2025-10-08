"""Authoritative example payloads for Eye schemas."""
from __future__ import annotations

EXAMPLE_CONTEXT = {
    "session_id": "sess-1736172840-a7b3c4d",
    "user_id": "u-1736172840-dev001",
    "lang": "en",
    "budget_tokens": 2000,
}

EXAMPLE_SHARINGAN = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "prompt": "Create a REST API for user authentication with JWT tokens",
        "lang": "en",
    },
}

EXAMPLE_PROMPT_HELPER = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "user_prompt": "Build a user dashboard with analytics",
        "clarification_answers_md": "### Clarification Answers\n1. Target audience: Business users\n2. Technology stack: React + FastAPI\n3. Analytics scope: User activity metrics\n4. Timeline: 2-week sprint",
    },
}

EXAMPLE_JOGAN = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "refined_prompt_md": "### ROLE\nFull-stack developer with React and Python expertise\n\n### TASK\nBuild user analytics dashboard with real-time metrics\n\n### CONTEXT\n- Modern web application\n- Business intelligence requirements\n- Production deployment target\n\n### REQUIREMENTS\n- Responsive design for desktop and mobile\n- Real-time data updates via WebSocket\n- Export functionality for reports\n- Role-based access control\n\n### OUTPUT\n- Complete React frontend application\n- FastAPI backend with database integration\n- Comprehensive test suite\n- Deployment documentation",
        "estimated_tokens": 3500,
    },
}

EXAMPLE_PLAN_REQUIREMENTS = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "summary_md": "### Summary\nImplement real-time user analytics dashboard with WebSocket integration, role-based access, and export capabilities",
    },
}

EXAMPLE_PLAN_REVIEW = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "submitted_plan_md": "### Implementation Plan\n\n#### Phase 1: Backend Infrastructure\n- Set up FastAPI application structure\n- Design database schema for analytics data\n- Implement WebSocket endpoints for real-time updates\n\n#### Phase 2: Frontend Development\n- Create React dashboard components\n- Implement chart visualization with D3.js\n- Add responsive design for mobile devices\n\n#### Phase 3: Integration & Testing\n- Connect frontend to WebSocket endpoints\n- Write comprehensive test suite\n- Performance optimization and caching",
    },
    "reasoning_md": "### Reasoning\nThis phased approach ensures stable incremental delivery. Backend-first approach allows parallel frontend development. WebSocket integration is critical for real-time requirements.",
}

EXAMPLE_FINAL_APPROVAL = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "plan_approved": True,
        "scaffold_approved": True,
        "impl_approved": True,
        "tests_approved": True,
        "docs_approved": True,
        "text_validated": True,
        "consistent": True,
    },
}

EXAMPLE_SCAFFOLD = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "files": [
            {"path": "src/app.py", "intent": "modify", "reason": "Update handler"},
        ],
    },
    "reasoning_md": "Covers affected files",
}

EXAMPLE_IMPL = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "diffs_md": "```diff\n+ new code\n- old code\n```",
    },
    "reasoning_md": "Explains trade-offs and risks.",
}

EXAMPLE_TESTS = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "diffs_md": "```diff\n+ new test\n```",
        "coverage_summary_md": "lines: 90%\nbranches: 85%",
    },
    "reasoning_md": "Coverage summary",
}

EXAMPLE_DOCS = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "diffs_md": "```diff\n+ Update README\n```",
    },
    "reasoning_md": "Document changes",
}

EXAMPLE_TENSEIGAN = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "draft_md": (
            "### Analytics Dashboard Market Analysis\n\n"
            "Real-time analytics dashboards have seen 35% growth in enterprise adoption over the past year. "
            "WebSocket-based solutions show 40% better performance than traditional polling methods.\n\n"
            "### Citations\n"
            "| Claim | Source | Confidence |\n"
            "|-------|---------|------------|\n"
            "| 35% growth in enterprise adoption | TechReport Analytics 2024 | 0.9 |\n"
            "| 40% better WebSocket performance | Real-time Systems Benchmark 2024 | 0.85 |"
        ),
    },
    "reasoning_md": "Evidence review",
}

EXAMPLE_BYAKUGAN = {
    "context": EXAMPLE_CONTEXT,
    "payload": {
        "topic": "analytics-dashboard-implementation",
        "draft_md": "### Implementation Status\nAnalytics dashboard shows real-time user engagement metrics. WebSocket connections maintain sub-100ms latency. Export functionality supports CSV and PDF formats.",
    },
    "reasoning_md": "Verifying consistency with technical requirements and performance benchmarks established in earlier phases.",
}

EXAMPLE_NAVIGATOR = {
    "context": EXAMPLE_CONTEXT,
    "payload": {"goal": "Build a production-ready analytics dashboard with real-time capabilities"},
}

__all__ = [
    "EXAMPLE_CONTEXT",
    "EXAMPLE_SHARINGAN",
    "EXAMPLE_PROMPT_HELPER",
    "EXAMPLE_JOGAN",
    "EXAMPLE_PLAN_REQUIREMENTS",
    "EXAMPLE_PLAN_REVIEW",
    "EXAMPLE_FINAL_APPROVAL",
    "EXAMPLE_SCAFFOLD",
    "EXAMPLE_IMPL",
    "EXAMPLE_TESTS",
    "EXAMPLE_DOCS",
    "EXAMPLE_TENSEIGAN",
    "EXAMPLE_BYAKUGAN",
    "EXAMPLE_NAVIGATOR",
]
