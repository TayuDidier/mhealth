import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using demo mode with seed data.')
}

export const supabase = createClient(
  // Fallbacks intentionally point at a placeholder so the app runs in demo mode
  // (see DEMO_MODE in AuthContext) when no credentials are provided. Real values
  // come from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (set in .env.local for
  // local dev, or the Vercel project's Environment Variables in production).
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      storageKey: 'mhealth-auth',
      storage: window.localStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
