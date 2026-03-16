import type { ReactNode } from 'react'

type ChartCardProps = {
  title: string
  subtitle?: string
  description?: string   /* alias for subtitle */
  height?: number | string
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * ChartCard — editorial chart container.
 *
 * The header uses a slightly deeper parchment (`warm-deep`) to frame the
 * chart as a ledger section, separated by a warm border rule.
 */
const HEIGHT_MAP: Record<string, number> = {
  sm:  180,
  md:  220,
  lg:  280,
  xl:  340,
}

function resolveHeight(h: number | string): number {
  if (typeof h === 'number') return h
  return HEIGHT_MAP[h] ?? 220
}

export function ChartCard({
  title,
  subtitle,
  description,
  height = 220,
  loading = false,
  empty = false,
  emptyMessage = 'No data available yet.',
  actions,
  children,
  className = '',
}: ChartCardProps) {
  const sub = subtitle ?? description
  const resolvedHeight = resolveHeight(height)

  return (
    <div
      className={`rounded-lg border border-ink-300 bg-warm-card overflow-hidden min-w-0 ${className}`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Framed header */}
      <div className="border-b border-ink-300 bg-warm-deep px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              className="text-sm font-semibold text-ink-900 leading-snug"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {title}
            </h3>
            {sub && (
              <p className="mt-0.5 text-xs text-ink-500">{sub}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      </div>

      {/* Chart body */}
      <div className="relative px-3 py-3" style={{ height: resolvedHeight }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-warm-card/70 z-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-300 border-t-brown" />
          </div>
        )}
        {!loading && empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <svg className="h-8 w-8 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-sm text-ink-400">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
