import { formatClock } from './clock'
import { periodLabel } from './gameRules'

/**
 * @param {import('../types/game').TeamSide | null | undefined} team
 * @param {import('../types/game').Game} [game]
 * @returns {string}
 */
function teamLabel(team, game) {
  if (!team) return ''
  if (team === 'home') return game?.home_team_name ?? 'Casa'
  return game?.away_team_name ?? 'Visitante'
}

/**
 * @param {number | null | undefined} value
 * @returns {string}
 */
function signed(value) {
  if (value === null || value === undefined) return ''
  return value > 0 ? `+${value}` : String(value)
}

/**
 * Texto legível de um evento do log, em pt-BR.
 *
 * @param {import('../types/game').GameEvent} event
 * @param {import('../types/game').Game} [game]
 * @returns {string}
 */
export function describeGameEvent(event, game) {
  const team = teamLabel(event.team, game)
  const payload = event.payload ?? {}

  switch (event.type) {
    case 'score': {
      const from = payload.previous_score
      const to = payload.new_score
      const delta = signed(event.value)
      return from === undefined || to === undefined
        ? `${team} ${delta}`
        : `${team} ${delta} (${from} → ${to})`
    }
    case 'foul': {
      const to = payload.new_fouls
      const delta = signed(event.value)
      const noun = Math.abs(event.value ?? 1) === 1 ? 'falta' : 'faltas'
      return to === undefined
        ? `${team} ${delta} ${noun}`
        : `${team} ${delta} ${noun} (total ${to})`
    }
    case 'period_change': {
      const direction = payload.direction === 'previous' ? 'voltou' : 'avançou'
      const reset = payload.fouls_reset ? ' — faltas zeradas' : ''
      return `Período ${direction} para ${event.value ?? '?'}${reset}`
    }
    case 'overtime_start':
      return event.value
        ? `Início da prorrogação (período ${event.value})`
        : 'Início da prorrogação'
    case 'clock_start':
      return 'Cronômetro iniciado'
    case 'clock_stop':
      return 'Cronômetro pausado'
    case 'clock_reset':
      return 'Cronômetro zerado'
    case 'team_edit':
      return 'Times editados'
    case 'game_finished': {
      const home = payload.final_home_score
      const away = payload.final_away_score
      return home === undefined || away === undefined
        ? 'Jogo finalizado'
        : `Jogo finalizado — ${home} x ${away}`
    }
    default:
      return event.type
  }
}

/**
 * Agrupa os eventos pelo dia em que aconteceram, preservando a ordem.
 *
 * @param {import('../types/game').GameEvent[]} events
 * @returns {{ day: string, events: import('../types/game').GameEvent[] }[]}
 */
export function groupEventsByDay(events) {
  const groups = []

  for (const event of events) {
    const day = new Date(event.created_at).toLocaleDateString('pt-BR')
    const last = groups[groups.length - 1]

    if (last && last.day === day) {
      last.events.push(event)
    } else {
      groups.push({ day, events: [event] })
    }
  }

  return groups
}

/**
 * @param {string} isoDate
 * @returns {string} HH:MM:SS
 */
export function formatEventTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('pt-BR')
}

/**
 * Resultado final (ou parcial) de um jogo como texto.
 *
 * @param {import('../types/game').Game} game
 * @returns {string}
 */
export function formatScoreline(game) {
  const home = game.final_home_score ?? game.home_score
  const away = game.final_away_score ?? game.away_score
  return `${home} x ${away}`
}

/**
 * @param {import('../types/game').Game} game
 * @returns {string}
 */
export function formatPeriodLabel(game) {
  return periodLabel(game)
}

/**
 * @param {import('../types/game').Game} game
 * @returns {string}
 */
export function formatGameClock(game) {
  return formatClock(game.clock_seconds)
}
