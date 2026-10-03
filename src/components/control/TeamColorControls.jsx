import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { addGameEvent, updateGame } from '../../hooks/useGameActions'
import { normalizeHex } from '../../lib/contrast'
import ColorPicker from '../ui/ColorPicker'

/**
 * Troca a cor de um time durante o jogo. O placar público reage na hora,
 * pelo realtime.
 *
 * @param {{
 *   gameId: string
 *   team: 'home' | 'away'
 *   controlToken: string | null
 *   game: import('../../types/game').Game
 * }} props
 */
export default function TeamColorControls({
  gameId,
  team,
  controlToken,
  game,
}) {
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  const colorField = team === 'home' ? 'home_team_color' : 'away_team_color'
  const nameField = team === 'home' ? 'home_team_name' : 'away_team_name'
  const currentColor = game[colorField]
  const disabled = !controlToken || busy

  async function changeColor(hex) {
    const normalized = normalizeHex(hex)
    if (!normalized || normalized === normalizeHex(currentColor)) return
    if (!controlToken || busy) return

    setBusy(true)
    try {
      await updateGame(gameId, controlToken, { [colorField]: normalized })
      await addGameEvent(gameId, controlToken, {
        type: 'team_edit',
        team,
        payload: { field: colorField, from: currentColor, to: normalized },
      })
    } catch (err) {
      console.error('Erro ao mudar cor do time:', err)
      addToast('Erro ao mudar a cor. Verifique o token de controle.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <ColorPicker
        label="Cor da faixa"
        value={currentColor}
        previewText={game[nameField]}
        onChange={changeColor}
        disabled={disabled}
      />
    </div>
  )
}
