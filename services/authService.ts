import { supabase } from './supabaseClient';

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({ email });
  return { error: error?.message ?? null };
}

export async function verifyOTP(email: string, token: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  return { error: error?.message ?? null };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}
