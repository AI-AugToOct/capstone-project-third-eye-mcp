# Third Eye MCP Architecture

**Version:** 1.0
**Last Updated:** January 2025

---

## System Overview

Third Eye MCP is a multi-modal validation orchestrator that intelligently routes validation tasks through specialized "eye" components. It provides real-time feedback, multi-tenancy, and comprehensive audit trails for AI-assisted content validation.

```
┌──────────────────────────────────────────────────────────────┐
│                    Third Eye MCP System                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Client    │───▶│   API Layer  │───▶│ Orchestrator │   │
│  │  (Portal)   │◀───│  (FastAPI)   │◀───│  (Overseer)  │   │
│  └─────────────┘    └──────────────┘    └──────────────┘   │
│         │                  │                     │           │
│         │                  │                     ▼           │
│         │                  │            ┌────────────────┐  │
│         │                  │            │  Eye Registry  │  │
│         │                  │            └────────────────┘  │
│         │                  │              │  │  │  │        │
│         │                  │              ▼  ▼  ▼  ▼        │
│         │                  │         ┌──────────────────┐  │
│         │                  │         │ Validation Eyes  │  │
│         │                  │         │ • Sharingan      │  │
│         │                  │         │ • Rinnegan       │  │
│         │                  │         │ • Tenseigan      │  │
│         │                  │         │ • Byakugan       │  │
│         │                  │         └──────────────────┘  │
│         │                  │                     │           │
│         │                  ▼                     ▼           │
│         │         ┌─────────────────┐   ┌──────────────┐  │
│         └────────▶│  WebSocket Bus  │   │ LLM Provider │  │
│                   │  (Real-time)    │   │ (Groq/etc)   │  │
│                   └─────────────────┘   └──────────────┘  │
│                            │                                │
│  ┌─────────────────────────┼────────────────────────────┐ │
│  │         Storage Layer    │                            │ │
│  │  ┌───────────┐  ┌───────▼────┐  ┌─────────────┐    │ │
│  │  │ PostgreSQL│  │   Redis    │  │  File Cache │    │ │
│  │  │(Sessions, │  │ (Sessions, │  │  (Optional) │    │ │
│  │  │ Audit)    │  │  Quotas)   │  │             │    │ │
│  │  └───────────┘  └────────────┘  └─────────────┘    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. API Layer (FastAPI)

**Location:** `src/third_eye/api/server.py`

**Responsibilities:**
- HTTP request handling
- Authentication & authorization
- Rate limiting & quotas
- CSRF protection
- WebSocket connections
- Health checks

**Key Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/validate` | POST | Orchestrator entry point |
| `/session/{id}` | GET | Session details |
| `/ws/pipeline/{id}` | WS | Real-time updates |
| `/admin/*` | * | Admin operations |
| `/health/ready` | GET | Readiness probe |

**Authentication Flow:**

```
1. Client sends X-API-Key header
2. Middleware validates against database
3. Extracts role (admin/consumer) and tenant
4. Checks tenant quota
5. Extends admin session TTL if applicable
6. Forwards to handler
```

---

### 2. Orchestrator (Overseer)

**Location:** `src/third_eye/eyes/overseer.py`

**Purpose:** Intelligent validation routing based on LLM analysis

**Flow:**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Receive Validation Request                           │
│    {payload, reasoning_md, strict_mode}                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Validate Payload Schema                              │
│    - Strict mode: All fields required                   │
│    - Relaxed mode: Only intent required                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. LLM Decision (Groq/OpenAI)                           │
│    Input: intent + work + context                       │
│    Output: eyes_needed[] + reasoning                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Execute Eyes Pipeline                                │
│    for eye in eyes_needed:                              │
│      - Emit progress event                              │
│      - Invoke eye validation                            │
│      - Collect results                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Synthesize Results                                   │
│    - Calculate confidence score                         │
│    - Aggregate validations                              │
│    - Return comprehensive response                      │
└─────────────────────────────────────────────────────────┘
```

**Progress Streaming:**

```javascript
// WebSocket events emitted during orchestration
{
  "type": "orchestration_progress",
  "stage": "eye_sharingan",
  "message": "Executing sharingan validation",
  "progress": 0.33,  // 0.0 to 1.0
  "current_stage": 1,
  "total_stages": 4
}
```

---

### 3. Validation Eyes

#### Sharingan Eye
**Purpose:** Ambiguity detection and clarification

**Location:** `src/third_eye/eyes/sharingan.py`

**Process:**
1. Analyze query for ambiguous terms
2. Generate clarification questions
3. Compile markdown with detected issues
4. Return ambiguity score (0-1)

**Output:**
```json
{
  "ambiguity_score": 0.42,
  "clarifications": [
    {"question": "What format?", "context": "..."}
  ]
}
```

---

#### Rinnegan Eye
**Purpose:** Plan validation and completeness

**Location:** `src/third_eye/eyes/rinnegan.py`

**Process:**
1. Parse submitted plan structure
2. Check for logical gaps
3. Validate dependencies
4. Assess completeness

**Output:**
```json
{
  "completeness": 0.85,
  "gaps": ["Missing error handling"],
  "recommendations": [...]
}
```

---

#### Tenseigan Eye
**Purpose:** Fact-checking and claim validation

**Location:** `src/third_eye/eyes/tenseigan.py`

**Process:**
1. Extract factual claims from text
2. Validate against knowledge base
3. Flag unverifiable claims
4. Provide evidence links

**Output:**
```json
{
  "claims": [
    {"text": "...", "confidence": 0.9, "evidence": "..."}
  ],
  "unverified": [...]
}
```

---

#### Byakugan Eye
**Purpose:** Consistency checking across context

**Location:** `src/third_eye/eyes/byakugan.py`

**Process:**
1. Compare new content against previous
2. Detect contradictions
3. Check terminology consistency
4. Validate cross-references

**Output:**
```json
{
  "consistency_score": 0.92,
  "contradictions": [],
  "recommendations": [...]
}
```

---

### 4. Storage Layer

#### PostgreSQL
**Purpose:** Persistent data storage

**Schema:**

```sql
-- Sessions
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  tenant_id TEXT
);

