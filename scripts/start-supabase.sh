#!/bin/bash

# Uruchom Supabase w tle
nohup npx supabase start > /tmp/supabase-start.log 2>&1 &

echo "🚀 Supabase is starting in the background..."
echo "📊 Check status with: npm run supabase:status"
echo "📝 Logs: tail -f /tmp/supabase-start.log"

# Czekaj kilka sekund, żeby kontenery się uruchomiły
sleep 5

# Sprawdź status
npx supabase status 2>/dev/null || echo "⏳ Supabase is still starting up. Please wait a moment and check again."

