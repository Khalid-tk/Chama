import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import type { Insight } from '../../utils/adminInsights'

type InsightsPanelProps = {
  insights: Insight[]
  className?: string
}

const insightStyle = {
  positive: { icon: TrendingUp,   cls: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', iconCls: 'text-emerald-600' },
  negative: { icon: TrendingDown, cls: 'bg-red-50 border-red-200',         text: 'text-red-700',     iconCls: 'text-red-600' },
  neutral:  { icon: Info,         cls: 'bg-brown-light border-ink-300',        text: 'text-brown-dark',    iconCls: 'text-brown' },
}

export function InsightsPanel({ insights, className = '' }: InsightsPanelProps) {
  return (
    <div className={`flex flex-col rounded-lg border border-ink-300 bg-warm-card overflow-hidden ${className}`} style={{ boxShadow: 'var(--shadow-xs)' }}>
      <div className="px-4 py-3.5 border-b border-ink-200">
        <h3 className="text-sm font-semibold text-ink-900">Insights</h3>
        <p className="text-xs text-ink-400 mt-0.5">Automated observations from your data</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {insights.length === 0 ? (
          <p className="py-8 text-center text-xs text-ink-400">No insights available yet.</p>
        ) : (
          insights.map((insight, i) => {
            const s = insightStyle[insight.type] ?? insightStyle.neutral
            const Icon = s.icon
            return (
              <div key={i} className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 ${s.cls}`}>
                <Icon size={13} className={`mt-0.5 shrink-0 ${s.iconCls}`} />
                <p className={`text-xs leading-relaxed ${s.text}`}>{insight.message}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
