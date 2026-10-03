import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { addGameEvent, updateGame } from '../../hooks/useGameActions'
import Button from '../ui/Button'

/**
 * @param {{
 *   gameId: string
 *   team: 'home' | 'away'
 *   controlToken: string | null
 *   currentFouls: number
 * }} props
 */
export default function FoulControls({
  gameId,
  team,
  controlToken,
  currentFouls,
}) {
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()
  const foulsField = team === 'home' ? 'home_fouls' : 'away_fouls'
  const label = team === 'home' ? 'Faltas Casa' : 'Faltas Visitante'
  const disabled = !controlToken || busy

  async function changeFouls(delta) {
    if (!controlToken || busy) return
    setBusy(true)
    try {
      const newFouls = Math.max(0, currentFouls + delta)
      await updateGame(gameId, controlToken, { [foulsField]: newFouls })
      await addGameEvent(gameId, controlToken, {
        type: 'foul',
        team,
        value: delta,
        payload: { previous_fouls: currentFouls, new_fouls: newFouls },
      })
    } catch (err) {
      console.error('Erro ao atualizar faltas:', err)
      addToast('Erro ao atualizar faltas. Verifique o token de controle.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <span className="text-sm text-foreground-muted">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => changeFouls(-1)}
          disabled={disabled}
          className="min-h-12 min-w-12"
          aria-label="Remover falta"
        >
          <Minus size={20} />
        </Button>
        <span className="min-w-[1.5ch] text-center text-xl font-bold">
          {currentFouls}
        </span>
        <Button
          variant="ghost"
          onClick={() => changeFouls(1)}
          disabled={disabled}
          className="min-h-12 min-w-12"
          aria-label="Adicionar falta"
        >
          <Plus size={20} />
        </Button>
      </div>
    </div>
  )
}
