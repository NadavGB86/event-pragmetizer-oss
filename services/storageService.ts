import { supabase } from './supabaseClient';
import type { AppState, CloudPlanHeader } from '../types';

const NOT_CONFIGURED = 'Cloud storage is not available. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local';

export async function savePlan(
  userId: string,
  title: string,
  appState: AppState
): Promise<{ id: string | null; error: string | null }> {
  if (!supabase) return { id: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from('plans')
    .insert({
      user_id: userId,
      title,
      data: appState,
    })
    .select('id')
    .single();

  return {
    id: data?.id ?? null,
    error: error?.message ?? null,
  };
}

export async function getPlans(userId: string): Promise<{ plans: CloudPlanHeader[]; error: string | null }> {
  if (!supabase) return { plans: [], error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from('plans')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return {
    plans: (data as CloudPlanHeader[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function loadPlan(planId: string): Promise<{ data: AppState | null; error: string | null }> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from('plans')
    .select('data')
    .eq('id', planId)
    .single();

  return {
    data: (data?.data as AppState) ?? null,
    error: error?.message ?? null,
  };
}

export async function deletePlan(planId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', planId);

  return { error: error?.message ?? null };
}
