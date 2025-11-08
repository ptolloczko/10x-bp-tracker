#!/bin/bash

echo "🚀 Starting Supabase..."
echo "⚠️  This will run in foreground - keep this terminal open!"
echo "📊 To check status in another terminal: npm run supabase:status"
echo "🛑 To stop: Ctrl+C or npm run supabase:stop"
echo ""
echo "🔍 Running with ignore-health-check to bypass timeout issues..."
echo ""

# Uruchom Supabase w foreground z ignore-health-check
npx supabase start --ignore-health-check

