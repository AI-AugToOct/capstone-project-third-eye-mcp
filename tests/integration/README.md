# Integration Tests

End-to-end integration tests for Third Eye MCP server.

## Running Integration Tests

Integration tests require a running Third Eye API server and are disabled by default.

### Setup

1. Start the API server:
   ```bash
   docker-compose up third-eye-api
   ```

2. Set environment variables:
   ```bash
   export RUN_INTEGRATION_TESTS=1
   export API_URL=http://localhost:8000
   export THIRD_EYE_API_KEY=your_api_key_here
   ```

3. Run tests:
   ```bash
   pytest tests/integration/ -v
   ```

### Test Coverage

- `test_mcp_flow.py`: Core MCP protocol flows
  - Navigator entry point
  - Clarification flow (Sharingan -> Helper -> Jogan)
  - Pipeline enforcement
  - Session isolation
  - Trace ID propagation
  - Agent-friendly response format

## Writing Integration Tests

Integration tests should:
- Use `pytest.mark.asyncio` for async tests
- Check `RUN_INTEGRATION_TESTS` environment variable
- Use real HTTP calls to API endpoints
- Verify end-to-end behavior, not implementation details
- Test error cases and recovery flows

## CI/CD Integration

Integration tests can be run in CI by:
1. Starting services with `docker-compose up -d`
2. Waiting for health checks to pass
3. Running pytest with `RUN_INTEGRATION_TESTS=1`
4. Tearing down services

Example:
```yaml
- name: Run integration tests
  run: |
    docker-compose up -d
    sleep 10  # Wait for services
    export RUN_INTEGRATION_TESTS=1
    export API_URL=http://localhost:8000
    export THIRD_EYE_API_KEY=test_key
    pytest tests/integration/ -v
    docker-compose down
```
