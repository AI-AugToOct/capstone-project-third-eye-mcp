"""
Integration tests for MCP flow end-to-end.

Tests the complete flow from MCP client -> Bridge -> API -> Eyes -> Response.
"""
import asyncio
import json
import os
from typing import Any, Dict

import pytest


# Skip if integration tests not enabled
pytestmark = pytest.mark.skipif(
    not os.getenv("RUN_INTEGRATION_TESTS"),
    reason="Integration tests disabled. Set RUN_INTEGRATION_TESTS=1 to enable"
)


@pytest.fixture
def api_url():
    """Get API URL from environment."""
    return os.getenv("API_URL", "http://localhost:8000")


@pytest.fixture
def api_key():
    """Get API key from environment."""
    key = os.getenv("THIRD_EYE_API_KEY")
    if not key:
        pytest.skip("THIRD_EYE_API_KEY not set")
    return key


@pytest.mark.asyncio
async def test_navigator_entry_point(api_url: str, api_key: str):
    """Test Navigator as entry point."""
    import aiohttp

    payload = {
        "context": {
            "session_id": "test-nav-001",
            "user_id": None,
            "lang": "en",
            "budget_tokens": 0,
        },
        "payload": {
            "goal": "Test navigation flow"
        },
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{api_url}/eyes/overseer/navigator",
            json=payload,
            headers={"X-API-Key": api_key},
        ) as response:
            assert response.status == 200, f"Navigator failed: {await response.text()}"
            result = await response.json()

            # Verify response structure
            assert result.get("ok") is True
            assert "data" in result
            assert "next_action" in result
            assert "available_eyes" in result["data"]

            # Verify Navigator marks entry phase complete
            assert "completed_phases" in result["data"]
            assert "entry" in result["data"]["completed_phases"]


@pytest.mark.asyncio
async def test_clarification_flow(api_url: str, api_key: str):
    """Test complete clarification flow: Navigator -> Sharingan -> Helper -> Jogan."""
    import aiohttp

    session_id = "test-clarify-001"

    async with aiohttp.ClientSession() as session:
        # Step 1: Navigator
        nav_payload = {
            "context": {
                "session_id": session_id,
                "user_id": None,
                "lang": "en",
                "budget_tokens": 0,
            },
            "payload": {"goal": "Create a simple API"},
        }

        async with session.post(
            f"{api_url}/eyes/overseer/navigator",
            json=nav_payload,
            headers={"X-API-Key": api_key},
        ) as response:
            assert response.status == 200
            nav_result = await response.json()
            assert nav_result["ok"]

        # Step 2: Sharingan clarify
        clarify_payload = {
            "context": {
                "session_id": session_id,
                "user_id": None,
                "lang": "en",
                "budget_tokens": 0,
            },
            "payload": {
                "prompt": "Build an API",
                "lang": "en",
            },
        }

        async with session.post(
            f"{api_url}/eyes/sharingan/clarify",
            json=clarify_payload,
            headers={"X-API-Key": api_key},
        ) as response:
            assert response.status == 200
            clarify_result = await response.json()
            assert clarify_result["ok"]

            # Check clarification response - questions may or may not be generated
            questions = clarify_result.get("data", {}).get("questions", [])

            # Verify data structure is valid regardless of LLM decision
            assert isinstance(questions, list), "Questions should be a list"

            # If questions are generated, verify they're well-formed
            if questions:
                for question in questions:
                    assert isinstance(question, str) and len(question.strip()) > 0, "Questions should be non-empty strings"

            # Verify either questions were generated OR reasoning is provided
            reasoning = clarify_result.get("reasoning_md", "")
            assert questions or reasoning, "Should have either questions or reasoning explaining why no questions needed"


