import { ExternalLink, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ClockAdjust from '../components/control/ClockAdjust'
import ClockControls from '../components/control/ClockControls'
import ControlClock from '../components/control/ControlClock'
import ControlQRModal from '../components/control/ControlQRModal'
import FinishGameModal from '../components/control/FinishGameModal'
import FoulControls from '../components/control/FoulControls'
import PeriodControls from '../components/control/PeriodControls'
import ScoreButtons from '../components/control/ScoreButtons'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useGame } from '../hooks/useGame'
import { fetchGameControlToken, finishGame } from '../hooks/useGameActions'

export default function ControlPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [ownerToken, setOwnerToken] = useState(null)
  const { addToast } = useToast()
  const { user } = useAuth()

  const { game, loading, error, realtimeStatus } = useGame(id)

  const urlToken = searchParams.get('token')
  const isOwner = !!user && !!game && game.user_id === user.id

  // O dono chega pela área administrativa sem token na URL: busca o dele.
  useEffect(() => {
    if (urlToken || !isOwner || !id) return

    let isCancelled = false

    fetchGameControlToken(id)
      .then((value) => {
        if (!isCancelled) setOwnerToken(value)
      })
      .catch((err) => {
        console.error('Erro ao buscar token de controle:', err)
      })

    return () => {
      isCancelled = true
    }
  }, [urlToken, isOwner, id])

  const token = urlToken ?? ownerToken
  const controlUrl =
    typeof window === 'undefined'
      ? ''
      : token
        ? `${window.location.origin}/scoreboard/${id}/control?token=${token}`
        : window.location.href

  async function handleFinishGame() {
    if (!token || !id) return
    setFinishing(true)
    try {
      await finishGame(id, token)
      setShowFinishModal(false)
      window.location.href = '/history'
    } catch (err) {
      console.error('Erro ao finalizar jogo:', err)
      addToast('Erro ao finalizar jogo. Verifique o token de controle.')
    } finally {
      setFinishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        Carregando...
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-danger">
        Jogo não encontrado.
      </div>
    )
  }

  const periodLabel = game.is_overtime ? 'OT' : `Q${game.period}`

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header resumo discreto para o operador */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-4 text-foreground">
          <span className="font-semibold">{game.home_team_name}</span>
          <span className="text-xl font-bold">
            {game.home_score} x {game.away_score}
          </span>
          <span className="font-semibold">{game.away_team_name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-foreground-muted">
            {periodLabel} ·{' '}
            <ControlClock
              seconds={game.clock_seconds}
              running={game.clock_running}
              updatedAt={game.clock_updated_at}
            />
          </div>
          <Link
            to={`/scoreboard/${game.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost gap-1 text-xs"
          >
            Placar público
            <ExternalLink size={14} />
          </Link>
          <button
            onClick={() => setShowQRModal(true)}
            className="btn-ghost gap-1 text-xs"
            aria-label="QR code para controle no celular"
          >
            QR Code
            <QrCode size={14} />
          </button>
        </div>
      </header>

      {/* Painel de controle em landscape */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
        <section className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-center text-lg font-bold text-foreground">
            {game.home_team_name}
          </h2>
          <ScoreButtons
            gameId={game.id}
            team="home"
            controlToken={token}
            currentScore={game.home_score}
          />
          <FoulControls
            gameId={game.id}
            team="home"
            controlToken={token}
            currentFouls={game.home_fouls}
          />
        </section>

        <section className="flex flex-col justify-center gap-4">
          <ClockControls gameId={game.id} controlToken={token} game={game} />
          <ClockAdjust
            key={game.clock_seconds}
            gameId={game.id}
            controlToken={token}
            game={game}
          />
          <PeriodControls gameId={game.id} controlToken={token} game={game} />
          <button
            onClick={() => setShowFinishModal(true)}
            className="btn-secondary text-danger border-danger hover:bg-danger/10"
          >
            Finalizar jogo
          </button>
        </section>

        <section className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-center text-lg font-bold text-foreground">
            {game.away_team_name}
          </h2>
          <ScoreButtons
            gameId={game.id}
            team="away"
            controlToken={token}
            currentScore={game.away_score}
          />
          <FoulControls
            gameId={game.id}
            team="away"
            controlToken={token}
            currentFouls={game.away_fouls}
          />
        </section>
      </main>

      <FinishGameModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onConfirm={handleFinishGame}
        loading={finishing}
      />

      <ControlQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        url={controlUrl}
      />

      {!token && !isOwner && (
        <div className="absolute right-4 top-14 rounded bg-danger/20 px-3 py-1 text-sm text-danger">
          Modo visualização — token não encontrado
        </div>
      )}

      {realtimeStatus !== 'SUBSCRIBED' && (
        <div className="absolute left-4 top-14 rounded bg-yellow-500/20 px-3 py-1 text-sm text-yellow-500">
          {realtimeStatus === 'CHANNEL_ERROR'
            ? 'Erro de conexão em tempo real'
            : 'Conectando...'}
        </div>
      )}
    </div>
  )
}
