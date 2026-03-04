import { createClient } from '@supabase/supabase-js'

// Publishable key (recomendada) — seguridad manejada por RLS en Supabase
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || 'https://toflynewguhlusvohseh.supabase.co'
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-eWQsXpRZf-KQqB4R7XKZw_ROqo3PFd'

export const supabase = createClient(supabaseUrl, supabaseKey)
