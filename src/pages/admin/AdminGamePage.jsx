import { Copy, ExternalLink, QrCode, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminShell from '../../components/admin/AdminShell'
import GameStatusBadge from '../../components/admin/GameStatusBadge'
import ControlQRModal from '../../components/control/ControlQRModal'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useGame } from '../../hooks/useGame'
import { useGameClock } from '../../hooks/useGameClock'
import { useGameEvents } from '../../hooks/useGameEvents'
import { fetchGameControlToken } from '../../hooks/useGameActions'
import { useToast } from '../../hooks/useToast'
import { formatClock } from '../../lib/clock'
import {
  describeGameEvent,
  formatEventTime,
  formatPeriodLabel,
  groupEventsByDay,
} from '../../lib/gameEvents'

export default function AdminGamePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToast } = useToast()
  const { game, loading, error } = useGame(id)
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
  } = useGameEvents(id)

  const [controlToken, setControlToken] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)

  const isOwner = !!user && !!game && game.user_id === user.id

  useEffect(() => {
    if (!isOwner || !id) return

    let isCancelled = false

    fetchGameControlToken(id)
      .then((token) => {
        if (!isCancelled) setControlToken(token)
      })
      .catch((err) => {
        console.error('Erro ao buscar token de controle:', err)
      })

    return () => {
      isCancelled = true
    }
  }, [isOwner, id])

  const clockSeconds = useGameClock({
    seconds: game?.clock_seconds ?? 0,
    running: game?.clock_running ?? false,
    updatedAt: game?.clock_updated_at,
  })

  const controlPath = controlToken
    ? `/scoreboard/${id}/control?token=${controlToken}`
    : `/scoreboard/${id}/control`
  const controlUrl =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}${controlPath}`

  async function handleCopyControlUrl() {
    try {
      await navigator.clipboard.writeText(controlUrl)
      addToast('Link de controle copiado.', 'success')
    } catch {
      addToast('Não foi possível copiar o link.')
    }
  }

  if (loading) {
    return (
      <AdminShell title="Carregando..." backTo="/admin" backLabel="Meus jogos">
        <p className="text-foreground-muted">Carregando jogo...</p>
      </AdminShell>
    )
  }

  if (error || !game) {
    return (
      <AdminShell
        title="Jogo não encontrado"
        backTo="/admin"
        backLabel="Meus jogos"
      >
        <p className="text-danger">
          {error ? error.message : 'Este jogo não existe.'}
        </p>
      </AdminShell>
    )
  }

  if (!isOwner) {
    return (
      <AdminShell title="Sem acesso" backTo="/admin" backLabel="Meus jogos">
        <p className="text-foreground-muted">
          Este jogo pertence a outra conta. Você pode ver o{' '}
          <Link
            to={`/scoreboard/${game.id}`}
            className="text-accent hover:text-accent-hover"
          >
            placar público
          </Link>
          , mas não administrá-lo.
        </p>
      </AdminShell>
    )
  }

  const eventGroups = groupEventsByDay(events)

  return (
    <AdminShell
      title={`${game.home_team_name} x ${game.away_team_name}`}
      subtitle={
        game.status === 'finished' && game.finished_at
          ? `Finalizado em ${new Date(game.finished_at).toLocaleString('pt-BR')}`
          : `Criado em ${new Date(game.created_at).toLocaleString('pt-BR')}`
      }
      backTo="/admin"
      backLabel="Meus jogos"
      actions={<GameStatusBadge status={game.status} />}
    >
      {/* Estado atual, atualizado em tempo real */}
      <section className="mb-6 rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-center gap-6 text-center">
          <div className="min-w-32">
            <p className="text-sm text-foreground-muted">
              {game.home_team_name}
            </p>
            <p className="text-4xl font-bold tabular-nums text-foreground">
              {game.home_score}
            </p>
            <p className="mt-1 text-xs text-foreground-subtle">
              {game.home_fouls} faltas
            </p>
          </div>

          <div className="min-w-28">
            <p className="text-sm text-foreground-muted">
              {formatPeriodLabel(game)}
            </p>
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {formatClock(clockSeconds)}
            </p>
            <p className="mt-1 text-xs text-foreground-subtle">
              {game.clock_running ? 'rodando' : 'parado'}
            </p>
          </div>

          <div className="min-w-32">
            <p className="text-sm text-foreground-muted">
              {game.away_team_name}
            </p>
            <p className="text-4xl font-bold tabular-nums text-foreground">
              {game.away_score}
            </p>
            <p className="mt-1 text-xs text-foreground-subtle">
              {game.away_fouls} faltas
            </p>
          </div>
        </div>
      </section>

      {/* Ações sobre o jogo */}
      <section className="mb-8 flex flex-wrap gap-3">
        <Link to={controlPath}>
          <Button className="gap-2">
            <SlidersHorizontal size={16} />
            Abrir controle
          </Button>
        </Link>

        <Link
          to={`/scoreboard/${game.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary" className="gap-2">
            <ExternalLink size={16} />
            Placar público
          </Button>
        </Link>

        <Button
          variant="secondary"
          onClick={handleCopyControlUrl}
          disabled={!controlToken}
          className="gap-2"
        >
          <Copy size={16} />
          Copiar link de controle
        </Button>

        <Button
          variant="ghost"
          onClick={() => setShowQRModal(true)}
          disabled={!controlToken}
          className="gap-2"
        >
          <QrCode size={16} />
          QR do controle
        </Button>
      </section>

      {/* Histórico do jogo */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Histórico
          {!eventsLoading && events.length > 0 && (
            <span className="ml-2 text-sm font-normal text-foreground-subtle">
              {events.length}{' '}
              {events.length === 1 ? 'evento' : 'eventos'}
            </span>
          )}
        </h2>

        {eventsLoading && (
          <p className="text-foreground-muted">Carregando histórico...</p>
        )}

        {eventsError && (
          <p className="text-danger">
            Erro ao carregar histórico: {eventsError.message}
          </p>
        )}

        {!eventsLoading && !eventsError && events.length === 0 && (
          <p className="text-foreground-muted">
            Nenhum evento registrado ainda. As ações do controle aparecem aqui.
          </p>
        )}

        <div className="flex flex-col gap-6">
          {eventGroups.map((group) => (
            <div key={group.day}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                {group.day}
              </h3>
              <ol className="overflow-hidden rounded-lg border border-border bg-surface">
                {group.events.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-2.5 last:border-b-0"
                  >
                    <span className="text-sm text-foreground">
                      {describeGameEvent(event, game)}
                    </span>
                    <time
                      dateTime={event.created_at}
                      className="shrink-0 text-xs tabular-nums text-foreground-subtle"
                    >
                      {formatEventTime(event.created_at)}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <ControlQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        url={controlUrl}
      />
    </AdminShell>
  )
}
