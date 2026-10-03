import { formatPeriod } from '../../lib/gameRules'

/**
 * `Q1`..`Q4` na regulamentação; `OT1`, `OT2`... nas prorrogações.
 *
 * @param {{ period: number, isOvertime?: boolean, totalPeriods?: number }} props
 */
export default function PeriodIndicator({
  period,
  isOvertime = false,
  totalPeriods = 4,
}) {
  return (
    <span className="bowlby-one">
      {formatPeriod({ period, isOvertime, totalPeriods })}
    </span>
  )
}
