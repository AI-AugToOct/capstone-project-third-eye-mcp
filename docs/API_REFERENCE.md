# Third Eye MCP — API Reference

All endpoints require the `X-API-Key` header unless noted. Responses conform to the JSON envelope defined in `src/third_eye/constants.py`.

## 1. Authentication & Admin

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/admin/auth/login` | Exchange admin email/password for a short-lived API key. |
| `POST` | `/admin/auth/change-password` | Update admin password. |
| `GET` | `/admin/bootstrap/status` | Check if bootstrap admin exists. |

### API Keys
- `GET /admin/api-keys` – list keys (`include_revoked` optional).
- `POST /admin/api-keys` – create key (role, tenant, TTL, limits).
- `POST /admin/api-keys/{id}/rotate` – rotate secret.
- `POST /admin/api-keys/{id}/revoke` / `/restore` – lifecycle.
- `PATCH /admin/api-keys/{id}` – update limits/expiry/display name.

### Tenants
- `GET /admin/tenants`
- `POST /admin/tenants`
- `PATCH /admin/tenants/{id}`
- `POST /admin/tenants/{id}/archive`
- `POST /admin/tenants/{id}/restore`

### Profiles & Provider
- `GET /admin/profiles`
- `PUT /admin/profiles` – body `{ "profiles": { "security": { ... } } }`.
- `GET /admin/provider`
- `PUT /admin/provider` – body `{ "mode": "api|offline", "engine": { ... } }`.

### Environment Settings
- `GET /admin/settings`
- `PUT /admin/settings`

### Audits & Metrics
- `GET /admin/audit`
- `GET /admin/metrics/overview`

Refer to `tests/test_admin_api.py` for request/response fixtures.

## 2. Session Lifecycle

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/session` | Create a new session; returns `{ session_id, profile, settings, provider, portal_url }`. |
| `GET` | `/sessions` | List sessions accessible to the caller (tenant-aware). |
| `GET` | `/sessions/{session_id}` | Detailed session info (events, settings, eye status). |
| `GET` | `/session/{session_id}/events` | Timeline events (eye updates, custom events). |
| `POST` | `/session/{session_id}/clarifications` | Submit clarifying answers. |
| `POST` | `/session/{session_id}/resubmit` | Request re-review for an Eye. |
| `POST` | `/session/{session_id}/duel` | Launch a duel between agents. |
| `POST` | `/session/{session_id}/export` | Export session (`fmt=pdf|html`). |
| `POST` | `/session/{session_id}/revalidate` | Re-run Tenseigan & Byakugan on latest draft. |
| `PUT` | `/session/{session_id}/settings` | Update profile/overrides; triggers websocket broadcast. |

## 3. Eye Orchestration

Third Eye provides two approaches for interacting with validation eyes:

### 3a. Recommended: Intelligent Orchestrator

**`POST /eyes/overseer/orchestrate`** — The primary entry point that intelligently routes work through appropriate eyes.

The orchestrator uses LLM-based analysis to determine which eyes to invoke based on your intent and work type, then executes the validation pipeline automatically.

**Request Format:**
```json
{
  "context": {
    "session_id": "sess-123",
    "tenant": "cli",
    "user_id": "agent-7",
    "lang": "en",
    "budget_tokens": 1200,
    "settings": { ... }
  },
  "payload": {
    "intent": "Clear validation request describing what you want validated",
    "work": {
      "code": "...",
      "plan": "...",
      "draft": "...",
      "requirements": "..."
    },
    "context_info": {
      "project": "project name",
      "stage": "development|review|final",
      "additional_context": "any relevant details"
    }
  },
  "reasoning_md": "### Reasoning\nExplain your approach and why this work should be validated"
}
```

**Strict Validation:**
- All fields are **mandatory** (intent, work, context_info, reasoning_md)
- Minimum lengths enforced (intent: 5 chars, reasoning_md: 10 chars)
- Work must contain at least one property (code/plan/draft/requirements)
- Context_info must contain at least one property
- Incomplete submissions are **immediately rejected** with detailed error messages

**Intelligent Routing:**
The orchestrator analyzes your intent and work, then automatically invokes the appropriate eyes:
- Ambiguous requests → Sharingan (clarification flow)
- Plan submissions → Rinnegan (plan review)
- Code/drafts → Tenseigan (validate claims) + Byakugan (consistency)
- Complex workflows → Multi-eye pipelines

