/**
 * Contraste de cor segundo a WCAG 2.1, usado para escolher a cor do texto
 * sobre a cor de cada time.
 *
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

export const WHITE = '#ffffff'
export const BLACK = '#000000'

/** Fundo do placar: usado para detectar cores de time que "desaparecem". */
export const SCOREBOARD_BACKGROUND = '#09090b'

/**
 * Normaliza `#abc`, `abc`, `#aabbcc` para `#aabbcc` minúsculo.
 *
 * @param {string} value
 * @returns {string | null} hex de 7 caracteres, ou null se inválido
 */
export function normalizeHex(value) {
  if (typeof value !== 'string') return null

  const hex = value.trim().replace(/^#/, '').toLowerCase()

  if (/^[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
  }
  if (/^[0-9a-f]{6}$/.test(hex)) {
    return `#${hex}`
  }
  return null
}

/**
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number } | null} canais 0-255
 */
export function hexToRgb(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) return null

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  }
}

/**
 * Luminância relativa (0 = preto, 1 = branco).
 *
 * @param {string} hex
 * @returns {number}
 */
export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0

  const channel = (value) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }

  return (
    0.2126 * channel(rgb.r) +
    0.7152 * channel(rgb.g) +
    0.0722 * channel(rgb.b)
  )
}

/**
 * Razão de contraste entre duas cores: 1 (igual) a 21 (preto x branco).
 *
 * @param {string} foreground
 * @param {string} background
 * @returns {number}
 */
export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Preto ou branco — o que tiver mais contraste sobre a cor dada.
 *
 * @param {string} background
 * @returns {string} WHITE ou BLACK
 */
export function readableTextColor(background) {
  return contrastRatio(WHITE, background) >= contrastRatio(BLACK, background)
    ? WHITE
    : BLACK
}

/**
 * Verdadeiro quando a cor do time é tão próxima do fundo do placar que a
 * faixa do time se perde — nesse caso o layout desenha um contorno.
 *
 * O limite de 1.5 fica abaixo de qualquer mínimo da WCAG e pega só os casos
 * em que as duas cores são praticamente a mesma.
 *
 * @param {string} color
 * @param {string} [background]
 * @returns {boolean}
 */
export function needsOutline(color, background = SCOREBOARD_BACKGROUND) {
  return contrastRatio(color, background) < 1.5
}

/**
 * Tudo que o placar precisa para pintar a faixa de um time.
 *
 * @param {string | null | undefined} color
 * @param {string} fallback cor usada se `color` for inválida
 * @returns {{
 *   background: string
 *   text: string
 *   ratio: number
 *   outline: boolean
 * }}
 */
export function teamColorScheme(color, fallback) {
  const background = normalizeHex(color) ?? normalizeHex(fallback) ?? BLACK
  const text = readableTextColor(background)

  return {
    background,
    text,
    ratio: contrastRatio(text, background),
    outline: needsOutline(background),
  }
}
