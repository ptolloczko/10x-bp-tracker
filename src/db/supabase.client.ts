import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing PUBLIC_SUPABASE_KEY environment variable");
}

/**
 * Supabase client configured for browser/client-side usage
 * - Session persistence enabled (uses localStorage + cookies)
 * - Auto refresh tokens enabled
 * - Detects session from URL (for password reset flows)
 * - Uses implicit flow (simpler, works better with password recovery)
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "implicit",
  },
});

export type SupabaseClient = typeof supabaseClient;
