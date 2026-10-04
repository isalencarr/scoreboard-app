import { useGameClock } from '../../hooks/useGameClock'
import { formatClock } from '../../lib/clock'
import PeriodIndicator from './PeriodIndicator'

/**
 * O estado do cronômetro vive aqui, no componente mais interno possível: a
 * cada segundo só os dígitos re-renderizam, sem arrastar o GameClock e o
 * PeriodIndicator junto.
 *
 * @param {{ seconds: number, running: boolean, updatedAt?: string }} props
 */
function ClockDigits({ seconds, running, updatedAt }) {
  const displaySeconds = useGameClock({ seconds, running, updatedAt })

  return (
    <div className="text-[clamp(6rem,18vw,15rem)] leading-none text-white bowlby-one">
      {formatClock(displaySeconds)}
    </div>
  )
}

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
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#09090b] px-6 md:px-12">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[clamp(2rem,5vw,4rem)] text-white md:left-12">
        <PeriodIndicator
          period={period}
          isOvertime={isOvertime}
          totalPeriods={totalPeriods}
        />
      </div>
      <ClockDigits seconds={seconds} running={running} updatedAt={updatedAt} />
    </div>
  )
}
