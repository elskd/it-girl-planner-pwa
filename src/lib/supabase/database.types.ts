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
