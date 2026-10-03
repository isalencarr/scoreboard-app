import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import UserMenu from '../auth/UserMenu'

/**
 * Moldura das páginas administrativas: cabeçalho, título e conteúdo.
 *
 * @param {{
 *   title: string
 *   subtitle?: React.ReactNode
 *   actions?: React.ReactNode
 *   backTo?: string
 *   backLabel?: string
 *   children: React.ReactNode
 * }} props
 */
export default function AdminShell({
  title,
  subtitle,
  actions,
  backTo,
  backLabel = 'Voltar',
  children,
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 p-4">
          <Link
            to="/admin"
            className="font-semibold text-foreground hover:text-accent"
          >
            Scoreboard
          </Link>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        {backTo && (
          <Link
            to={backTo}
            className="mb-4 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
        )}

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-foreground-muted">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>

        {children}
      </main>
    </div>
  )
}
