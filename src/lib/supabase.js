import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos no .env'
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    // Mantém a sessão no localStorage e renova o token sozinho.
    persistSession: true,
    autoRefreshToken: true,
    // Troca o código do link mágico por sessão ao carregar /auth/callback.
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
