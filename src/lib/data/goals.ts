import { supabase } from '../supabase/client'
import type { Goal, GoalStatus } from '../supabase/database.types'

export type GoalDraft = {
  title: string
  description: string | null
  category: string | null
  start_date: string | null
  due_date: string | null
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

export async function createGoal(userId: string, draft: GoalDraft): Promise<Goal> {
  const { data, error } = await client()
    .from('goals')
    .insert({ ...draft, user_id: userId })
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
