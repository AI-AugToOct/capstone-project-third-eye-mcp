# 🧿 Third Eye MCP - Quick Start Guide

## What is Third Eye?

Third Eye is a **STRICT VALIDATION OVERSEER** that enforces quality gates for AI agents. It validates your work against standards and only approves work that meets all criteria.

**Key Principle**: Submit complete work packages for mandatory validation. Third Eye never generates content - it only validates what you submit.

## Single Tool Design

Third Eye exposes **ONE tool**: `third-eye/oversee`

This tool intelligently routes your submission to the appropriate validation pipeline based on content type:
- Code → Security, performance, best practices validation
- Plans → Architecture, scalability, maintainability review
- Text → Fact-checking, accuracy verification
- Requirements → Ambiguity analysis, completeness check

## Required Fields (ALL MANDATORY)

```typescript
{
  payload: {
    intent: string,        // What validation you need (min 5 chars)
    work: object,          // Your actual work to validate (min 1 property)
    context_info: object   // Project context (min 1 property)
  },
  reasoning_md: string     // Your justification (min 10 chars)
}
```

## Quick Examples

### Code Validation
```json
{
  "payload": {
    "intent": "Validate this API endpoint for security vulnerabilities",
    "work": {
      "code": "@app.post('/login')\ndef login(username: str, password: str):\n    user = db.get_user(username)\n    if user and user.password == password:\n        return {'token': generate_jwt(user.id)}\n    return {'error': 'Invalid credentials'}"
    },
    "context_info": {
      "language": "python",
      "security_level": "high"
    }
  },
  "reasoning_md": "This login endpoint needs security validation before deployment to production."
}
```

### Plan Review
```json
{
  "payload": {
    "intent": "Review this database design for scalability issues",
    "work": {
      "plan": "## Database Schema\n- users table (id, email, password_hash)\n- posts table (id, user_id, content, created_at)\n- comments table (id, post_id, user_id, content)\n\n## Indexes\n- users.email (unique)\n- posts.user_id\n- comments.post_id"
    },
    "context_info": {
      "expected_load": "100k_users",
      "database": "postgresql"
    }
  },
  "reasoning_md": "This schema supports a basic social platform. Need validation on indexing strategy and potential bottlenecks at scale."
}
```

## Setup Instructions

### 1. Start Third Eye Stack
```bash
cd capstone-project-third-eye-mcp
./start.sh start
```

### 2. Configure Your AI Tool

#### Claude Desktop
Add to `~/.claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "third-eye": {
      "command": "bun",
      "args": ["run", "--cwd", "/path/to/capstone-project-third-eye-mcp/mcp-bridge", "start"],
      "env": {
        "API_URL": "http://localhost:8000",
        "THIRD_EYE_API_KEY": "your-api-key"
      }
    }
  }
}
```

#### VS Code (with MCP extension)
Add to VS Code settings:
```json
{
  "mcp.servers": {
    "third-eye": {
      "command": "bun run --cwd /path/to/capstone-project-third-eye-mcp/mcp-bridge start",
      "env": {
        "API_URL": "http://localhost:8000",
        "THIRD_EYE_API_KEY": "your-api-key"
      }
    }
  }
}
```

#### Cursor IDE
Add to `.cursor/mcp_servers.json`:
```json
{
  "third-eye": {
    "command": "bun",
    "args": ["run", "--cwd", "/path/to/capstone-project-third-eye-mcp/mcp-bridge", "start"],
    "env": {
      "API_URL": "http://localhost:8000",
      "THIRD_EYE_API_KEY": "your-api-key"
    }
  }
}
```

### 3. Get Your API Key

The API key is auto-generated on first startup. Check the startup logs:
```bash
./start.sh logs third-eye-api | grep "GENERATED API KEY"
```

## Testing Your Setup

Use this test submission:
```json
{
  "payload": {
    "intent": "Test Third Eye validation system",
    "work": {
      "code": "print('Hello, Third Eye!')"
    },
    "context_info": {
      "language": "python",
      "purpose": "testing"
    }
  },
  "reasoning_md": "Testing the Third Eye MCP integration to ensure validation pipeline is working correctly."
}
```

## Common Errors

### ❌ "Incomplete submission"
**Cause**: Missing required fields
**Fix**: Ensure all fields (intent, work, context_info, reasoning_md) are provided

### ❌ "String too short"
**Cause**: Intent < 5 chars or reasoning < 10 chars
**Fix**: Provide meaningful descriptions

### ❌ "Work object empty"
**Cause**: Empty work object
**Fix**: Include actual content to validate

### ❌ "Connection refused"
**Cause**: Third Eye stack not running
**Fix**: Run `./start.sh start` and wait for "fully operational" message

## Next Steps

1. **Read the full [Agent Guide](AGENT_GUIDE.md)** for detailed examples
2. **Check [Testing Documentation](MCP_TESTING.md)** for validation scenarios
3. **Review [Configuration Templates](../configs/)** for your specific setup

## Remember

- Third Eye is a **VALIDATOR**, not a **GENERATOR**
- Submit **COMPLETE** work packages only
- **ALL fields are REQUIRED** - no exceptions
- Incomplete submissions will be **REJECTED**