import { Pause, Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { addGameEvent, updateGame } from '../../hooks/useGameActions'
import { remainingSeconds } from '../../lib/clock'
import Button from '../ui/Button'

/**
 * @param {{
 *   gameId: string
 *   controlToken: string | null
 *   game: import('../../types/game').Game
 * }} props
 */
export default function ClockControls({ gameId, controlToken, game }) {
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()
  const disabled = !controlToken || busy

  async function startClock() {
    if (!controlToken || busy || game.clock_running) return
    setBusy(true)
    try {
      await updateGame(gameId, controlToken, {
        clock_running: true,
        clock_updated_at: new Date().toISOString(),
      })
      await addGameEvent(gameId, controlToken, { type: 'clock_start' })
    } catch (err) {
            console.error('Erro ao iniciar cronômetro:', err)
      addToast('Erro ao iniciar cronômetro. Verifique o token de controle.')
    } finally {
      setBusy(false)
    }
  }

  async function stopClock() {
    if (!controlToken || busy || !game.clock_running) return
    setBusy(true)
    try {
      const remaining = remainingSeconds({
        clockSeconds: game.clock_seconds,
        clockRunning: game.clock_running,
        clockUpdatedAt: game.clock_updated_at,
      })
      await updateGame(gameId, controlToken, {
        clock_running: false,
        clock_seconds: Math.round(remaining),
      })
      await addGameEvent(gameId, controlToken, { type: 'clock_stop' })
    } catch (err) {
      console.error('Erro ao pausar cronômetro:', err)
      addToast('Erro ao pausar cronômetro. Verifique o token de controle.')
    } finally {
      setBusy(false)
    }
  }

  async function resetClock() {
    if (!controlToken || busy) return
    setBusy(true)
    try {
      const baseSeconds = game.is_overtime
        ? game.overtime_duration_seconds
        : game.period_duration_seconds
      await updateGame(gameId, controlToken, {
        clock_running: false,
        clock_seconds: baseSeconds,
      })
      await addGameEvent(gameId, controlToken, { type: 'clock_reset' })
    } catch (err) {
      console.error('Erro ao zerar cronômetro:', err)
      addToast('Erro ao zerar cronômetro. Verifique o token de controle.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={startClock}
        disabled={disabled || game.clock_running}
        className="gap-2"
      >
        <Play size={18} />
        Iniciar
      </Button>
      <Button
        variant="secondary"
        onClick={stopClock}
        disabled={disabled || !game.clock_running}
        className="gap-2"
      >
        <Pause size={18} />
        Pausar
      </Button>
      <Button
        variant="ghost"
        onClick={resetClock}
        disabled={disabled}
        aria-label="Zerar cronômetro"
      >
        <RotateCcw size={18} />
      </Button>
    </div>
  )
}
