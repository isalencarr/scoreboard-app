/**
 * Regras de período e de bônus (situação de penalização), seguindo a FIBA.
 *
 * - A partir da 5ª falta coletiva em um quarto, toda falta seguinte do time
 *   dá dois lances livres ao adversário: o time está "em bônus".
 * - Cada prorrogação é extensão do 4º quarto, então as faltas coletivas
 *   acumulam do 4º quarto em diante e não zeram no OT nem entre OTs.
 */

export const DEFAULT_BONUS_FOUL_LIMIT = 5

/**
 * Número da prorrogação em andamento (1 para o primeiro OT), ou 0 fora dela.
 *
 * @param {import('../types/game').Game} game
 * @returns {number}
 */
export function overtimeNumber(game) {
  if (!game?.is_overtime) return 0
  return Math.max(1, game.period - game.total_periods)
}

/**
 * Rótulo do período: `Q1`..`Q4` na regulamentação, `OT1`, `OT2`... depois.
 *
 * @param {import('../types/game').Game} game
 * @returns {string}
 */
export function periodLabel(game) {
  if (!game) return ''
  return game.is_overtime ? `OT${overtimeNumber(game)}` : `Q${game.period}`
}

/**
 * Mesmo rótulo, a partir de valores soltos (para componentes que recebem
 * só os campos de que precisam).
 *
 * @param {{ period: number, isOvertime?: boolean, totalPeriods?: number }} params
 * @returns {string}
 */
export function formatPeriod({ period, isOvertime = false, totalPeriods = 4 }) {
  if (!isOvertime) return `Q${period}`
  return `OT${Math.max(1, period - totalPeriods)}`
}

/**
 * Faltas a partir das quais o time entra em bônus.
 *
 * @param {import('../types/game').Game} game
 * @returns {number}
 */
export function bonusFoulLimit(game) {
  const limit = Number(game?.bonus_foul_limit)
  return Number.isFinite(limit) && limit >= 1 ? limit : DEFAULT_BONUS_FOUL_LIMIT
}

/**
 * O time já atingiu o limite de faltas coletivas do período?
 *
 * @param {import('../types/game').Game} game
 * @param {'home' | 'away'} team
 * @returns {boolean}
 */
export function isTeamInBonus(game, team) {
  if (!game) return false
  const fouls = team === 'home' ? game.home_fouls : game.away_fouls
  return fouls >= bonusFoulLimit(game)
}

/**
 * As faltas coletivas devem zerar nesta troca de período?
 *
 * Só ao avançar para um quarto da regulamentação. Entrar na prorrogação (ou
 * passar de um OT para outro) mantém a contagem, porque o OT estende o 4º
 * quarto. Voltar período também não zera: a contagem anterior não é
 * recuperável, então quem opera corrige à mão.
 *
 * @param {{ fromPeriod: number, toPeriod: number, totalPeriods: number }} params
 * @returns {boolean}
 */
export function shouldResetFouls({ fromPeriod, toPeriod, totalPeriods }) {
  return toPeriod > fromPeriod && toPeriod <= totalPeriods
}