**Response:**
Returns results from all invoked eyes, or stops early if clarifications/revisions are needed.

**Example:**
```bash
curl -X POST https://your-api.com/eyes/overseer/orchestrate \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "intent": "Validate my implementation plan for user authentication",
      "work": { "plan": "## Plan\n1. Add auth middleware\n2. ..." },
      "context_info": { "project": "web-app", "stage": "planning" }
    },
    "reasoning_md": "Need validation before implementing security-critical features"
  }'
```

---

### 3b. Advanced: Manual Eye Invocation

For granular control, individual eyes can be invoked directly. This is recommended for advanced users who need fine-grained orchestration or custom workflows.

**Navigator Entry Point:**
- `POST /eyes/overseer/navigator` — Schema primer, no LLM. Must be called first to initialize pipeline state.

**Request Format (applies to all individual eye endpoints):**
```json
{
  "context": {
    "session_id": "sess-123",
    "tenant": "cli",
    "user_id": "agent-7",
    "lang": "en",
    "budget_tokens": 1200,
    "settings": { ... }
  },
  "payload": { ... },
  "reasoning_md": "### Reasoning\n..." // when required
}
```

**Available Individual Eyes:**

| Method/Path | Eye | Notes |
| --- | --- | --- |
| `POST /eyes/sharingan/clarify` | Sharingan | Uses session ambiguity threshold. |
| `POST /eyes/helper/rewrite_prompt` | Prompt Helper | Requires clarifications output. |
| `POST /eyes/jogan/confirm_intent` | Jōgan | Validates ROLE/TASK/CONTEXT/REQUIREMENTS/OUTPUT. |
| `POST /eyes/rinnegan/plan_requirements` | Rinnegan plan schema | Ingests plan markdown for embeddings. |
| `POST /eyes/rinnegan/plan_review` | Rinnegan plan review | Enforces rollback based on settings. |
| `POST /eyes/mangekyo/review_scaffold` | Mangekyō scaffold | Strictness derived from `mangekyo`. |
| `POST /eyes/mangekyo/review_impl` | Mangekyō impl |
| `POST /eyes/mangekyo/review_tests` | Mangekyō tests | Checks coverage thresholds. |
| `POST /eyes/mangekyo/review_docs` | Mangekyō docs |
| `POST /eyes/tenseigan/validate_claims` | Tenseigan | Citation cutoff from settings. |
| `POST /eyes/byakugan/consistency_check` | Byakugan | Consistency tolerance from settings. |
| `POST /eyes/rinnegan/final_approval` | Final approval |

**Helper Endpoints:**
- `POST /session/{id}/clarifications` — Submit clarifications
- `POST /session/{id}/duel` — Launch agent duel

**Typical Manual Flow:**
1. Navigator → 2. Sharingan → 3. Helper → 4. Jogan → 5. Rinnegan (plan) → 6. Mangekyō (code) → 7. Tenseigan/Byakugan (text) → 8. Final Approval

See unit tests in `tests/test_api.py` and `tests/test_eye_settings.py` for payload examples.

## 4. Websocket

`GET /ws/pipeline/{session_id}` (header `X-API-Key`). Messages:
- `settings_update` — `{ "type": "settings_update", "session_id", "data": { profile, overrides, effective, provider, pipeline }, "ts" }`
- `eye_update` — standard event payload per Eye.
- Custom events: `user_input`, `resubmit_requested`, `duel_requested`, etc.

Example (from `tests/test_admin_api.py::test_admin_key_accesses_sessions_and_pipeline`):
```json
{
  "type": "settings_update",
  "session_id": "sess-1",
  "data": {
    "profile": "enterprise",
    "effective": { ... }
  },
  "ts": 1738620384.123
}
```

## 5. Health & Metrics

| Path | Description |
| --- | --- |
| `GET /health/live` | Liveness probe. |
| `GET /health/ready` | Readiness (checks DB + Redis). |
| `GET /metrics` | Prometheus metrics. |

---

For onboarding flows and UI walkthroughs see [USER_GUIDE.md](../USER_GUIDE.md) and [ADMIN_GUIDE.md](ADMIN_GUIDE.md).
