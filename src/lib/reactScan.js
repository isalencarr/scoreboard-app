// React Scan — só em desenvolvimento.
// Precisa ser importado ANTES de react-dom (ver src/main.jsx).
import { scan, getReport } from 'react-scan'

const PHASE = { 1: 'mount', 2: 'update', 4: 'unmount' }

// O react-scan 0.5.x fixa `trackChanges: false` e `TRACK_UNNECESSARY_RENDERS = false`
// na instrumentação, então `render.changes` vem vazio e `render.unnecessary` vem null.
// Diferenciamos props e hooks na mão, a partir do fiber e do seu alternate.
function diffProps(fiber) {
  const next = fiber.memoizedProps
  const prev = fiber.alternate?.memoizedProps
  if (!prev || !next || prev === next) return []
  const changed = []
  for (const name of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (name === 'children') continue
    if (!Object.is(prev[name], next[name])) changed.push(`props:${name}`)
  }
  return changed
}

// tags: 0 FunctionComponent, 11 ForwardRef, 14 Memo, 15 SimpleMemo
const HOOK_TAGS = new Set([0, 11, 14, 15])

function diffHooks(fiber) {
  if (!HOOK_TAGS.has(fiber.tag)) return []
  let next = fiber.memoizedState
  let prev = fiber.alternate?.memoizedState
  if (!prev || !next) return []
  const changed = []
  for (let i = 0; next && prev && i < 100; i += 1) {
    if (!Object.is(prev.memoizedState, next.memoizedState)) changed.push(`state:hook#${i}`)
    next = next.next
    prev = prev.next
  }
  return changed
}

function triggersFor(fiber) {
  try {
    return [...diffProps(fiber), ...diffHooks(fiber)]
  } catch {
    return []
  }
}

// componentName -> estatísticas acumuladas
const stats = new Map()

function bump(name) {
  let entry = stats.get(name)
  if (!entry) {
    entry = {
      component: name,
      renders: 0,
      mounts: 0,
      updates: 0,
      // update sem nenhuma mudança de props ou hook: re-render herdado do pai,
      // candidato a memo/useMemo/useCallback.
      wasted: 0,
      totalMs: 0,
      slowestMs: 0,
      byTrigger: new Map(),
      byReason: { props: 0, state: 0 },
    }
    stats.set(name, entry)
  }
  return entry
}

function collect(fiber, renders) {
  const triggers = triggersFor(fiber)

  for (const render of renders) {
    const entry = bump(render.componentName ?? '(anônimo)')
    const count = render.count || 1
    const ms = render.time || 0
    const phase = PHASE[render.phase]

    entry.renders += count
    entry.totalMs += ms
    entry.slowestMs = Math.max(entry.slowestMs, ms)
    if (phase === 'mount') entry.mounts += count
    if (phase !== 'update') continue

    entry.updates += count
    if (!triggers.length) {
      entry.wasted += count
      continue
    }
    for (const key of triggers) {
      entry.byTrigger.set(key, (entry.byTrigger.get(key) || 0) + 1)
      entry.byReason[key.startsWith('props:') ? 'props' : 'state'] += 1
    }
  }
}

function snapshot({ sortBy = 'wasted' } = {}) {
  const rows = [...stats.values()].map((entry) => ({
    component: entry.component,
    renders: entry.renders,
    mounts: entry.mounts,
    updates: entry.updates,
    wasted: entry.wasted,
    totalMs: Number(entry.totalMs.toFixed(2)),
    avgMs: Number((entry.totalMs / Math.max(entry.renders, 1)).toFixed(2)),
    slowestMs: Number(entry.slowestMs.toFixed(2)),
    topTriggers: [...entry.byTrigger.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, n]) => `${key} (${n})`),
    byReason: { ...entry.byReason },
  }))

  rows.sort((a, b) => b[sortBy] - a[sortBy] || b.totalMs - a.totalMs)
  return rows
}

function summary(rows) {
  return {
    components: rows.length,
    renders: rows.reduce((acc, r) => acc + r.renders, 0),
    wasted: rows.reduce((acc, r) => acc + r.wasted, 0),
    totalMs: Number(rows.reduce((acc, r) => acc + r.totalMs, 0).toFixed(2)),
  }
}

const report = {
  /** Imprime a tabela no console e devolve as linhas. */
  show(options) {
    const rows = snapshot(options)
    if (!rows.length) {
      console.info('[react-scan] nada registrado ainda — interaja com a tela primeiro.')
      return rows
    }
    console.table(
      rows.map((row) => ({
        component: row.component,
        renders: row.renders,
        mounts: row.mounts,
        updates: row.updates,
        wasted: row.wasted,
        totalMs: row.totalMs,
        avgMs: row.avgMs,
        slowestMs: row.slowestMs,
        triggers: row.topTriggers.join(', '),
      })),
    )
    console.info('[react-scan] resumo', summary(rows))
    return rows
  },

  /** Objeto cru, para inspecionar no console. */
  data(options) {
    const rows = snapshot(options)
    return { generatedAt: new Date().toISOString(), summary: summary(rows), rows }
  },

  /** Baixa o relatório como JSON. */
  save(filename = `react-scan-${Date.now()}.json`) {
    const blob = new Blob([JSON.stringify(report.data(), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    console.info(`[react-scan] relatório salvo em ${filename}`)
  },

  /** Copia o JSON para a área de transferência. */
  async copy() {
    await navigator.clipboard.writeText(JSON.stringify(report.data(), null, 2))
    console.info('[react-scan] relatório copiado')
  },

  /** Zera o acumulado — útil antes de medir uma interação específica. */
  reset() {
    stats.clear()
    console.info('[react-scan] contadores zerados')
  },

  /** Relatório interno do próprio react-scan. */
  raw: getReport,
}

scan({
  enabled: true,
  showToolbar: true,
  showFPS: true,
  animationSpeed: 'fast',
  log: false,
  onRender: collect,
})

window.reactScanReport = report
console.info(
  '[react-scan] ativo. No console: reactScanReport.show() | .save() | .copy() | .reset()',
)

export default report
