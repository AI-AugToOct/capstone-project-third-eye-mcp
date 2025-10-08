#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Third Eye Login Diagnostic Tool ==="
echo ""

# Check if services are running
if ! docker compose -p third-eye-mcp ps third-eye-api 2>/dev/null | grep -q "Up"; then
  echo "❌ Error: third-eye-api container is not running"
  exit 1
fi

echo "✅ API container is running"
echo ""

# Check database for admin account
echo "📊 Checking database for admin accounts..."
admin_count=$(docker compose -p third-eye-mcp exec -T postgres psql -U thirdeye -d thirdeye_db -t -c "SELECT COUNT(*) FROM admin_accounts;" 2>/dev/null | tr -d ' ' || echo "0")
echo "   Found $admin_count admin account(s)"

if [[ "$admin_count" -gt 0 ]]; then
  echo ""
  echo "📧 Admin account details:"
  docker compose -p third-eye-mcp exec -T postgres psql -U thirdeye -d thirdeye_db -c "SELECT email, display_name, require_password_reset, created_at, last_login_at FROM admin_accounts;" 2>/dev/null || echo "Failed to query"

  echo ""
  echo "🔐 Password hash (first 50 chars):"
  docker compose -p third-eye-mcp exec -T postgres psql -U thirdeye -d thirdeye_db -t -c "SELECT SUBSTRING(password_hash, 1, 50) || '...' FROM admin_accounts LIMIT 1;" 2>/dev/null || echo "Failed to query"
fi

echo ""
echo "📋 Extracting credentials from API logs..."
logs=$(docker compose -p third-eye-mcp logs third-eye-api 2>/dev/null | tail -300)

# Count how many times password was generated
password_count=$(echo "$logs" | grep -c "GENERATED ADMIN PASSWORD" || echo "0")
echo "   Password generation events: $password_count"

if [[ "$password_count" -gt 1 ]]; then
  echo "   ⚠️  WARNING: Password was generated $password_count times!"
  echo "   This means bootstrap ran multiple times (database may have been reset)"
fi

# Extract all generated passwords
if [[ "$password_count" -gt 0 ]]; then
  echo ""
  echo "🔑 Generated passwords (most recent last):"
  echo "$logs" | grep "GENERATED ADMIN PASSWORD" | sed -E 's/.*GENERATED ADMIN PASSWORD: ([^",]+).*/   → \1/' || echo "   (extraction failed)"
fi

# Check for API keys
api_key_count=$(echo "$logs" | grep -c "GENERATED API KEY" || echo "0")
if [[ "$api_key_count" -gt 0 ]]; then
  echo ""
  echo "🔐 Generated API keys (most recent last):"
  echo "$logs" | grep "GENERATED API KEY" | sed -E 's/.*GENERATED API KEY: ([^",]+).*/   → \1/' || echo "   (extraction failed)"
fi

# Check .env file
echo ""
echo "📄 Checking .env file..."
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  if grep -q "^ADMIN_BOOTSTRAP_PASSWORD=" "$PROJECT_ROOT/.env" 2>/dev/null; then
    env_password=$(grep "^ADMIN_BOOTSTRAP_PASSWORD=" "$PROJECT_ROOT/.env" | cut -d'=' -f2-)
    echo "   ✅ ADMIN_BOOTSTRAP_PASSWORD is set in .env"
    echo "   Value: $env_password"

    # Compare with logged password
    if [[ "$password_count" -gt 0 ]]; then
      latest_logged=$(echo "$logs" | grep "GENERATED ADMIN PASSWORD" | tail -1 | sed -E 's/.*GENERATED ADMIN PASSWORD: ([^",]+).*/\1/' || echo "")
      if [[ -n "$latest_logged" && "$env_password" != "$latest_logged" ]]; then
        echo ""
        echo "   ⚠️  MISMATCH DETECTED!"
        echo "   .env password:     $env_password"
        echo "   Logged password:   $latest_logged"
        echo ""
        echo "   This is your problem! The .env password doesn't match what was logged."
        echo "   The database uses the logged password, not the .env password."
      fi
    fi
  else
    echo "   ℹ️  ADMIN_BOOTSTRAP_PASSWORD not set in .env (using auto-generated)"
  fi
else
  echo "   ℹ️  No .env file found"
fi

# Check environment in container
echo ""
echo "🔧 Checking environment in API container..."
container_env=$(docker compose -p third-eye-mcp exec -T third-eye-api printenv ADMIN_BOOTSTRAP_PASSWORD 2>/dev/null || echo "")
if [[ -n "$container_env" ]]; then
  echo "   ADMIN_BOOTSTRAP_PASSWORD in container: $container_env"
else
  echo "   ADMIN_BOOTSTRAP_PASSWORD not set in container (will auto-generate)"
fi

# Recent bootstrap logs
echo ""
echo "📖 Recent bootstrap-related logs:"
echo "$logs" | grep -i "bootstrap\|admin account" | tail -10 || echo "   (no bootstrap logs found)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 RECOMMENDATIONS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ "$password_count" -gt 1 ]]; then
  echo "1. ⚠️  Your database was reset $password_count times"
  echo "   → Use the MOST RECENT password from the logs above"
  echo ""
fi

if [[ "$admin_count" -eq 0 ]]; then
  echo "2. ❌ No admin account in database!"
  echo "   → Check API startup logs for errors:"
  echo "     docker compose -p third-eye-mcp logs third-eye-api | grep -i error"
  echo ""
fi

latest_password=$(echo "$logs" | grep "GENERATED ADMIN PASSWORD" | tail -1 | sed -E 's/.*GENERATED ADMIN PASSWORD: ([^",]+).*/\1/' || echo "")
if [[ -n "$latest_password" ]]; then
  echo "3. 🔑 Try logging in with:"
  echo "   Email:    admin@third-eye.local"
  echo "   Password: $latest_password"
  echo "   URL:      http://localhost:5174"
  echo ""

  if [[ -f "$PROJECT_ROOT/.env" ]]; then
    if ! grep -q "^ADMIN_BOOTSTRAP_PASSWORD=" "$PROJECT_ROOT/.env" 2>/dev/null; then
      echo "4. 💾 Save this password to .env to prevent regeneration:"
      echo "   echo 'ADMIN_BOOTSTRAP_PASSWORD=$latest_password' >> .env"
      echo ""
    fi
  fi
fi

echo "5. 🔄 If still failing, reset everything:"
echo "   ./start.sh stop"
echo "   docker compose -p third-eye-mcp down -v  # WARNING: deletes all data"
echo "   rm .env  # Start fresh"
echo "   ./start.sh start"
echo ""
