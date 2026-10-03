import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

const DEFAULT_REDIRECT = '/'
const TIMEOUT_MS = 15000

/**
 * O cliente Supabase é criado com `detectSessionInUrl`, então ele troca o
 * código do link mágico por uma sessão automaticamente. Esta página apenas
 * espera a sessão aparecer e redireciona.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, initializing } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  const next = searchParams.get('next') || DEFAULT_REDIRECT

  // O Supabase devolve falhas na query string ou no fragmento da URL.
  const urlError = useMemo(() => {
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, '')
    )
    return (
      searchParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error')
    )
  }, [searchParams])

  const error =
    urlError || (timedOut ? 'O link expirou ou já foi utilizado.' : null)

  useEffect(() => {
    if (session) {
      navigate(next, { replace: true })
    }
  }, [session, next, navigate])

  useEffect(() => {
    if (error || session) return

    const timeout = setTimeout(() => setTimedOut(true), TIMEOUT_MS)

    return () => clearTimeout(timeout)
  }, [error, session])

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Não foi possível entrar
        </h1>
        <p className="text-sm text-foreground-muted">{error}</p>
        <Link to={`/login?next=${encodeURIComponent(next)}`}>
          <Button>Tentar novamente</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground-muted">
      {initializing ? 'Carregando...' : 'Entrando...'}
    </div>
  )
}
