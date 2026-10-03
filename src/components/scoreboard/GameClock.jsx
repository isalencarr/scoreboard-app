import { useGameClock } from '../../hooks/useGameClock'
import { formatClock } from '../../lib/clock'
import PeriodIndicator from './PeriodIndicator'

/**
 * @param {{
 *   seconds: number
 *   running?: boolean
 *   updatedAt?: string
 *   period: number
 *   isOvertime?: boolean
 *   totalPeriods?: number
 * }} props
 */
export default function GameClock({
  seconds,
  running = false,
  updatedAt,
  period,
  isOvertime = false,
  totalPeriods = 4,
}) {
  const displaySeconds = useGameClock({ seconds, running, updatedAt })

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#09090b] px-6 md:px-12">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[clamp(2rem,5vw,4rem)] text-white md:left-12">
        <PeriodIndicator
          period={period}
          isOvertime={isOvertime}
          totalPeriods={totalPeriods}
        />
      </div>
      <div className="text-[clamp(6rem,18vw,15rem)] leading-none text-white bowlby-one">
        {formatClock(displaySeconds)}
      </div>
    </div>
  )
}
