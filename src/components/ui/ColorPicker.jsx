import { useId } from 'react'
import { contrastRatio, normalizeHex, readableTextColor } from '../../lib/contrast'
import Input from './Input'

/** Cores comuns de uniforme, para escolher em um clique. */
const PRESETS = [
  '#dc2626', // vermelho
  '#ea580c', // laranja
  '#facc15', // amarelo
  '#16a34a', // verde
  '#0891b2', // ciano
  '#2563eb', // azul
  '#7c3aed', // roxo
  '#db2777', // rosa
  '#fafafa', // branco
  '#18181b', // preto
]

/**
 * Seletor de cor de time: paleta, seletor nativo e campo hex. Mostra uma
 * amostra com o texto na cor que o placar vai usar de verdade.
 *
 * @param {{
 *   label: string
 *   value: string
 *   onChange: (hex: string) => void
 *   previewText?: string
 *   disabled?: boolean
 * }} props
 */
export default function ColorPicker({
  label,
  value,
  onChange,
  previewText = 'Prévia',
  disabled = false,
}) {
  const inputId = useId()
  const normalized = normalizeHex(value) ?? '#000000'
  const textColor = readableTextColor(normalized)
  const ratio = contrastRatio(textColor, normalized)

  function handleHexInput(raw) {
    // Deixa o usuário digitar livremente; só propaga quando virar hex válido.
    const normalizedInput = normalizeHex(raw)
    if (normalizedInput) onChange(normalizedInput)
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm text-foreground-muted"
      >
        {label}
      </label>

      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="color"
          value={normalized}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          disabled={disabled}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-surface p-1 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${label} — seletor de cor`}
        />
        <Input
          value={normalized}
          onChange={(e) => handleHexInput(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          className="w-28 font-mono uppercase"
          aria-label={`${label} — código hex`}
        />
        <div
          className="flex h-10 flex-1 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold"
          style={{ backgroundColor: normalized, color: textColor }}
        >
          {previewText}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            disabled={disabled}
            aria-label={`Usar ${preset}`}
            aria-pressed={normalized === preset}
            className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 ${
              normalized === preset
                ? 'border-accent ring-2 ring-accent'
                : 'border-border-strong'
            }`}
            style={{ backgroundColor: preset }}
          />
        ))}
        <span className="ml-auto text-xs text-foreground-subtle">
          texto {textColor === '#ffffff' ? 'branco' : 'preto'} ·{' '}
          {ratio.toFixed(1)}:1
        </span>
      </div>
    </div>
  )
}
