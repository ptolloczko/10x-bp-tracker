#!/usr/bin/env bash

# Cleanup script to completely remove Supabase-related Docker resources.
# Stops any running Supabase stack (via supabase CLI) and then force-removes
# containers, networks, and volumes whose names start with "supabase_".

set -euo pipefail

# Stop the Supabase stack if it is running (ignores errors if it is not)
if command -v supabase >/dev/null 2>&1; then
  echo "🛑 Stopping Supabase stack (if running)…"
  # --remove removes local database files in ~/.supabase/docker
  npx supabase stop --remove || true
fi

echo "🗑  Removing Supabase containers…"
docker ps -a --filter "name=supabase_" --format "{{.ID}}" | xargs -r docker rm -f

echo "🗑  Removing Supabase networks…"
docker network ls --filter "name=supabase_" --format "{{.ID}}" | xargs -r docker network rm

echo "🗑  Removing Supabase volumes…"
docker volume ls --filter "name=supabase_" --format "{{.Name}}" | xargs -r docker volume rm

echo "✅ Supabase Docker resources removed successfully."

