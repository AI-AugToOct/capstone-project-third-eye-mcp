# Third Eye MCP Troubleshooting Guide

**Version:** 1.0
**Last Updated:** January 2025

---

## Quick Diagnostics

### Health Check Commands

```bash
# Check overall system health
curl http://localhost:8000/health

# Check readiness (includes LLM connectivity)
curl http://localhost:8000/health/ready

# Check metrics
curl http://localhost:8000/metrics
```

---

## Common Issues

### 1. Orchestrator Errors

#### Error: "LLM Connection Error"

**Symptoms:**
- Orchestration fails with LLM unavailability message
- `/health/ready` returns `"llm": false`

**Causes:**
- LLM provider (Groq/OpenAI) is down
- API key expired or invalid
- Rate limit exceeded
- Network connectivity issues

**Solutions:**

1. **Check LLM provider status:**
   ```bash
   curl https://api.groq.com/status
   ```

2. **Verify API key:**
   ```bash
   # Check environment variable
   echo $GROQ_API_KEY

   # Test with minimal request
   curl https://api.groq.com/openai/v1/chat/completions \
     -H "Authorization: Bearer $GROQ_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "llama3-8b-8192", "messages": [{"role": "user", "content": "test"}], "max_tokens": 10}'
   ```

3. **Check rate limits:**
   - Review provider dashboard
   - Reduce concurrent requests
   - Implement request queuing

4. **Fallback to individual eyes:**
   ```bash
   # Direct eye invocation bypasses orchestrator
   curl -X POST http://localhost:8000/sharingan/clarify \
     -H "X-API-Key: your-key" \
     -H "Content-Type: application/json" \
     -d '{"payload": {"query": "test"}, "context": {"session_id": "test"}}'
   ```

---

#### Error: "Orchestration Failed - Partial Pipeline Failure"

**Symptoms:**
- Some eyes complete successfully
- Orchestration stops mid-pipeline
- Error details in response data

**Causes:**
- Individual eye encountered error
- Validation logic rejected submission
- Timeout during eye execution

**Solutions:**

1. **Review partial results:**
   ```python
   response["data"]["partial_results"]  # See which eyes succeeded
   response["data"]["completed_validations"]  # List of completed eyes
   ```

2. **Check specific eye endpoint:**
   ```bash
   # Test failing eye directly
   curl -X POST http://localhost:8000/rinnegan/plan_review \
     -H "X-API-Key: your-key" \
     -H "Content-Type: application/json" \
     -d @test_payload.json
   ```

3. **Enable strict_mode=false for debugging:**
   ```json
   {
     "payload": {"intent": "test"},
     "strict_mode": false
   }
   ```

---

### 2. Authentication Issues

#### Error: "Admin session expired"

**Symptoms:**
- Admin API calls return 401
- Session was valid < 1 hour ago

**Solutions:**

1. **Re-authenticate:**
   ```bash
   curl -X POST http://localhost:8000/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "your-password"}'
   ```

2. **Check session activity:**
   - Sessions expire after 1 hour of inactivity
   - Activity extends TTL automatically
   - Ensure requests include valid API key

3. **Verify Redis connectivity:**
   ```bash
   redis-cli ping  # Should return PONG
   redis-cli keys "admin_session:*"  # List active sessions
   ```

---

#### Error: "CSRF validation failed"

**Symptoms:**
- Admin POST/PUT/DELETE requests fail with 403
- GET requests work fine

**Solutions:**

1. **Include CSRF token in headers:**
   ```javascript
   fetch('/admin/tenants', {
     method: 'POST',
     headers: {
       'X-API-Key': apiKey,
       'X-CSRF-Token': csrfToken,  // From cookie
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(payload)
   })
   ```

2. **Check cookie settings:**
   - Ensure `httpOnly`, `secure`, `samesite=strict` are set
   - Verify cookie domain matches request origin

3. **Re-login to get fresh token:**
   - CSRF tokens expire after 1 hour
   - Login endpoint refreshes token automatically

---

### 3. Session Management

#### Issue: Sessions not expiring

