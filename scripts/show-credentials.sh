#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Third Eye Admin Credentials Extractor ==="
echo ""

if ! docker compose -p third-eye-mcp ps third-eye-api 2>/dev/null | grep -q "Up"; then
  echo "❌ Error: third-eye-api container is not running"
  echo "   Run './start.sh start' first"
  exit 1
fi

echo "📋 Extracting credentials from Docker logs..."
echo ""

logs=$(docker compose -p third-eye-mcp logs third-eye-api 2>/dev/null | tail -200)

admin_email=$(echo "$logs" | grep -o 'Admin Email: [^"]*' | head -1 | sed 's/Admin Email: //' || echo "")
admin_password=$(echo "$logs" | grep -o 'GENERATED ADMIN PASSWORD: [^"]*' | head -1 | sed 's/GENERATED ADMIN PASSWORD: //' | tr -d ',' || echo "")
admin_api_key=$(echo "$logs" | grep -o 'GENERATED API KEY: [^"]*' | head -1 | sed 's/GENERATED API KEY: //' | tr -d ',' || echo "")

if [[ -z "$admin_password" ]]; then
  admin_password=$(echo "$logs" | grep '"message":.*GENERATED ADMIN PASSWORD' | sed -E 's/.*GENERATED ADMIN PASSWORD: ([^"]+).*/\1/' | head -1 || echo "")
fi

if [[ -z "$admin_api_key" ]]; then
  admin_api_key=$(echo "$logs" | grep '"message":.*GENERATED API KEY' | sed -E 's/.*GENERATED API KEY: ([^"]+).*/\1/' | head -1 || echo "")
fi

if [[ -z "$admin_email" ]]; then
  admin_email="admin@third-eye.local"
fi

echo "┌────────────────────────────────────────────────────────────┐"
echo "│           🔐 ADMIN CREDENTIALS                             │"
echo "└────────────────────────────────────────────────────────────┘"
echo ""

if [[ -n "$admin_email" ]]; then
  echo "  📧 Email:    $admin_email"
else
  echo "  ⚠️  Email not found"
fi

if [[ -n "$admin_password" ]]; then
  echo "  🔑 Password: $admin_password"
else
  echo "  ❌ Password not found in logs"
  echo "     Run: docker compose -p third-eye-mcp logs third-eye-api | grep PASSWORD"
fi

if [[ -n "$admin_api_key" ]]; then
  echo "  🔐 API Key:  $admin_api_key"
else
  echo "  ❌ API key not found in logs"
  echo "     Run: docker compose -p third-eye-mcp logs third-eye-api | grep 'API KEY'"
fi

echo ""
echo "┌────────────────────────────────────────────────────────────┐"
echo "│           📝 QUICK START                                   │"
echo "└────────────────────────────────────────────────────────────┘"
echo ""
echo "  1. Open: http://localhost:5174"
echo "  2. Login with email and password above"
echo "  3. Save credentials to .env:"
echo ""

if [[ -n "$admin_password" ]]; then
  echo "     echo 'ADMIN_BOOTSTRAP_PASSWORD=$admin_password' >> .env"
fi

if [[ -n "$admin_api_key" ]]; then
  echo "     echo 'THIRD_EYE_API_KEY=$admin_api_key' >> .env"
fi

echo ""
