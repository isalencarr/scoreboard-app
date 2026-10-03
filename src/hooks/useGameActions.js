import { supabase } from '../lib/supabase'

/**
 * @typedef {Object} CreateGameInput
 * @property {string} homeTeamName
 * @property {string} awayTeamName
 * @property {string} [homeTeamColor] hex #rrggbb
 * @property {string} [awayTeamColor] hex #rrggbb
 * @property {number} periodDurationMinutes
 * @property {number} overtimeDurationMinutes
 * @property {number} totalPeriods
 */

/**
 * Cria um jogo pertencente ao usuário logado.
 *
 * @param {CreateGameInput} input
 * @returns {Promise<{ id: string, controlToken: string }>}
 */
export async function createGame(input) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('É necessário entrar para criar um jogo.')
  }

  const { data, error } = await supabase
    .from('games')
    .insert({
      user_id: session.user.id,
      home_team_name: input.homeTeamName,
      away_team_name: input.awayTeamName,
      home_team_color: input.homeTeamColor,
      away_team_color: input.awayTeamColor,
      period_duration_seconds: input.periodDurationMinutes * 60,
      overtime_duration_seconds: input.overtimeDurationMinutes * 60,
      total_periods: input.totalPeriods,
      clock_seconds: input.periodDurationMinutes * 60,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  // O token é criado por trigger em game_control_tokens e só o dono lê.
  const controlToken = await fetchGameControlToken(data.id)

  return { id: data.id, controlToken }
}

/**
 * Lê o control_token de um jogo. Só funciona para o dono (RLS).
 *
 * @param {string} gameId
 * @returns {Promise<string>}
 */
export async function fetchGameControlToken(gameId) {
  const { data, error } = await supabase
    .from('game_control_tokens')
    .select('token')
    .eq('game_id', gameId)
    .single()

  if (error) {
    throw error
  }

  return data.token
}

/**
 * Aplica uma atualização de placar. A permissão é checada no banco: vale o
 * control_token da URL ou a posse do jogo, quando o dono está logado.
 *
 * @param {string} gameId
 * @param {string | null} controlToken
 * @param {Partial<import('../types/game').Game>} updates
 */
export async function updateGame(gameId, controlToken, updates) {
  const { error } = await supabase.rpc('update_game_with_token', {
    p_game_id: gameId,
    p_control_token: controlToken ?? null,
    p_updates: updates,
  })

  if (error) {
    throw error
  }
}

/**
 * @param {string} gameId
 * @param {string | null} controlToken
 * @param {Partial<import('../types/game').GameEvent>} event
 */
export async function addGameEvent(gameId, controlToken, event) {
  const { error } = await supabase.rpc('add_game_event_with_token', {
    p_game_id: gameId,
    p_control_token: controlToken ?? null,
    p_type: event.type,
    p_team: event.team ?? null,
    p_value: event.value ?? null,
    p_payload: event.payload ?? {},
  })

  if (error) {
    throw error
  }
}

/**
 * Finaliza o jogo, congela o placar final e registra o evento.
 *
 * @param {string} gameId
 * @param {string | null} controlToken
 */
export async function finishGame(gameId, controlToken) {
  const { error } = await supabase.rpc('finish_game_with_token', {
    p_game_id: gameId,
    p_control_token: controlToken ?? null,
  })

  if (error) {
    throw error
  }
}

/**
 * Jogos do usuário logado, mais recentes primeiro.
 *
 * @param {{ status?: import('../types/game').GameStatus }} [options]
 * @returns {Promise<import('../types/game').Game[]>}
 */
export async function fetchMyGames(options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return []
  }

  let query = supabase
    .from('games')
    .select('*')
    .eq('user_id', session.user.id)

  if (options.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query.order('created_at', {
    ascending: false,
  })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * Jogos finalizados do usuário logado, do mais recente para o mais antigo.
 *
 * @returns {Promise<import('../types/game').Game[]>}
 */
export async function fetchMyFinishedGames() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return []
  }

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', 'finished')
    .order('finished_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}
