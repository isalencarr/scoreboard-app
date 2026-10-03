import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminShell from '../../components/admin/AdminShell'
import GameStatusBadge from '../../components/admin/GameStatusBadge'
import Button from '../../components/ui/Button'
import { formatScoreline } from '../../lib/gameEvents'
import { useMyGames } from '../../hooks/useMyGames'

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'live', label: 'Ao vivo' },
  { key: 'upcoming', label: 'Agendados' },
  { key: 'finished', label: 'Finalizados' },
]

export default function AdminGamesPage() {
  const { games, loading, error } = useMyGames()
  const [filter, setFilter] = useState('all')

  const counts = useMemo(
    () =>
      games.reduce(
        (acc, game) => ({ ...acc, [game.status]: (acc[game.status] ?? 0) + 1 }),
        { all: games.length }
      ),
    [games]
  )

  const visible = useMemo(
    () => (filter === 'all' ? games : games.filter((g) => g.status === filter)),
    [games, filter]
  )

  return (
    <AdminShell
      title="Meus jogos"
      subtitle="Controle o placar, acompanhe o histórico e transmita a tela pública."
      actions={
        <Link to="/scoreboard/new">
          <Button className="gap-1">
            <Plus size={16} />
            Novo jogo
          </Button>
        </Link>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              filter === key
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border text-foreground-muted hover:bg-surface-hover'
            }`}
          >
            {label}
            <span className="ml-1.5 text-foreground-subtle">
              {counts[key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {loading && <p className="text-foreground-muted">Carregando...</p>}

      {error && (
        <p className="text-danger">Erro ao carregar jogos: {error.message}</p>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-foreground-muted">
            Você ainda não criou nenhum jogo.
          </p>
          <Link to="/scoreboard/new" className="mt-4 inline-block">
            <Button>Criar o primeiro jogo</Button>
          </Link>
        </div>
      )}

      {!loading && !error && games.length > 0 && visible.length === 0 && (
        <p className="text-foreground-muted">
          Nenhum jogo nesse filtro.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {visible.map((game) => (
          <Link
            key={game.id}
            to={`/admin/games/${game.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-hover"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="truncate font-semibold text-foreground">
                  {game.home_team_name} x {game.away_team_name}
                </span>
                <GameStatusBadge status={game.status} />
              </div>
              <p className="mt-1 text-xs text-foreground-subtle">
                {game.status === 'finished' && game.finished_at
                  ? `Finalizado em ${new Date(game.finished_at).toLocaleString('pt-BR')}`
                  : `Criado em ${new Date(game.created_at).toLocaleString('pt-BR')}`}
              </p>
            </div>
            <span className="text-xl font-bold tabular-nums text-foreground">
              {formatScoreline(game)}
            </span>
          </Link>
        ))}
      </div>
    </AdminShell>
  )
}
