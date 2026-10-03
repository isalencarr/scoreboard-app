const styles = {
  upcoming: {
    label: 'Agendado',
    className: 'border-border-strong bg-surface-hover text-foreground-muted',
  },
  live: {
    label: 'Ao vivo',
    className: 'border-accent/40 bg-accent/15 text-accent',
  },
  finished: {
    label: 'Finalizado',
    className: 'border-border bg-surface-muted text-foreground-subtle',
  },
}

/**
 * @param {{ status: import('../../types/game').GameStatus }} props
 */
export default function GameStatusBadge({ status }) {
  const style = styles[status] ?? styles.upcoming

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  )
}
