import { teamColorScheme } from '../../lib/contrast'

const FALLBACK = { home: '#dc2626', away: '#18181b' }

/**
 * @param {{
 *   name: string
 *   score: number
 *   fouls: number
 *   variant: 'home' | 'away'
 *   color?: string | null
 * }} props
 */
export default function TeamScore({ name, score, fouls, variant, color }) {
  const scheme = teamColorScheme(color, FALLBACK[variant])

  return (
    <div
      className="flex h-full w-full items-center justify-between px-6 md:px-12"
      style={{
        backgroundColor: scheme.background,
        color: scheme.text,
        // Cor de time quase igual ao fundo do placar: um contorno sutil
        // mantém a faixa visível.
        boxShadow: scheme.outline
          ? `inset 0 0 0 2px ${scheme.text}33`
          : undefined,
      }}
    >
      <div className="flex flex-col justify-center">
        <span className="text-[clamp(3rem,8vw,7rem)] leading-none bowlby-one uppercase">
          {name}
        </span>
        <span
          className="mt-2 text-[clamp(2.5rem,6vw,4rem)] leading-none bowlby-one"
          style={{ opacity: 0.85 }}
        >
          Faltas: {fouls}
        </span>
      </div>
      <div className="text-[clamp(6rem,18vw,14rem)] leading-none bowlby-one">
        {score}
      </div>
    </div>
  )
}
