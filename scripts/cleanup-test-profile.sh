#!/usr/bin/env bash

# Cleanup script to remove test profile from the database
# Uses Supabase REST API to delete the profile with DEFAULT_USER_ID

set -euo pipefail

DEFAULT_USER_ID="408128e0-7ece-4062-849e-b94c3e79a96e"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  exit 1
fi

# Source .env to get Supabase credentials
set -a
source .env
set +a

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_KEY:-}" ]; then
  echo "❌ Error: SUPABASE_URL or SUPABASE_KEY not set in .env"
  exit 1
fi

echo "🗑  Removing test profile (user_id: $DEFAULT_USER_ID)..."

# Delete profile using Supabase REST API
response=$(curl -s -w "\n%{http_code}" -X DELETE \
  "${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${DEFAULT_USER_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

status=$(echo "$response" | tail -n 1)

if [ "$status" = "204" ] || [ "$status" = "200" ]; then
  echo "✅ Test profile removed successfully"
else
  echo "⚠️  Status: $status"
  echo "Response: $(echo "$response" | head -n -1)"
fi

