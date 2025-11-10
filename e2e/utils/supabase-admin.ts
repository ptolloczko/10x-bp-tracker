import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Create Supabase admin client with service role key
 * This bypasses RLS and allows full database access for teardown operations
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("PUBLIC_SUPABASE_URL environment variable is required for E2E teardown");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required for E2E teardown");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get Supabase admin client instance
 * Throws error if environment variables are not set
 */
export function getSupabaseAdmin() {
  return createSupabaseAdmin();
}
