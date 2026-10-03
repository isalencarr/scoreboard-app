import { Link } from 'react-router-dom'
import UserMenu from '../components/auth/UserMenu'
import Button from '../components/ui/Button'
import { useMyGames } from '../hooks/useMyGames'

export default function HomePage() {
  const { games, loading, error, signedIn, initializing } = useMyGames()

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <header className="flex justify-end">
        <UserMenu />
      </header>

      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground md:text-5xl">
          Scoreboard
        </h1>
        <p className="mt-4 text-foreground-muted">
          Crie um jogo, controle o placar em tempo real e transmita para o
          público.
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Link to="/scoreboard/new">
          <Button>Novo jogo</Button>
        </Link>
        <Link to="/history">
          <Button variant="secondary">Histórico</Button>
        </Link>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Meus jogos
        </h2>

        {!initializing && !signedIn && (
          <p className="text-foreground-muted">
            <Link to="/login" className="text-accent hover:text-accent-hover">
              Entre
            </Link>{' '}
            para ver e controlar seus jogos.
          </p>
        )}

        {loading && <p className="text-foreground-muted">Carregando...</p>}

        {error && (
          <p className="text-danger">Erro ao carregar jogos: {error.message}</p>
        )}

        {signedIn && !loading && !error && games.length === 0 && (
          <p className="text-foreground-muted">Nenhum jogo criado ainda.</p>
        )}

        <div className="flex flex-col gap-3">
          {games.map((game) => (
            <Link
              key={game.id}
              to={`/scoreboard/${game.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-hover"
            >
              <div className="font-semibold text-foreground">
                {game.home_team_name} x {game.away_team_name}
              </div>
              <div className="text-sm text-foreground-muted">
                {game.status === 'finished' ? 'Finalizado' : 'Em andamento'}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
