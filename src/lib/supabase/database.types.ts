export type GoalStatus = 'active' | 'completed'

export type Goal = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string | null
  status: GoalStatus
  start_date: string | null
  due_date: string | null
  sort_order: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type KeyResult = {
  id: string
  user_id: string
  goal_id: string
  title: string
  metric_type: 'numeric' | 'boolean'
  direction: 'increase' | 'decrease' | null
  start_value: number | null
  target_value: number | null
  unit: string | null
  weight: number
  sort_order: number
  created_at: string
  updated_at: string
}

export type KeyResultUpdate = {
  id: string
  user_id: string
  key_result_id: string
  numeric_value: number | null
  boolean_value: boolean | null
  note: string | null
  recorded_at: string
  created_at: string
}

type Profile = {
  user_id: string
  display_name: string | null
  theme: 'dark' | 'light'
  locale: string
  timezone: string
  week_starts_on: number
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      goals: {
        Row: Goal
        Insert: Omit<Goal, 'id' | 'completed_at' | 'created_at' | 'updated_at' | 'status' | 'sort_order'> & {
          id?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          status?: GoalStatus
          sort_order?: number
        }
        Update: Partial<Omit<Goal, 'id' | 'created_at' | 'updated_at'>> & {
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      key_results: {
        Row: KeyResult
        Insert: Omit<KeyResult, 'id' | 'created_at' | 'updated_at' | 'sort_order' | 'weight'> & {
          id?: string
          created_at?: string
          updated_at?: string
          sort_order?: number
          weight?: number
        }
        Update: Partial<Omit<KeyResult, 'id' | 'user_id' | 'goal_id' | 'created_at' | 'updated_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      key_result_updates: {
        Row: KeyResultUpdate
        Insert: Omit<KeyResultUpdate, 'id' | 'created_at' | 'recorded_at'> & {
          id?: string
          created_at?: string
          recorded_at?: string
        }
        Update: never
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'user_id' | 'created_at' | 'updated_at'>> & {
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
