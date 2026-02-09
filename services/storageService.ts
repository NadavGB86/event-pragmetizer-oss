import { supabase } from './supabaseClient';
import type { AppState, CloudPlanHeader } from '../types';

export async function savePlan(
  userId: string,
  title: string,
  appState: AppState
): Promise<{ id: string | null; error: string | null }> {
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
  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', planId);

  return { error: error?.message ?? null };
}
