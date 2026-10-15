import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * The community backend, or null when the build has no Supabase project configured.
 * PKCE returns the sign-in code in the query string, which leaves the hash router alone.
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } })
    : null;
