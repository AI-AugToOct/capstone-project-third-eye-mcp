# 🧿 Third Eye MCP - Agent Integration Guide

## Core Principle: STRICT VALIDATION OVERSEER

Third Eye is **NOT** a helper tool. It is a **STRICT VALIDATION OVERSEER** that enforces quality gates and standards. You must submit **COMPLETE** work packages for mandatory validation.

## Single Tool: `third-eye/oversee`

### What It Does
- **Validates** your work against standards
- **Enforces** quality gates
- **Approves/Rejects** based on criteria
- **Never authors** deliverables for you

### What It Requires (ALL MANDATORY)

```typescript
{
  payload: {
    intent: string,        // Clear validation request (min 5 chars)
    work: object,          // Actual content to validate
    context_info: object   // Project context affecting validation
  },
  reasoning_md: string     // Your justification (min 10 chars)
}
```

## Validation Types & Examples

### 🔍 Code Validation
```json
{
  "payload": {
    "intent": "Validate this Python API implementation against security and performance standards",
    "work": {
      "code": "from fastapi import FastAPI\napp = FastAPI()\n\n@app.get('/users/{user_id}')\ndef get_user(user_id: int):\n    return {'id': user_id, 'name': 'John'}"
    },
    "context_info": {
      "project_type": "rest_api",
      "language": "python",
      "security_level": "high",
      "performance_criteria": "sub_100ms_response"
    }
  },
  "reasoning_md": "This implements a basic user lookup endpoint. I've used FastAPI for performance and type hints for validation. However, I need Third Eye to validate security practices and ensure I'm not missing any critical concerns before deployment."
}
```

### 📋 Plan Review
```json
{
  "payload": {
    "intent": "Review this microservices architecture plan for scalability and maintainability issues",
    "work": {
      "plan": "# User Management Service Architecture\n\n## Components\n1. Authentication Service (JWT)\n2. User Profile Service\n3. Permission Service\n4. API Gateway (Kong)\n\n## Data Flow\nClient -> Gateway -> Auth Service -> Profile Service"
    },
    "context_info": {
      "project_type": "microservices",
      "expected_load": "10k_concurrent_users",
      "compliance_requirements": ["GDPR", "SOC2"],
      "team_size": 5
    }
  },
  "reasoning_md": "This architecture separates concerns into distinct services for scalability. I've chosen JWT for stateless authentication and Kong for API management. The design should handle the expected load, but I need validation on potential bottlenecks and security gaps before implementation."
}
```

### ✅ Fact Checking
```json
{
  "payload": {
    "intent": "Fact-check this technical article for accuracy and verify all performance claims",
    "work": {
      "draft": "# Redis Performance in 2024\n\nRedis can handle over 1 million operations per second on standard hardware. The new Redis 7.2 introduces JSON support that's 40% faster than previous versions. Memory usage has been optimized to use 30% less RAM compared to Redis 6.0..."
    },
    "context_info": {
      "target_audience": "senior_developers",
      "publication": "tech_blog",
      "accuracy_level": "high",
      "verification_required": true
    }
  },
  "reasoning_md": "This article makes specific performance claims about Redis that developers will rely on for architectural decisions. All numbers cited come from Redis Labs benchmarks and community testing, but I need Third Eye to verify these claims are current and accurate before publication."
}
```

### 📝 Requirements Analysis
```json
{
  "payload": {
    "intent": "Analyze these requirements for ambiguity and completeness before development starts",
    "work": {
      "requirements": "Build a user dashboard that shows analytics. Users should be able to see their data and export reports. The system needs to be fast and handle lots of users."
    },
    "context_info": {
      "project_type": "web_application",
      "timeline": "8_weeks",
      "team_experience": "intermediate",
      "business_critical": true
    }
  },
  "reasoning_md": "These requirements came from stakeholder meetings but feel incomplete. Terms like 'fast' and 'lots of users' are vague. Before starting development, I need Third Eye to identify specific gaps and ambiguities that could cause scope creep or missed expectations."
}
```

## Response Format

Third Eye returns structured validation results:

```json
{
  "ok": true/false,
  "md": "Human-readable summary",
  "data": {
    "validations_performed": ["security_scan", "performance_review"],
    "issues_found": [...],
    "recommendations": [...],
    "approval_status": "approved/rejected/needs_revision"
  },
  "next_action": "Clear next steps"
}
```

## Common Rejections

❌ **Incomplete Intent**
```json
{ "intent": "check this" }  // TOO VAGUE
```

❌ **Missing Work**
```json
{ "work": {} }  // EMPTY CONTENT
```

❌ **No Context**
```json
{ "context_info": {} }  // NO PROJECT DETAILS
```

❌ **Missing Reasoning**
```json
{ "reasoning_md": "" }  // NO JUSTIFICATION
```

## Best Practices

### ✅ DO
- Provide complete, substantive work packages
- Be specific in your validation intent
- Include all relevant context that affects validation
- Explain your reasoning and design decisions
- Submit when you have something concrete to validate

### ❌ DON'T
- Submit incomplete or placeholder content
- Ask vague questions without work to validate
- Expect Third Eye to generate content for you
- Skip context or reasoning fields
- Use it as a general help tool

## Integration Examples

### Claude Desktop/Code
```json
// In Claude Desktop MCP config
{
  "mcpServers": {
    "third-eye": {
      "command": "bun",
      "args": ["run", "--cwd", "/path/to/third-eye/mcp-bridge", "start"]
    }
  }
}
```

### VS Code
```json
// In VS Code MCP settings
{
  "mcp.servers": {
    "third-eye": {
      "command": "bun run --cwd /path/to/third-eye/mcp-bridge start"
    }
  }
}
```

## Remember
Third Eye is a **VALIDATION OVERSEER**, not a coding assistant. Submit complete work for mandatory quality gates. Incomplete submissions will be rejected.