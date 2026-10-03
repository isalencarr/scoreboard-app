import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'

/**
 * Mantém a sessão do Supabase sincronizada com a árvore React.
 *
 * O login é sem senha: o usuário informa o e-mail, recebe um link mágico
 * (ou um código de 6 dígitos) e volta autenticado.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let isCancelled = false

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isCancelled) return
        setSession(data.session ?? null)
      })
      .finally(() => {
        if (!isCancelled) setInitializing(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isCancelled) return
      setSession(nextSession ?? null)
      setInitializing(false)
    })

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Envia o link mágico para o e-mail informado.
   *
   * @param {string} email
   * @param {string} [redirectTo] URL absoluta de retorno
   */
  const signInWithEmail = useCallback(async (email, redirectTo) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo:
          redirectTo ??
          (typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined),
      },
    })

    if (error) {
      throw error
    }
  }, [])

  /**
   * Alternativa ao link: valida o código de 6 dígitos enviado por e-mail.
   *
   * @param {string} email
   * @param {string} code
   */
  const verifyEmailCode = useCallback(async (email, code) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })

    if (error) {
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      initializing,
      signInWithEmail,
      verifyEmailCode,
      signOut,
    }),
    [session, initializing, signInWithEmail, verifyEmailCode, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
