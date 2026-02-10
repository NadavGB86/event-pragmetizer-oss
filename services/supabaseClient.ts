import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Startup diagnostics — check DevTools console to verify Supabase config state
if (supabaseConfigured) {
  console.info(`[Supabase] Configured — URL: ${supabaseUrl.slice(0, 30)}...`);
} else {
  console.warn('[Supabase] Credentials missing. Cloud features will be unavailable.');
  console.warn(`[Supabase] VITE_SUPABASE_URL=${supabaseUrl ? `"${supabaseUrl.slice(0, 20)}..."` : '(empty)'}, VITE_SUPABASE_ANON_KEY=${supabaseAnonKey ? '(set)' : '(empty)'}`);
}

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
