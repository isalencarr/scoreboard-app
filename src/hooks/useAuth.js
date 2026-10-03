import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

/**
 * @returns {{
 *   session: import('@supabase/supabase-js').Session | null
 *   user: import('@supabase/supabase-js').User | null
 *   initializing: boolean
 *   signInWithEmail: (email: string, redirectTo?: string) => Promise<void>
 *   verifyEmailCode: (email: string, code: string) => Promise<void>
 *   signOut: () => Promise<void>
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
