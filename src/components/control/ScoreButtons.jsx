import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { addGameEvent, updateGame } from '../../hooks/useGameActions'
import Button from '../ui/Button'

/**
 * @param {{
 *   gameId: string
 *   team: 'home' | 'away'
 *   controlToken: string | null
 *   currentScore: number
 * }} props
 */
export default function ScoreButtons({
  gameId,
  team,
  controlToken,
  currentScore,
}) {
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()
  const scoreField = team === 'home' ? 'home_score' : 'away_score'
  const label = team === 'home' ? 'Casa' : 'Visitante'
  const disabled = !controlToken || busy

  async function changeScore(points) {
    if (!controlToken || busy) return
    setBusy(true)
    try {
      const newScore = Math.max(0, currentScore + points)
      await updateGame(gameId, controlToken, { [scoreField]: newScore })
      await addGameEvent(gameId, controlToken, {
        type: 'score',
        team,
        value: points,
        payload: { previous_score: currentScore, new_score: newScore },
      })
    } catch (err) {
      console.error('Erro ao atualizar placar:', err)
      addToast('Erro ao atualizar placar. Verifique o token de controle.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <span className="text-center text-sm text-foreground-muted">{label}</span>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((points) => (
          <Button
            key={points}
            onClick={() => changeScore(points)}
            disabled={disabled}
            className="min-h-14 text-lg"
          >
            +{points}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((points) => (
          <Button
            key={points}
            variant="secondary"
            onClick={() => changeScore(-points)}
            disabled={disabled}
            className="min-h-14 text-lg"
          >
            -{points}
          </Button>
        ))}
      </div>
    </div>
  )
}
