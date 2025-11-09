#!/bin/bash

# Script to ensure Supabase is running before E2E tests
# This script checks if Supabase is running and starts it if needed

set -e

echo "🔍 Checking Supabase status..."

# Check if Supabase is already running
if supabase status > /dev/null 2>&1; then
  echo "✅ Supabase is already running"
else
  echo "⚠️  Supabase is not running. Starting..."
  
  # Start Supabase
  if [ -x "./scripts/start-supabase.sh" ]; then
    ./scripts/start-supabase.sh
  else
    supabase start
  fi
  
  echo "✅ Supabase started successfully"
fi

echo "🚀 Running Playwright E2E tests..."
npx playwright test "$@"

