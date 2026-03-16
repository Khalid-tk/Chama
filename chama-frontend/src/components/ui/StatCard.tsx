import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Accent = 'blue' | 'cyan' | 'emerald' | 'amber' | 'red' | 'violet'

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string | number | ReactNode
  trend?: number
  trendLabel?: string
  accent?: Accent
  className?: string
}

const accentMap: Record<Accent, { iconCls: string; bgCls: string; topBorder: string }> = {
  blue:    { iconCls: 'text-brown',     bgCls: 'bg-brown-light', topBorder: 'border-t-brown'    },
  cyan:    { iconCls: 'text-gold',      bgCls: 'bg-ink-100',     topBorder: 'border-t-gold'     },
  emerald: { iconCls: 'text-forest',    bgCls: 'bg-emerald-50',  topBorder: 'border-t-forest'   },
  amber:   { iconCls: 'text-amber-700', bgCls: 'bg-amber-50',    topBorder: 'border-t-amber-500'},
  red:     { iconCls: 'text-red-700',   bgCls: 'bg-red-50',      topBorder: 'border-t-red-400'  },
  violet:  { iconCls: 'text-gold',      bgCls: 'bg-ink-100',     topBorder: 'border-t-gold'     },
}

export function StatCard({ icon: Icon, label, value, trend, trendLabel, accent = 'blue', className = '' }: StatCardProps) {
  const { iconCls, bgCls, topBorder } = accentMap[accent]
  const isPositive = (trend ?? 0) >= 0
  const hasTrend = trend !== undefined && trend !== null

  return (
    <div
      className={`rounded-lg border border-ink-300 bg-warm-card px-5 py-5 border-t-2 ${topBorder} ${className}`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Icon + trend */}
      <div className="flex items-start justify-between mb-4">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${bgCls}`}>
          <Icon size={16} className={iconCls} strokeWidth={2} />
        </div>
        {hasTrend && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-forest' : 'text-red-700'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{(trend as number).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Label — editorial small-caps style */}
      <p
        className="mb-1.5 truncate text-ink-400"
        style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        {label}
      </p>

      {/* Metric value — large, bold, sans-serif for maximum clarity */}
      <div
        className="text-3xl font-bold text-ink-900 leading-none truncate"
        style={{ fontFamily: 'Inter, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>

      {hasTrend && trendLabel && (
        <p className="mt-2 text-xs text-ink-400 truncate">{trendLabel}</p>
      )}
    </div>
  )
}
