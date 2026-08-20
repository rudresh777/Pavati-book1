import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
);

let serverClientInstance: SupabaseClient | null = null;

/**
 * Server-side Supabase client for API routes and Server Components.
 * Prioritizes SUPABASE_SERVICE_ROLE_KEY to perform backend operations.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseServerConfigured) {
    return null;
  }

  if (serverClientInstance) {
    return serverClientInstance;
  }

  const keyToUse = supabaseServiceRoleKey || supabaseAnonKey;

  serverClientInstance = createClient(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClientInstance;
}