**Symptoms:**
- Old sessions persist beyond 7 days
- Database bloat from abandoned sessions

**Solutions:**

1. **Verify cleanup loop is running:**
   ```bash
   # Check logs for cleanup messages
   docker logs third-eye-api | grep "Session cleanup"
   ```

2. **Manually trigger cleanup:**
   ```python
   from third_eye.session_cleanup import cleanup_expired_sessions
   cleaned = await cleanup_expired_sessions()
   print(f"Cleaned {cleaned} sessions")
   ```

3. **Check Redis TTL:**
   ```bash
   redis-cli ttl "session_ttl:your-session-id"
   # Should return seconds remaining
   ```

---

#### Issue: Session lost after page reload

**Symptoms:**
- API key disappears on refresh
- Need to re-enter credentials

**Solutions:**

1. **Use sessionStorage (not localStorage):**
   - Keys are intentionally cleared on tab close
   - Security trade-off for XSS protection

2. **Implement persistent login:**
   ```javascript
   // Store tenant ID only (not keys)
   localStorage.setItem('tenant-id', tenantId);

   // Re-authenticate on load
   if (tenantId && !apiKey) {
     promptForApiKey();
   }
   ```

---

### 4. Tenant & Quota Issues

#### Error: "Tenant quota exceeded"

**Symptoms:**
- Requests fail with 429 status
- Error message shows current usage

**Solutions:**

1. **Check current quota:**
   ```bash
   curl http://localhost:8000/admin/tenants/your-tenant-id/usage \
     -H "X-API-Key: admin-key"
   ```

2. **Increase quota:**
   ```bash
   curl -X PUT http://localhost:8000/admin/tenants/your-tenant-id \
     -H "X-API-Key: admin-key" \
     -H "Content-Type: application/json" \
     -d '{"quota": 5000000}'
   ```

3. **Reset usage counter:**
   ```python
   from third_eye.tenant_quotas import reset_tenant_usage
   await reset_tenant_usage("your-tenant-id")
   ```

4. **Review usage patterns:**
   - Check for runaway scripts
   - Implement client-side rate limiting
   - Use cursor-based pagination for large queries

---

### 5. WebSocket Connection Issues

#### Error: WebSocket disconnects frequently

**Symptoms:**
- Connection drops every few minutes
- Reconnection loops in logs

**Solutions:**

1. **Check keepalive:**
   ```javascript
   // Send periodic pings
   setInterval(() => {
     if (ws.readyState === WebSocket.OPEN) {
       ws.send('ping');
     }
   }, 30000);  // Every 30s
   ```

2. **Verify API key in subprotocol:**
   ```javascript
   const ws = new WebSocket(url, [`api-key-${apiKey}`]);
   ```

3. **Check proxy/load balancer timeouts:**
   - Nginx: `proxy_read_timeout 600s;`
   - AWS ALB: Idle timeout setting
   - Cloudflare: WebSocket timeout configuration

4. **Review session TTL:**
   - Sessions expire after 7 days
   - Ensure `touch_session()` is called on activity

---

### 6. Database Issues

#### Error: "Database connection failed"

**Symptoms:**
- All requests fail with 500
- `/health/ready` shows `"database": false`

**Solutions:**

1. **Check PostgreSQL status:**
   ```bash
   docker-compose ps postgres
   psql -h localhost -U postgres -d thirdeye -c "SELECT 1;"
   ```

