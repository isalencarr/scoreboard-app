import GameClock from './GameClock'
import TeamScore from './TeamScore'

/**
 * @param {{ game: import('../../types/game').Game }} props
 */
export default function ScoreboardLayout({ game }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <div className="flex-[38]">
        <TeamScore
          name={game.home_team_name}
          score={game.home_score}
          fouls={game.home_fouls}
          variant="home"
          color={game.home_team_color}
        />
      </div>
      <div className="flex-[38]">
        <TeamScore
          name={game.away_team_name}
          score={game.away_score}
          fouls={game.away_fouls}
          variant="away"
          color={game.away_team_color}
        />
      </div>
      <div className="flex-[24]">
        <GameClock
          seconds={game.clock_seconds}
          running={game.clock_running}
          updatedAt={game.clock_updated_at}
          period={game.period}
          isOvertime={game.is_overtime}
        />
      </div>
    </div>
  )
}
