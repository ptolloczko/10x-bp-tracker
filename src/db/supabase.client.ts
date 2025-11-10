import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

// In CI/test environments, allow missing env vars and use dummy values
// This prevents middleware from crashing during E2E test setup
const isCI = import.meta.env.CI === true || import.meta.env.CI === "true";

if (!supabaseUrl && !isCI) {
  throw new Error("Missing PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey && !isCI) {
  throw new Error("Missing PUBLIC_SUPABASE_KEY environment variable");
}

// Use dummy values in CI if secrets are not available
const url = supabaseUrl || "https://dummy.supabase.co";
const key = supabaseAnonKey || "dummy-anon-key";

/**
 * Supabase client configured for browser/client-side usage
 * - Session persistence enabled (uses localStorage + cookies)
 * - Auto refresh tokens enabled
 * - Detects session from URL (for password reset flows)
 * - Uses implicit flow (simpler, works better with password recovery)
 * 
 * Note: In CI/test environments without proper secrets, a dummy client is created
 * to allow the app to start. Tests should mock Supabase calls as needed.
 */
export const supabaseClient = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "implicit",
  },
});

export type SupabaseClient = typeof supabaseClient;
