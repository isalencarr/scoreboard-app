import { Link } from 'react-router-dom'
import UserMenu from '../components/auth/UserMenu'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { session, initializing } = useAuth()

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 p-6">
      <header className="flex justify-end">
        <UserMenu />
      </header>

      <div className="mt-8 text-center">
        <h1 className="text-4xl font-bold text-foreground md:text-5xl">
          Scoreboard
        </h1>
        <p className="mt-4 text-foreground-muted">
          Crie um jogo, controle o placar em tempo real e transmita para o
          público.
        </p>
      </div>

      {!initializing && (
        <div className="flex flex-wrap justify-center gap-4">
          {session ? (
            <>
              <Link to="/admin">
                <Button>Meus jogos</Button>
              </Link>
              <Link to="/scoreboard/new">
                <Button variant="secondary">Novo jogo</Button>
              </Link>
            </>
          ) : (
            <Link to="/login">
              <Button>Entrar para começar</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
