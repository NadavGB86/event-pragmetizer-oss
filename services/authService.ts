import { supabase } from './supabaseClient';

const NOT_CONFIGURED = 'Cloud features are not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local';

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.auth.signInWithOtp({ email });
  return { error: error?.message ?? null };
}

export async function verifyOTP(email: string, token: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  return { error: error?.message ?? null };
}

export async function logout(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}
