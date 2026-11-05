import { supabase } from '../supabase/client'
import type { PlannerTask } from '../supabase/database.types'

export type PlannerTaskDraft = Pick<PlannerTask, 'title' | 'description' | 'goal_id' | 'due_date' | 'start_at' | 'end_at'>
export type PlannerPreferences = { timezone: string; weekStartsOn: number; locale: string }

function client() {
  if (!supabase) throw new Error('Не удалось подключиться к хранилищу. Обнови страницу и попробуй ещё раз.')
  return supabase
}

export async function fetchPlannerTasks(): Promise<PlannerTask[]> {
  const { data, error } = await client()
    .from('planner_tasks')
    .select('*')
    .order('due_date', { ascending: true })
    .order('start_at', { ascending: true, nullsFirst: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function fetchPlannerPreferences(userId: string): Promise<PlannerPreferences> {
  const { data, error } = await client()
    .from('profiles')
    .select('timezone, week_starts_on, locale')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return {
    timezone: data?.timezone || 'Europe/Moscow',
    weekStartsOn: data?.week_starts_on || 1,
    locale: data?.locale || 'ru-RU',
  }
}

export async function createPlannerTask(userId: string, draft: PlannerTaskDraft): Promise<PlannerTask> {
  const { data, error } = await client()
    .from('planner_tasks')
    .insert({ ...draft, user_id: userId })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updatePlannerTask(id: string, draft: PlannerTaskDraft): Promise<PlannerTask> {
  const { data, error } = await client()
    .from('planner_tasks')
    .update(draft)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function setPlannerTaskCompleted(id: string, completed: boolean): Promise<PlannerTask> {
  const { data, error } = await client()
    .from('planner_tasks')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deletePlannerTask(id: string): Promise<void> {
  const { error } = await client().from('planner_tasks').delete().eq('id', id)
  if (error) throw error
}
