import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useMyGames } from '../hooks/useMyGames'

export default function HistoryPage() {
  const { games, loading, error, signedIn, initializing } = useMyGames({
    finishedOnly: true,
  })

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Histórico</h1>
        <Link to="/">
          <Button variant="secondary">Voltar</Button>
        </Link>
      </div>

      {!initializing && !signedIn && (
        <p className="text-foreground-muted">
          <Link
            to="/login?next=%2Fhistory"
            className="text-accent hover:text-accent-hover"
          >
            Entre
          </Link>{' '}
          para ver seu histórico de jogos.
        </p>
      )}

      {loading && <p className="text-foreground-muted">Carregando...</p>}

      {error && (
        <p className="text-danger">
          Erro ao carregar histórico: {error.message}
        </p>
      )}

      {signedIn && !loading && !error && games.length === 0 && (
        <p className="text-foreground-muted">Nenhum jogo finalizado ainda.</p>
      )}

      <div className="flex flex-col gap-4">
        {games.map((game) => (
          <Link
            key={game.id}
            to={`/scoreboard/${game.id}`}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-hover"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                {game.home_team_name} {game.final_home_score} x{' '}
                {game.final_away_score} {game.away_team_name}
              </span>
              <span className="text-sm text-foreground-muted">
                {game.finished_at
                  ? new Date(game.finished_at).toLocaleDateString('pt-BR')
                  : '-'}
              </span>
            </div>
            <div className="text-xs text-foreground-subtle">
              Clique para ver o placar final
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