-- Audit Events
CREATE TABLE audit_events (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  actor TEXT,
  action TEXT,
  target TEXT,
  tenant_id TEXT,
  metadata JSONB
);

-- API Keys
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  tenant TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  limits JSONB
);
```

---

#### Redis
**Purpose:** Fast-access caching and session management

**Key Patterns:**

| Pattern | Purpose | TTL |
|---------|---------|-----|
| `session_ttl:{id}` | Session expiration tracking | 7 days |
| `admin_session:{key_id}` | Admin session state | 1 hour |
| `tenant_quota:{id}` | Tenant quota limits | Persistent |
| `tenant_usage:{id}:{window}` | Usage tracking | 48 hours |
| `llm_health` | LLM connectivity status | 30 seconds |

---

## Data Flow

### 1. Validation Request

```
┌─────────┐                                 ┌─────────────┐
│ Client  │──(1) POST /validate ───────────▶│ API Server  │
└─────────┘     X-API-Key: xxx              └──────┬──────┘
                                                    │
                                         (2) Validate API Key
                                                    │
                                         (3) Check Tenant Quota
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │ Orchestrator  │
                                            └───────┬───────┘
                                                    │
                                         (4) Invoke LLM for routing
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │ Eye Registry  │
                                            └───────┬───────┘
                                                    │
                                    (5) Execute eyes in sequence
                                                    │
          ┌─────────────┬───────────────┬──────────┴────────┬──────────┐
          ▼             ▼               ▼                    ▼          │
    ┌─────────┐   ┌─────────┐   ┌──────────┐        ┌──────────┐     │
    │Sharingan│   │Rinnegan │   │Tenseigan │        │Byakugan  │     │
    └────┬────┘   └────┬────┘   └─────┬────┘        └─────┬────┘     │
         │             │              │                     │          │
         └─────────────┴──────────────┴─────────────────────┘          │
                                      │                                │
                        (6) Aggregate results                          │
                                      │                                │
                                      ▼                                │
                              ┌───────────────┐                        │
                              │  Synthesizer  │                        │
                              └───────┬───────┘                        │
                                      │                                │
                        (7) Return comprehensive response              │
                                      │                                │
┌─────────┐                          │                                │
│ Client  │◀─────────────────────────┘                                │
└─────────┘                                                            │
     │                                                                 │
     │                                                                 │
     └─────────────────────(8) WebSocket updates─────────────────────┘
```

---

### 2. Real-time Updates (WebSocket)

```
┌─────────┐                                  ┌──────────────┐
│ Client  │──(1) WS /ws/pipeline/{id} ──────▶│  API Server  │
└─────────┘     Sec-WebSocket-Protocol:      └──────┬───────┘
                api-key-{key}                        │
                                          (2) Validate API Key
                                                     │
                                          (3) Register with Bus
                                                     │
                                                     ▼
                                             ┌───────────────┐
                                             │ Pipeline Bus  │
                                             └───────┬───────┘
                                                     │
                                       (4) Broadcast events to
                                           session subscribers
                                                     │
┌─────────┐                                         │
│ Client  │◀────────────────────────────────────────┘
└─────────┘     Progress events in real-time

Event Types:
• eye_update - Eye completion
• settings_update - Configuration change
• orchestration_progress - Pipeline progress
• custom_event - Application-specific
```

---

### 3. Admin Operations

```
┌─────────┐                                  ┌──────────────┐
│ Admin   │──(1) POST /admin/auth/login ────▶│  API Server  │
│ Client  │                                   └──────┬───────┘
└─────────┘    {email, password}                     │
                                           (2) Verify credentials
     │                                                │
     │                                     (3) Generate API key
     │                                                │
     │                                     (4) Set CSRF cookie
     │                                                │
     │                                     (5) Create admin session
     │                                                │
     │◀────────────────────────────────────────────────┘
     │         {api_key, csrf_token}
     │
     │
     └──(6) POST /admin/tenants ────────────────────▶ Middleware
         X-API-Key: {key}                                │
         X-CSRF-Token: {token}                           │
                                               (7) Validate CSRF
                                                          │
                                               (8) Check admin role
                                                          │
                                               (9) Extend session TTL
                                                          │
                                                          ▼
                                                  ┌──────────────┐
                                                  │   Handler    │
                                                  └──────────────┘
