import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import type { Insight } from '../../utils/adminInsights'

type InsightsPanelProps = {
  insights: Insight[]
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="text-emerald-600" size={16} />
      case 'negative':
        return <TrendingDown className="text-red-600" size={16} />
      default:
        return <Info className="text-blue-600" size={16} />
    }
  }

  const getBgColor = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-50 border-emerald-200'
      case 'negative':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-800">Insights</h3>
          <p className="text-sm text-slate-500">Data-driven insights and recommendations</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No insights available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-800">Insights</h3>
        <p className="text-sm text-slate-500">Data-driven insights and recommendations</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-lg border p-3 ${getBgColor(insight.type)}`}
            >
              <div className="mt-0.5">{getIcon(insight.type)}</div>
              <p className="flex-1 text-sm text-slate-800">{insight.message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
