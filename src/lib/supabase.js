import { createClient } from '@supabase/supabase-js'

// Anon key es pública por diseño — la seguridad la manejan las políticas RLS
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || 'https://toflynewguhlusvohseh.supabase.co'
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZmx5bmV3Z3VobHVzdm9oc2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDIyMjQsImV4cCI6MjA4ODIxODIyNH0.TtFp3tEj8ApGzL9FXUrhac_kPsQ19cYxwuwVg2XXA7k'

export const supabase = createClient(supabaseUrl, supabaseKey)