```

---

## Security Architecture

### 1. Authentication Layers

```
┌──────────────────────────────────────────────────────────┐
│                   Request Validation                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. API Key Validation                                   │
│     ✓ Key exists in database                             │
│     ✓ Not revoked                                        │
│     ✓ Not expired                                        │
│                                                           │
│  2. Tenant Isolation                                     │
│     ✓ Key scoped to tenant                               │
│     ✓ Cross-tenant access blocked                        │
│                                                           │
│  3. Role-Based Access Control                            │
│     ✓ Admin: Full access                                 │
│     ✓ Consumer: Validation only                          │
│                                                           │
│  4. CSRF Protection (Admin only)                         │
│     ✓ Token in cookie + header                           │
│     ✓ HMAC signature validation                          │
│     ✓ 1-hour TTL                                         │
│                                                           │
│  5. Session Management                                   │
│     ✓ Admin: 1-hour with auto-extend                     │
│     ✓ Validation: 7-day TTL                              │
│                                                           │
│  6. Rate Limiting                                        │
│     ✓ Per-tenant quotas                                  │
│     ✓ Per-key limits                                     │
│     ✓ Sliding window counters                            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

### 2. Secret Management

**API Keys:**
- Stored as bcrypt hashes (cost=12)
- Plaintext only shown once at creation
- Client-side encryption (AES-256-GCM) in sessionStorage
- 100k PBKDF2 iterations for key derivation

**CSRF Tokens:**
- HMAC-SHA256 signed with server secret
- httpOnly, secure, SameSite=strict cookies
- 1-hour expiration
- Validated on every state-changing request

**Session Storage:**
- Redis with automatic TTL expiration
- Encrypted values for sensitive data
- Separate keyspaces per tenant

---

## Scalability

### Horizontal Scaling

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐     ┌─────────┐
    │ API #1  │      │ API #2  │     │ API #3  │
    └────┬────┘      └────┬────┘     └────┬────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌───────────┐   ┌──────────┐
    │PostgreSQL│   │   Redis   │   │   LLM    │
    │ (Primary)│   │  Cluster  │   │ Provider │
    └──────────┘   └───────────┘   └──────────┘
```

**Considerations:**
- Stateless API servers
- Shared Redis for session state
- Database connection pooling
- WebSocket sticky sessions (optional)
- LLM provider failover

---

### Performance Optimization

**Caching Strategy:**

| Data | Cache | TTL | Invalidation |
|------|-------|-----|--------------|
| LLM health | Redis | 30s | Time-based |
| Tenant quotas | Redis | Persistent | On update |
| API key lookups | Redis | 5min | On revoke |
| Session settings | Redis | 1hour | On change |

**Database Optimization:**
- Indexes on session_id, tenant_id, created_at
- Partitioning for audit_events (monthly)
- Connection pool (min=5, max=20)
- Read replicas for analytics

---

## Deployment

### Docker Compose Architecture

```yaml
services:
  api:
    image: third-eye-api:latest
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL
      - REDIS_URL
      - GROQ_API_KEY
    depends_on: [postgres, redis]

  postgres:
    image: postgres:15
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7
    volumes: ["redisdata:/data"]

  control-plane:
    image: third-eye-control-plane:latest
    ports: ["3000:3000"]

  overseer-portal:
    image: third-eye-portal:latest
    ports: ["5173:5173"]
```

---

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: third-eye-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: third-eye-api
  template:
    spec:
      containers:
      - name: api
        image: third-eye-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: third-eye-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Monitoring

### Health Checks

**Liveness:** `/health`
- Returns 200 if server is running
- No external dependencies checked

**Readiness:** `/health/ready`
- Returns 200 if ready to serve traffic
- Checks: Database, Redis, LLM connectivity

### Metrics

**Prometheus Endpoint:** `/metrics`

Key metrics:
- `http_requests_total` - Request count by endpoint
- `http_request_duration_seconds` - Request latency
- `llm_calls_total` - LLM invocations
- `validation_errors_total` - Validation failures
- `active_sessions` - Current session count
- `tenant_quota_usage` - Per-tenant usage

---

## Future Architecture Enhancements

1. **Circuit Breaker Pattern**
   - Automatic LLM failover
   - Graceful degradation

2. **Event Sourcing**
   - Complete audit trail replay
   - Point-in-time recovery

3. **Distributed Tracing**
   - OpenTelemetry integration
   - Request correlation

4. **Multi-Region Deployment**
   - Geographic load balancing
   - Data residency compliance

5. **Async Processing**
   - Background job queue
   - Webhook callbacks

---

**End of Architecture Documentation**
