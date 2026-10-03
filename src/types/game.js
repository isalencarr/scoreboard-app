/**
 * @typedef {('upcoming'|'live'|'finished')} GameStatus
 */

/**
 * @typedef {('home'|'away')} TeamSide
 */

/**
 * @typedef {('score'|'foul'|'period_change'|'clock_start'|'clock_stop'|'clock_reset'|'overtime_start'|'team_edit'|'game_finished')} GameEventType
 */

/**
 * @typedef {Object} Game
 * @property {string} id
 * @property {GameStatus} status
 * @property {string} home_team_name
 * @property {string} away_team_name
 * @property {string} home_team_color
 * @property {string} away_team_color
 * @property {number} home_score
 * @property {number} away_score
 * @property {number} home_fouls
 * @property {number} away_fouls
 * @property {number} period
 * @property {boolean} is_overtime
 * @property {boolean} clock_running
 * @property {number} clock_seconds
 * @property {string} clock_updated_at
 * @property {number} period_duration_seconds
 * @property {number} overtime_duration_seconds
 * @property {number} total_periods
 * @property {string | null} user_id
 * @property {number} [final_home_score]
 * @property {number} [final_away_score]
 * @property {string} [finished_at]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} GameControlToken
 * @property {string} game_id
 * @property {string} token
 * @property {string} created_at
 */

/**
 * @typedef {Object} GameEvent
 * @property {string} id
 * @property {string} game_id
 * @property {GameEventType} type
 * @property {TeamSide} [team]
 * @property {number} [value]
 * @property {Record<string, any>} payload
 * @property {string} created_at
 */

export {}
