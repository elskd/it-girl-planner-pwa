import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const supabase = supabaseUrl && publishableKey
  ? createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  : null

