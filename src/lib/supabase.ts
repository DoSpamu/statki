import { createClient } from '@supabase/supabase-js'

// Zmienne środowiskowe ładowane przez Vite z pliku .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
