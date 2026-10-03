import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { addGameEvent, updateGame } from '../../hooks/useGameActions'
import { shouldResetFouls } from '../../lib/gameRules'
import Button from '../ui/Button'

/**
 * @param {{
 *   gameId: string
 *   controlToken: string | null
 *   game: import('../../types/game').Game
 * }} props
 */
export default function PeriodControls({ gameId, controlToken, game }) {
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()
  const disabled = !controlToken || busy
  const maxPeriods = game.total_periods

  async function previousPeriod() {
    if (!controlToken || busy || game.period <= 1) return
    setBusy(true)
    try {
      const newPeriod = game.period - 1
      const isNowOvertime = newPeriod > maxPeriods
      await updateGame(gameId, controlToken, {
        period: newPeriod,
        is_overtime: isNowOvertime,
      })
      await addGameEvent(gameId, controlToken, {
        type: 'period_change',
        value: newPeriod,
        payload: { direction: 'previous' },
      })
    } catch (err) {
      console.error('Erro ao mudar período:', err)
      addToast('Erro ao mudar período. Verifique o token de controle.')
    } finally {
      setBusy(false)
    }
  }

  async function nextPeriod() {
    if (!controlToken || busy) return
    setBusy(true)
    try {
      const newPeriod = game.period + 1
      const isNowOvertime = newPeriod > maxPeriods
      // FIBA: faltas coletivas zeram a cada quarto, mas a prorrogação
      // estende o 4º quarto, então entrar no OT mantém a contagem.
      const resetFouls = shouldResetFouls({
        fromPeriod: game.period,
        toPeriod: newPeriod,
        totalPeriods: maxPeriods,
      })

      await updateGame(gameId, controlToken, {
        period: newPeriod,
        is_overtime: isNowOvertime,
        ...(resetFouls ? { home_fouls: 0, away_fouls: 0 } : {}),
      })
      await addGameEvent(gameId, controlToken, {
        type: 'period_change',
        value: newPeriod,
        payload: { direction: 'next', fouls_reset: resetFouls },
      })
    } catch (err) {
      console.error('Erro ao mudar período:', err)
      addToast('Erro ao mudar período. Verifique o token de controle.')
    } finally {
      setBusy(false)
    }
  }

  async function startOvertime() {
    if (!controlToken || busy || game.is_overtime || game.period <= maxPeriods)
      return
    setBusy(true)
    try {
      const overtimePeriod = maxPeriods + 1
      await updateGame(gameId, controlToken, {
        period: overtimePeriod,
        is_overtime: true,
        clock_seconds: game.overtime_duration_seconds,
        clock_running: false,
      })
      await addGameEvent(gameId, controlToken, {
        type: 'overtime_start',
        value: overtimePeriod,
      })
    } catch (err) {
      console.error('Erro ao iniciar overtime:', err)
      addToast('Erro ao iniciar overtime. Verifique o token de controle.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        onClick={previousPeriod}
        disabled={disabled || game.period <= 1}
        aria-label="Período anterior"
      >
        <ChevronLeft size={18} />
      </Button>
      <Button
        variant="secondary"
        onClick={startOvertime}
        disabled={disabled || game.is_overtime || game.period <= maxPeriods}
      >
        OT
      </Button>
      <Button
        variant="secondary"
        onClick={nextPeriod}
        disabled={disabled}
        aria-label="Próximo período"
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  )
}
