import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * Supabase client configured for browser/client-side usage
 * - Session persistence enabled (uses localStorage + cookies)
 * - Auto refresh tokens enabled
 * - Detects session from URL (for password reset flows)
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

export type SupabaseClient = typeof supabaseClient;

/**
 * @deprecated This will be removed once authentication is fully implemented.
 * Use context.locals.user.id in API endpoints instead.
 */
export const DEFAULT_USER_ID = "408128e0-7ece-4062-849e-b94c3e79a96e";
