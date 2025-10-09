# 🧿 Third Eye MCP Configuration Templates

## 🚨 CRITICAL: Third Eye is a STRICT VALIDATION OVERSEER

Third Eye **NEVER** generates content for you. It **ONLY** validates complete work packages against quality standards. **ALL FIELDS ARE MANDATORY** - incomplete submissions will be **REJECTED**.

## Quick Setup

### 1. Get Your API Key
```bash
./start.sh logs third-eye-api | grep "GENERATED API KEY"
```

### 2. Choose Your Platform

#### Claude Desktop
Copy `claude-desktop.json` to `~/.claude_desktop_config.json`:
```bash
cp docs/configs/claude-desktop.json ~/.claude_desktop_config.json
```

#### VS Code (with MCP extension)
Add contents of `vscode-settings.json` to your VS Code settings:
```bash
# Open VS Code settings and merge with vscode-settings.json
```

#### Cursor IDE
Copy `cursor-mcp-servers.json` to `.cursor/mcp_servers.json` in your project:
```bash
mkdir -p .cursor
cp docs/configs/cursor-mcp-servers.json .cursor/mcp_servers.json
```

### 3. Update Configuration
Replace these placeholders in your chosen config:
- `/path/to/capstone-project-third-eye-mcp` → Your actual project path
- `your-api-key-here` → Your actual API key from step 1

## 🔧 Configuration Details

All configurations use the **SAME** single tool: `third-eye/oversee`

### Required Environment Variables
- `API_URL`: `http://localhost:8000` (Third Eye API server)
- `THIRD_EYE_API_KEY`: Your generated API key

### Required Tool Parameters
```json
{
  "payload": {
    "intent": "REQUIRED: Clear validation request (min 5 chars)",
    "work": "REQUIRED: Actual content to validate (min 1 property)",
    "context_info": "REQUIRED: Project context (min 1 property)"
  },
  "reasoning_md": "REQUIRED: Your justification (min 10 chars)"
}
```

## 🎯 Usage Examples

### Code Validation
```json
{
  "payload": {
    "intent": "Validate this API endpoint for security vulnerabilities",
    "work": {
      "code": "def login(username, password): ..."
    },
    "context_info": {
      "language": "python",
      "security_level": "high"
    }
  },
  "reasoning_md": "This login endpoint needs security validation before production deployment."
}
```

### Plan Review
```json
{
  "payload": {
    "intent": "Review this architecture for scalability issues", 
    "work": {
      "plan": "## Database Schema\n- users table..."
    },
    "context_info": {
      "expected_load": "100k_users",
      "database": "postgresql"
    }
  },
  "reasoning_md": "Need validation on indexing strategy and bottlenecks at scale."
}
```

## ❌ Common Errors

### "Incomplete submission"
**Cause**: Missing required fields  
**Fix**: Ensure all fields (intent, work, context_info, reasoning_md) are provided

### "String too short"
**Cause**: Intent < 5 chars or reasoning < 10 chars  
**Fix**: Provide meaningful descriptions

### "Work object empty"
**Cause**: Empty work object  
**Fix**: Include actual content to validate

### "Connection refused"
**Cause**: Third Eye stack not running  
**Fix**: Run `./start.sh start` and wait for "fully operational" message

## 🔗 Next Steps

1. **Test your setup** with the examples in `MCP_QUICKSTART.md`
2. **Read the full guide** in `AGENT_GUIDE.md`
3. **Check troubleshooting** in `MCP_TESTING.md`

## 🧿 Remember: STRICT OVERSEER

- Submit **COMPLETE** work packages only
- **ALL fields are REQUIRED** - no exceptions  
- Third Eye **VALIDATES**, never **GENERATES**
- Incomplete submissions will be **REJECTED**