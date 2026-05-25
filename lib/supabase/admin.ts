/**
 * Supabase Admin Client Factory
 * Provides a singleton instance with service role for bypassing RLS
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Singleton instance pour réutilisation
let supabaseAdminInstance: SupabaseClient<Database> | null = null;

/**
 * Get or create Supabase admin client with service role
 * Bypasses RLS policies - use with caution
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    supabaseAdminInstance = createClient<Database>(supabaseUrl, serviceRoleKey);
  }

  return supabaseAdminInstance;
}
