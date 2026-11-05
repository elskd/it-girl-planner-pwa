import { supabase } from '../supabase/client'
import type { Goal, GoalStatus, KeyResult, KeyResultUpdate } from '../supabase/database.types'

export type GoalDraft = {
  title: string
  description: string | null
  category: string | null
}

export type KeyResultDraft = {
  title: string
  metric_type: KeyResult['metric_type']
  direction: KeyResult['direction']
  start_value: number | null
  target_value: number | null
  unit: string | null
  weight: number
}

function client() {
  if (!supabase) throw new Error('Не удалось подключиться к хранилищу. Обнови страницу и попробуй ещё раз.')
  return supabase
}

export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await client()
    .from('goals')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchKeyResults(): Promise<KeyResult[]> {
  const { data, error } = await client()
    .from('key_results')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data.map(row => ({
    ...row,
    start_value: row.start_value === null ? null : Number(row.start_value),
    target_value: row.target_value === null ? null : Number(row.target_value),
    weight: Number(row.weight),
  }))
}

export async function fetchKeyResultUpdates(): Promise<KeyResultUpdate[]> {
  const { data, error } = await client()
    .from('key_result_updates')
    .select('*')
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(row => ({
    ...row,
    numeric_value: row.numeric_value === null ? null : Number(row.numeric_value),
  }))
}

export async function createKeyResult(userId: string, goalId: string, draft: KeyResultDraft): Promise<KeyResult> {
  const { data, error } = await client()
    .from('key_results')
    .insert({ ...draft, user_id: userId, goal_id: goalId })
    .select('*')
    .single()
  if (error) throw error
  return { ...data, start_value: data.start_value === null ? null : Number(data.start_value), target_value: data.target_value === null ? null : Number(data.target_value), weight: Number(data.weight) }
}

export async function updateKeyResult(id: string, draft: KeyResultDraft): Promise<KeyResult> {
  const { data, error } = await client()
    .from('key_results')
    .update(draft)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return { ...data, start_value: data.start_value === null ? null : Number(data.start_value), target_value: data.target_value === null ? null : Number(data.target_value), weight: Number(data.weight) }
}

export async function deleteKeyResult(id: string): Promise<void> {
  const { error } = await client().from('key_results').delete().eq('id', id)
  if (error) throw error
}

export async function addKeyResultUpdate(
  userId: string,
  keyResultId: string,
  value: { numeric_value: number | null; boolean_value: boolean | null; note: string | null },
): Promise<KeyResultUpdate> {
  const { data, error } = await client()
    .from('key_result_updates')
    .insert({ ...value, user_id: userId, key_result_id: keyResultId })
    .select('*')
    .single()
  if (error) throw error
  return { ...data, numeric_value: data.numeric_value === null ? null : Number(data.numeric_value) }
}

export async function createGoal(userId: string, draft: GoalDraft): Promise<Goal> {
  const { data, error } = await client()
    .from('goals')
    .insert({ ...draft, start_date: null, due_date: null, user_id: userId })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateGoal(id: string, draft: GoalDraft & { status: GoalStatus }): Promise<Goal> {
  const { data, error } = await client()
    .from('goals')
    .update(draft)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function setGoalStatus(id: string, status: GoalStatus): Promise<Goal> {
  const { data, error } = await client()
    .from('goals')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await client().from('goals').delete().eq('id', id)
  if (error) throw error
}
