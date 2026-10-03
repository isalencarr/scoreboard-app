import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Protege rotas. Sem sessão, manda para /login guardando o destino em `next`.
 *
 * Usável como rota de layout (com <Outlet />) ou envolvendo um elemento.
 *
 * @param {{ children?: React.ReactNode }} props
 */
export default function RequireAuth({ children }) {
  const { session, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground-muted">
        Carregando...
      </div>
    )
  }

  if (!session) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return children ?? <Outlet />
}
