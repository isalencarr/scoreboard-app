import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import Button from '../components/ui/Button'
import ColorPicker from '../components/ui/ColorPicker'
import Input from '../components/ui/Input'
import { createGame } from '../hooks/useGameActions'

export default function CreateGamePage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    homeTeamName: 'Casa',
    awayTeamName: 'Visitante',
    homeTeamColor: '#dc2626',
    awayTeamColor: '#18181b',
    periodDuration: 10,
    overtimeDuration: 5,
    totalPeriods: 4,
  })

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)

    try {
      const { id, controlToken } = await createGame({
        homeTeamName: form.homeTeamName,
        awayTeamName: form.awayTeamName,
        homeTeamColor: form.homeTeamColor,
        awayTeamColor: form.awayTeamColor,
        periodDurationMinutes: Number(form.periodDuration),
        overtimeDurationMinutes: Number(form.overtimeDuration),
        totalPeriods: Number(form.totalPeriods),
      })

      navigate(`/scoreboard/${id}/control?token=${controlToken}`)
    } catch (err) {
      addToast(`Erro ao criar jogo: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Novo jogo</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-sm text-foreground-muted">
            Time da casa
          </label>
          <Input
            value={form.homeTeamName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, homeTeamName: e.target.value }))
            }
          />
        </div>
        <ColorPicker
          label="Cor do time da casa"
          value={form.homeTeamColor}
          previewText={form.homeTeamName || 'Casa'}
          onChange={(hex) =>
            setForm((prev) => ({ ...prev, homeTeamColor: hex }))
          }
        />
        <div>
          <label className="mb-2 block text-sm text-foreground-muted">
            Time visitante
          </label>
          <Input
            value={form.awayTeamName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, awayTeamName: e.target.value }))
            }
          />
        </div>
        <ColorPicker
          label="Cor do time visitante"
          value={form.awayTeamColor}
          previewText={form.awayTeamName || 'Visitante'}
          onChange={(hex) =>
            setForm((prev) => ({ ...prev, awayTeamColor: hex }))
          }
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm text-foreground-muted">
              Duração do quarto (min)
            </label>
            <Input
              type="number"
              min={1}
              value={form.periodDuration}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  periodDuration: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-foreground-muted">
              Duração do OT (min)
            </label>
            <Input
              type="number"
              min={1}
              value={form.overtimeDuration}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  overtimeDuration: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm text-foreground-muted">
            Quantidade de períodos
          </label>
          <Input
            type="number"
            min={1}
            max={4}
            value={form.totalPeriods}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                totalPeriods: Number(e.target.value),
              }))
            }
          />
        </div>


        <div className="mt-4 flex gap-3">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Criando...' : 'Criar jogo'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
