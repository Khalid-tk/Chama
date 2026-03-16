/**
 * BrandLogo — Chama wordmark + geometric mark.
 *
 * Mark: three interlocking hexagons arranged in a triangle cluster.
 * Symbolises a connected savings group (three units = community).
 *
 * Variants:
 *   'dark'  — warm coffee/brown tones for use on light parchment backgrounds
 *   'light' — warm cream/gold tones for use on the dark warm-sidebar
 */

type BrandLogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  variant?: 'dark' | 'light'
  className?: string
}

const sizeMap = {
  xs: { px: 20, text: 'text-sm',  gap: 'gap-2'   },
  sm: { px: 26, text: 'text-base', gap: 'gap-2'  },
  md: { px: 34, text: 'text-lg',  gap: 'gap-2.5' },
  lg: { px: 48, text: 'text-2xl', gap: 'gap-3'   },
}

type MarkProps = {
  size: number
  variant: 'dark' | 'light'
}

function Mark({ size, variant }: MarkProps) {
  const isDark = variant === 'dark'
  /*
   * Dark variant (on parchment backgrounds) → warm coffee-brown tones
   * Light variant (on dark sidebar)         → warm cream/gold tones
   */
  const top   = isDark ? '#B08A57' : 'rgba(248,241,228,0.90)'  /* gold / warm-card   */
  const right = isDark ? '#8A5A3B' : 'rgba(248,241,228,0.75)'  /* brown              */
  const left  = isDark ? '#5B3A29' : 'rgba(248,241,228,0.55)'  /* brown-dark / muted */

  return (
    <svg
      width={size}
      height={Math.round(size * 36 / 40)}
      viewBox="0 0 40 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Bottom-left hexagon — deepest shade */}
      <polygon points="20,24 16,30.93 8,30.93 4,24 8,17.07 16,17.07" fill={left} />
      {/* Bottom-right hexagon — mid tone */}
      <polygon points="36,24 32,30.93 24,30.93 20,24 24,17.07 32,17.07" fill={right} />
      {/* Top hexagon — lightest / most prominent */}
      <polygon points="28,10 24,16.93 16,16.93 12,10 16,3.07 24,3.07" fill={top} />
    </svg>
  )
}

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  variant = 'dark',
  className = '',
}: BrandLogoProps) {
  const { px, text, gap } = sizeMap[size]
  const wordColor = variant === 'light' ? 'text-warm-card' : 'text-ink-900'

  return (
    <div className={`inline-flex items-center ${gap} ${className}`}>
      <Mark size={px} variant={variant} />
      {showWordmark && (
        <span
          className={`font-bold tracking-tight leading-none select-none ${text} ${wordColor}`}
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          Chama
        </span>
      )}
    </div>
  )
}
