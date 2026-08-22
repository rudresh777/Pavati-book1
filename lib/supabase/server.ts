import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isSupabaseServerConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return Boolean(url && (serviceKey || anonKey));
}

let serverClientInstance: SupabaseClient | null = null;

/**
 * Server-side Supabase client for API routes and Server Components.
 * Prioritizes SUPABASE_SERVICE_ROLE_KEY to perform backend operations.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const keyToUse = supabaseServiceRoleKey || supabaseAnonKey;

  if (serverClientInstance) {
    return serverClientInstance;
  }

  serverClientInstance = createClient(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
    },
    realtime: {
      transport: ws as any,
    },
  });

  return serverClientInstance;
}
