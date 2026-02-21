import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { useChamaId } from '../../hooks/useChamaId'
import { ChartCard } from '../charts/ChartCard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Badge } from '../ui/Badge'
import { computeGrowthLabel } from '../../utils/analytics'
import api, { chamaRoute } from '../../lib/api'

type ChamaHealthWidgetProps = {
  showFullChart?: boolean
}

export function ChamaHealthWidget({ showFullChart = false }: ChamaHealthWidgetProps) {
  const chamaId = useChamaId()
  const [memberCount, setMemberCount] = useState<number>(0)

  useEffect(() => {
    api
      .get(chamaRoute(chamaId, '/context'))
      .then((res) => {
        const summary = res.data?.data?.summary
        setMemberCount(Number(summary?.memberCount) || 0)
      })
      .catch(() => setMemberCount(0))
  }, [chamaId])

  // Single point for cumulative (members only see total from context)
  const cumulativeTrend = useMemo(() => {
    if (memberCount <= 0) return []
    return [{ month: 'Current', cumulative: memberCount }]
  }, [memberCount])

  const growthLabel = useMemo(() => {
    if (memberCount <= 0) return 'Stable'
    return computeGrowthLabel([{ month: 'Current', value: memberCount }])
  }, [memberCount])

  const growthColor =
    growthLabel === 'Growing'
      ? 'bg-emerald-100 text-emerald-700'
      : growthLabel === 'Stable'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-amber-100 text-amber-700'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Chama Health</h2>
            <p className="text-sm text-slate-500">Membership growth and health indicators</p>
          </div>
          <Badge className={growthColor}>{growthLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {showFullChart ? (
          <ChartCard title="Membership Growth Trend" description="Cumulative membership over time">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cumulativeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 4 }}
                  name="Total Members"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Members</span>
              <span className="text-lg font-semibold text-slate-800">{memberCount}</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} hide />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500">
              Membership is <span className="font-medium">{growthLabel.toLowerCase()}</span> based
              on recent trends
            </p>
            <Link
              to={`/member/${chamaId}/chama-health`}
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View full report →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