2. **Verify connection string:**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:5432/dbname
   ```

3. **Check connection pool:**
   ```python
   from third_eye.db import check_db_health
   is_healthy = await check_db_health()
   ```

4. **Restart database:**
   ```bash
   docker-compose restart postgres
   ```

---

#### Error: "Redis connection failed"

**Symptoms:**
- Session management fails
- Rate limiting doesn't work
- `/health/ready` shows `"redis": false`

**Solutions:**

1. **Check Redis status:**
   ```bash
   docker-compose ps redis
   redis-cli ping
   ```

2. **Verify Redis URL:**
   ```bash
   echo $REDIS_URL
   # Should be: redis://localhost:6379/0
   ```

3. **Check memory usage:**
   ```bash
   redis-cli info memory
   # Look for maxmemory_policy
   ```

4. **Clear Redis cache (caution):**
   ```bash
   redis-cli flushdb
   ```

---

### 7. Performance Issues

#### Issue: Slow orchestration (>30 seconds)

**Symptoms:**
- Orchestration takes longer than expected
- No progress updates visible

**Solutions:**

1. **Enable progress streaming:**
   - Connect WebSocket to `/ws/pipeline/{session_id}`
   - Monitor `orchestration_progress` events

2. **Check LLM provider latency:**
   ```bash
   time curl https://api.groq.com/openai/v1/chat/completions \
     -H "Authorization: Bearer $GROQ_API_KEY" \
     -d '{"model": "llama3-8b-8192", "messages": [{"role": "user", "content": "test"}]}'
   ```

3. **Optimize payload size:**
   - Reduce `work` content length
   - Split large validations into smaller chunks
   - Use `strict_mode: false` for drafts

4. **Increase timeout:**
   ```python
   # In server.py
   asyncio.wait_for(orchestrate_async(...), timeout=60.0)
   ```

---

## Monitoring & Alerting

### Key Metrics to Watch

1. **LLM Health:**
   - Monitor `/health/ready` endpoint
   - Alert on `"llm": false` for > 5 minutes

2. **Session Count:**
   - Track active sessions via Redis
   - Alert on > 10,000 active sessions

3. **Quota Usage:**
   - Monitor tenant usage rates
   - Alert on > 90% quota utilization

4. **Error Rates:**
   - Track 5xx responses
   - Alert on > 5% error rate

5. **Response Times:**
   - P50, P95, P99 latencies
   - Alert on P95 > 5 seconds

---

## Debugging Tools

### Enable Debug Logging

```bash
# Set log level
export LOG_LEVEL=DEBUG

# Run with verbose logging
python -m uvicorn src.third_eye.api.server:app --log-level debug
```

### Inspect Redis Keys

```bash
# List all keys
redis-cli keys "*"

# Check session TTLs
redis-cli keys "session_ttl:*" | xargs -I{} redis-cli ttl {}

# Check admin sessions
redis-cli keys "admin_session:*"

# Check tenant quotas
redis-cli keys "tenant_quota:*"
redis-cli keys "tenant_usage:*"
```

### Database Queries

```sql
-- Recent sessions
SELECT session_id, created_at FROM sessions
ORDER BY created_at DESC LIMIT 10;

-- Audit trail
SELECT created_at, actor, action, target
FROM audit_events
ORDER BY created_at DESC LIMIT 20;

-- API key usage
SELECT id, role, tenant, created_at, revoked_at
FROM api_keys
WHERE revoked_at IS NULL;
```

---

## Getting Help

### Support Channels

1. **GitHub Issues:** https://github.com/your-org/third-eye-mcp/issues
2. **Documentation:** https://docs.third-eye-mcp.com
3. **Community Discord:** discord.gg/third-eye-mcp

### Reporting Bugs

Include the following information:

- **Environment:** Development/Staging/Production
- **Version:** Check `git describe --tags`
- **Error Message:** Full error text + stack trace
- **Steps to Reproduce:** Minimal reproduction case
- **Session ID:** If applicable
- **Logs:** Relevant server logs (redact secrets)

### Emergency Contacts

- **Critical Issues:** support@third-eye-mcp.com
- **Security:** security@third-eye-mcp.com

---

## Appendix: Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `E_BAD_PAYLOAD_SCHEMA` | Invalid request format | Fix payload structure |
| `E_LLM_ERROR` | LLM provider unavailable | Check provider status |
| `E_ORCHESTRATION_FAILED` | Pipeline execution error | Review partial results |
| `E_AUTH_REQUIRED` | Missing API key | Include X-API-Key header |
| `E_QUOTA_EXCEEDED` | Rate limit hit | Wait or increase quota |
| `E_SESSION_EXPIRED` | Session TTL elapsed | Create new session |

---

**End of Troubleshooting Guide**
