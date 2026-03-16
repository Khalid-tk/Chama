import { useMemo, useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useChamaId } from '../../hooks/useChamaId'
import { chamaRoute } from '../../lib/api'
import api from '../../lib/api'
import { ChartCard } from '../../components/charts/ChartCard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { computeHealthScore, computeGrowthLabel } from '../../utils/analytics'

export function ChamaHealth() {
  const chamaId = useChamaId()
  const [loading, setLoading] = useState(true)
  const [contributions, setContributions] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [memberships, setMemberships] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [chamaId])

  const loadData = async () => {
    try {
      setLoading(true)
      // Members can only see their own data, so use member endpoints
      // For chama health, we'll use member's own contributions/loans and context endpoint
      const [contributionsRes, loansRes] = await Promise.all([
        api.get(chamaRoute(chamaId, '/my/contributions')).catch(() => ({ data: { data: { data: [] } } })),
        api.get(chamaRoute(chamaId, '/my/loans')).catch(() => ({ data: { data: { data: [] } } })),
        ])
      setContributions(contributionsRes.data.data.data || [])
      setLoans(loansRes.data.data.data || [])
      // For members, we can't get full membership list, so use empty array
      // The health score will be calculated from available data
      setMemberships([])
    } catch (error) {
      console.error('Failed to load chama health data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Map API data to expected format
  const mockContributions = useMemo(() => {
    return contributions.map((c: any) => ({
      id: c.id,
      amount: c.amount,
      date: c.paidAt || c.createdAt,
      member: c.user?.fullName || 'Member',
    }))
  }, [contributions])

  const mockLoans = useMemo(() => {
    return loans.map((l: any) => ({
      id: l.id,
      amount: l.totalDue,
      date: l.requestedAt,
      status: l.status,
    }))
  }, [loans])

  const mockMembers = useMemo(() => {
    return memberships.map((m: any) => ({
      id: m.id,
      name: m.user?.fullName || 'Member',
      joined: m.joinedAt,
    }))
  }, [memberships])

  const memberRecentActivity = useMemo(() => {
    const txns: any[] = []
    contributions.forEach((c: any) => {
      txns.push({ id: `c-${c.id}`, type: 'credit', amount: c.amount, desc: 'Contribution', date: c.paidAt || c.createdAt })
    })
    return txns
  }, [contributions])
  // Build membership trend from members list (empty for members - no list access)
  const membershipTrend = useMemo(() => {
    const grouped: Record<string, number> = {}
    mockMembers.forEach((m: any) => {
      const month = new Date(m.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      grouped[month] = (grouped[month] || 0) + 1
    })
    const sortedMonths = Object.keys(grouped).sort()
    let cumulative = 0
    return sortedMonths.map((month) => {
      cumulative += grouped[month]
      return {
        month,
        newMembers: grouped[month],
        totalMembers: cumulative,
      }
    })
  }, [mockMembers])

  // Calculate health score
  const healthScore = useMemo(() => {
    return computeHealthScore({
      contributions: mockContributions,
      loans: mockLoans,
      members: mockMembers,
      transactions: memberRecentActivity,
    })
  }, [])

  // Calculate growth label
  const growthLabel = useMemo(() => {
    return computeGrowthLabel(membershipTrend.map(m => ({ month: m.month, value: m.totalMembers })))
  }, [membershipTrend])

  const healthStatus = useMemo(() => {
    const status = healthScore.label === 'Healthy' ? 'Growing' : healthScore.label === 'Risk' ? 'Declining' : 'Stable'
    const color = healthScore.label === 'Healthy' ? 'success' : healthScore.label === 'Risk' ? 'danger' : 'neutral'
    const icon = healthScore.label === 'Healthy' ? TrendingUp : healthScore.label === 'Risk' ? TrendingDown : Minus
    return { status, color, icon }
  }, [healthScore])

  const StatusIcon = healthStatus.icon

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Chama Health</h1>
          <p className="text-sm text-ink-500">Monitor chama growth and membership trends</p>
        </div>
        <div className="text-center py-12 text-ink-500">Loading chama health data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Chama Health</h1>
        <p className="text-sm text-ink-500">Monitor chama growth and membership trends</p>
      </div>

      {/* Health Score Card */}
      <Card className="border-2 border-ink-300 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-ink-700 mb-1">Chama Health Score</div>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-4xl font-bold text-ink-900">{healthScore.score}</div>
                <div className="text-lg text-ink-500">/ 100</div>
              </div>
              <Badge
                variant={healthScore.label === 'Healthy' ? 'success' : healthScore.label === 'Risk' ? 'danger' : 'warning'}
                className="mb-3"
              >
                {healthScore.label}
              </Badge>
              <div className="mt-4 space-y-1">
                <div className="text-xs font-medium text-ink-700">Why this score?</div>
                <ul className="text-xs text-ink-700 space-y-1">
                  {healthScore.contributors.slice(0, 3).map((contributor, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-brown mt-0.5">•</span>
                      <span>{contributor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="ml-4">
              {healthScore.label === 'Healthy' ? (
                <CheckCircle className="text-emerald-600" size={48} />
              ) : healthScore.label === 'Risk' ? (
                <AlertTriangle className="text-red-600" size={48} />
              ) : (
                <Minus className="text-amber-600" size={48} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-ink-500">Total Members</div>
                <div className="text-2xl font-bold text-ink-900">{mockMembers.length}</div>
              </div>
              <Users className="text-brown" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-ink-500">Growth Status</div>
                <div className="text-xl font-bold text-ink-900">{growthLabel}</div>
              </div>
              <StatusIcon className={`text-${healthStatus.color === 'success' ? 'emerald' : healthStatus.color === 'danger' ? 'red' : 'slate'}-600`} size={32} />
            </div>
            <div className="mt-2">
              <Badge variant={healthStatus.color as 'success' | 'danger' | 'neutral'}>
                {growthLabel}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-ink-500">New Members This Month</div>
            <div className="text-2xl font-bold text-ink-900">
              {membershipTrend[membershipTrend.length - 1]?.newMembers || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <ChartCard title="Membership Growth Trend" description="New members joining over time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={membershipTrend}>
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
            <Line
              type="monotone"
              dataKey="totalMembers"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', r: 4 }}
              name="Total Members"
            />
            <Line
              type="monotone"
              dataKey="newMembers"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              name="New Members"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-ink-900">Membership Overview</h2>
          <p className="text-sm text-ink-500">Monthly membership statistics</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {membershipTrend.map((data, index) => (
              <div key={index} className="flex items-center justify-between border-b border-ink-200 pb-3">
                <div>
                  <div className="font-medium text-ink-900">{data.month}</div>
                  <div className="text-sm text-ink-500">{data.newMembers} new member{data.newMembers !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-lg font-semibold text-brown">{data.totalMembers} total</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
