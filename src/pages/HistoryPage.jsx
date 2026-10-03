import { Link } from 'react-router-dom'
import AdminShell from '../components/admin/AdminShell'
import { formatScoreline } from '../lib/gameEvents'
import { useMyGames } from '../hooks/useMyGames'

export default function HistoryPage() {
  const { games, loading, error } = useMyGames({ finishedOnly: true })

  return (
    <AdminShell
      title="Histórico"
      subtitle="Seus jogos finalizados, do mais recente para o mais antigo."
      backTo="/admin"
      backLabel="Meus jogos"
    >
      {loading && <p className="text-foreground-muted">Carregando...</p>}

      {error && (
        <p className="text-danger">
          Erro ao carregar histórico: {error.message}
        </p>
      )}

      {!loading && !error && games.length === 0 && (
        <p className="text-foreground-muted">Nenhum jogo finalizado ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            to={`/admin/games/${game.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-hover"
          >
            <div className="min-w-0">
              <span className="truncate font-semibold text-foreground">
                {game.home_team_name} x {game.away_team_name}
              </span>
              <p className="mt-1 text-xs text-foreground-subtle">
                {game.finished_at
                  ? new Date(game.finished_at).toLocaleString('pt-BR')
                  : '-'}
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