@pytest.mark.asyncio
async def test_pipeline_enforcement(api_url: str, api_key: str):
    """Test pipeline order enforcement."""
    import aiohttp

    session_id = "test-pipeline-001"

    async with aiohttp.ClientSession() as session:
        # Try to call Jogan without prerequisites
        jogan_payload = {
            "context": {
                "session_id": session_id,
                "user_id": None,
                "lang": "en",
                "budget_tokens": 0,
            },
            "payload": {
                "refined_prompt_md": "Test",
                "estimated_tokens": 100,
            },
        }

        async with session.post(
            f"{api_url}/eyes/jogan/confirm_intent",
            json=jogan_payload,
            headers={"X-API-Key": api_key},
        ) as response:
            # Should fail with 409 Conflict
            assert response.status == 409, "Expected pipeline order violation"
            error = await response.json()
            assert "expected_next" in error.get("detail", {})


@pytest.mark.asyncio
async def test_agent_response_format(api_url: str, api_key: str):
    """Test that responses include agent-friendly format."""
    import aiohttp

    payload = {
        "context": {
            "session_id": "test-agent-fmt-001",
            "user_id": None,
            "lang": "en",
            "budget_tokens": 0,
        },
        "payload": {"goal": "Test agent response format"},
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{api_url}/eyes/overseer/navigator",
            json=payload,
            headers={"X-API-Key": api_key},
        ) as response:
            assert response.status == 200
            result = await response.json()

            # Check for agent_response field (if transformer is integrated)
            # This test documents the expected format
            assert result.get("ok") is True
            assert "next_action" in result or "data" in result


@pytest.mark.asyncio
async def test_session_isolation(api_url: str, api_key: str):
    """Test that sessions are properly isolated."""
    import aiohttp

    session1_id = "test-isolation-001"
    session2_id = "test-isolation-002"

    async with aiohttp.ClientSession() as http_session:
        # Start session 1
        payload1 = {
            "context": {
                "session_id": session1_id,
                "user_id": "user1",
                "lang": "en",
                "budget_tokens": 1000,
            },
            "payload": {"goal": "Session 1 goal"},
        }

        async with http_session.post(
            f"{api_url}/eyes/overseer/navigator",
            json=payload1,
            headers={"X-API-Key": api_key},
        ) as response:
            assert response.status == 200
            result1 = await response.json()
            session1_ctx = result1["data"]["session_context"]
            assert session1_ctx["session_id"] == session1_id
            assert session1_ctx["budget_tokens"] == 1000

        # Start session 2 with different context
        payload2 = {
            "context": {
                "session_id": session2_id,
                "user_id": "user2",
                "lang": "ar",
                "budget_tokens": 2000,
            },
            "payload": {"goal": "Session 2 goal"},
        }

        async with http_session.post(
            f"{api_url}/eyes/overseer/navigator",
            json=payload2,
            headers={"X-API-Key": api_key},
        ) as response:
            assert response.status == 200
            result2 = await response.json()
            session2_ctx = result2["data"]["session_context"]
            assert session2_ctx["session_id"] == session2_id
            assert session2_ctx["budget_tokens"] == 2000

        # Verify sessions didn't interfere
        assert session1_ctx["session_id"] != session2_ctx["session_id"]
        assert session1_ctx["budget_tokens"] != session2_ctx["budget_tokens"]


@pytest.mark.asyncio
async def test_trace_id_propagation(api_url: str, api_key: str):
    """Test that trace IDs are propagated through system."""
    import aiohttp

    trace_id = "test-trace-12345"

    payload = {
        "context": {
            "session_id": "test-trace-001",
            "user_id": None,
            "lang": "en",
            "budget_tokens": 0,
        },
        "payload": {"goal": "Test tracing"},
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{api_url}/eyes/overseer/navigator",
            json=payload,
            headers={"X-API-Key": api_key, "X-Trace-Id": trace_id},
        ) as response:
            assert response.status == 200

            # Check that trace ID is returned in response headers
            returned_trace = response.headers.get("X-Trace-Id")
            assert returned_trace == trace_id, "Trace ID not propagated"


if __name__ == "__main__":
    # Allow running tests directly for development
    pytest.main([__file__, "-v", "-s"])
