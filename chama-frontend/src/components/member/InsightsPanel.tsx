import { Card, CardHeader, CardContent } from '../ui/Card'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import type { Insight } from '../../utils/memberInsights'

type InsightsPanelProps = {
  insights: Insight[]
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Insights</h2>
          <p className="text-sm text-slate-500">Personalized insights for you</p>
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
        <h2 className="font-semibold text-slate-800">Insights</h2>
        <p className="text-sm text-slate-500">Personalized insights for you</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="mt-0.5">
                {insight.type === 'positive' && (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                )}
                {insight.type === 'negative' && (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                {insight.type === 'neutral' && <Info className="h-4 w-4 text-blue-600" />}
              </div>
              <p
                className={`text-sm ${
                  insight.type === 'positive'
                    ? 'text-emerald-700'
                    : insight.type === 'negative'
                    ? 'text-red-700'
                    : 'text-slate-700'
                }`}
              >
                {insight.message}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
