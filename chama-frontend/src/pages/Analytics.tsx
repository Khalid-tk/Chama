import { useEffect, useState } from 'react'
import { FileDown } from 'lucide-react'
import { useChamaId } from '../hooks/useChamaId'
import { chamaRoute } from '../lib/api'
import api from '../lib/api'
import { ChartCard } from '../components/charts/ChartCard'
import { ContributionsByMemberChart } from '../components/charts/ContributionsByMemberChart'
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart'
import { MpesaSuccessRateChart } from '../components/charts/MpesaSuccessRateChart'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import {
  TableShell,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/TableShell'
import { formatKES } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { exportToCSV } from '../utils/csvExport'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type AdminAnalyticsData = {
  kpis: {
    totalBalance: number
    contributionsThisMonth: number
    outstandingLoans: number
    lateLoansCount: number
    mpesaSuccessRate30d: number
    activeMembers: number
    totalLoanedInPeriod?: number
    totalRepaidInPeriod?: number
  }
  series: {
    contributionsMonthly: Array<{ month: string; totalAmount: number }>
    contributionsByMemberTop: Array<{ name: string; totalAmount: number }>
    loanStatusCounts: Record<string, number>
    loanDisburseMonthly: Array<{ month: string; totalAmount: number }>
    repaymentsMonthly: Array<{ month: string; totalAmount: number }>
    cashflowMonthly: Array<{ month: string; inflow: number; outflow: number }>
    mpesaOutcomesMonthly: Array<{ month: string; success: number; failed: number; pending: number }>
    newMembersMonthly: Array<{ month: string; count: number }>
  }
}

const RANGE_OPTIONS = [
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '12m', label: '12 months' },
]

export function Analytics() {
  const chamaId = useChamaId()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [range, setRange] = useState('12m')
  const [data, setData] = useState<AdminAnalyticsData | null>(null)

  useEffect(() => {
    loadData()
  }, [chamaId, range])

  const loadData = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const res = await api.get(chamaRoute(chamaId, '/analytics/admin'), {
        params: { range },
      })
      const raw = res.data?.data
      if (raw?.kpis && raw?.series) {
        setData({ kpis: raw.kpis, series: raw.series })
      } else {
        setData(null)
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load analytics')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500">Comprehensive chama analytics</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500">Comprehensive chama analytics</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium text-slate-700">Could not load analytics</p>
            <p className="text-sm text-slate-500 mt-1">{loadError}</p>
            <Button className="mt-4" onClick={() => loadData()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kpis = data?.kpis ?? {
    totalBalance: 0,
    contributionsThisMonth: 0,
    outstandingLoans: 0,
    lateLoansCount: 0,
    mpesaSuccessRate30d: 0,
    activeMembers: 0,
    totalLoanedInPeriod: 0,
    totalRepaidInPeriod: 0,
  }
  const series = data?.series ?? {
    contributionsMonthly: [],
    contributionsByMemberTop: [],
    loanStatusCounts: {},
    loanDisburseMonthly: [],
    repaymentsMonthly: [],
    cashflowMonthly: [],
    mpesaOutcomesMonthly: [],
    newMembersMonthly: [],
  }

  const loanStatusArray = Object.entries(series.loanStatusCounts || {})
    .map(([status, count]) => ({ status, count: Number(count) || 0 }))
    .filter((d) => d.count > 0)
  const riskDistributionData = [
    { level: 'Low' as const, count: series.loanStatusCounts?.PAID ?? 0 },
    { level: 'Medium' as const, count: (series.loanStatusCounts?.ACTIVE ?? 0) + (series.loanStatusCounts?.LATE ?? 0) },
    { level: 'High' as const, count: series.loanStatusCounts?.PENDING ?? 0 },
  ]
  const cashflowChartData = (series.cashflowMonthly || []).map((m) => ({
    month: m.month,
    in: Number(m.inflow) || 0,
    out: Number(m.outflow) || 0,
  }))
  const mpesaSuccessByMonth = (series.mpesaOutcomesMonthly || []).map((m) => {
    const success = Number(m.success) || 0
    const failed = Number(m.failed) || 0
    const pending = Number(m.pending) || 0
    const total = success + failed + pending
    return {
      week: m.month,
      successRate: total ? Math.round((success / total) * 1000) / 10 : 0,
      total,
    }
  })

  const handleExportTopContributors = () => {
    exportToCSV(
      (series.contributionsByMemberTop || []).map((r) => ({ Member: r.name, 'Total (KES)': r.totalAmount })),
      'top-contributors'
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Analytics Deep Dive</h1>
          <p className="text-sm text-slate-500">Comprehensive analytics from backend</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Range:</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-slate-500">Total Balance</p>
            <p className="text-xl font-semibold text-slate-800">{formatKES(Number(kpis.totalBalance) || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-slate-500">Contributions (this month)</p>
            <p className="text-xl font-semibold text-slate-800">{formatKES(Number(kpis.contributionsThisMonth) || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-slate-500">Outstanding loans</p>
            <p className="text-xl font-semibold text-slate-800">{formatKES(Number(kpis.outstandingLoans) || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-slate-500">Late loans</p>
            <p className="text-xl font-semibold text-slate-800">{kpis.lateLoansCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-slate-500">M-Pesa success (30d)</p>
            <p className="text-xl font-semibold text-slate-800">{kpis.mpesaSuccessRate30d}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-slate-500">Active members</p>
            <p className="text-xl font-semibold text-slate-800">{kpis.activeMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-slate-500">Money loaned (period)</p>
            <p className="text-xl font-semibold text-slate-800">{formatKES(Number(kpis.totalLoanedInPeriod) || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-slate-500">Repaid loans (period)</p>
            <p className="text-xl font-semibold text-emerald-600">{formatKES(Number(kpis.totalRepaidInPeriod) || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 1) Contributions Deep Dive */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Contributions Deep Dive</h2>
              <p className="text-sm text-slate-500">Monthly trend and top members</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportTopContributors}>
              <FileDown size={18} />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ChartCard
            title="Monthly contributions"
            description="Total amount per month"
            loading={loading}
            empty={!series.contributionsMonthly?.length}
            emptyMessage="No contribution data"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(series.contributionsMonthly || []).map((m) => ({ ...m, totalAmount: Number(m.totalAmount) || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `KES ${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatKES(Number(v)), 'Total']} />
                <Line type="monotone" dataKey="totalAmount" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard
            title="Top contributors"
            description="Top 10 by total amount"
            loading={loading}
            empty={!series.contributionsByMemberTop?.length}
            emptyMessage="No data"
          >
            <ContributionsByMemberChart
              data={(series.contributionsByMemberTop || []).map((r) => ({ member: r.name, amount: r.totalAmount }))}
            />
          </ChartCard>
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Top contributors (table)</h3>
            <TableShell>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Total (KES)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(series.contributionsByMemberTop || []).slice(0, 10).map((r, i) => (
                  <TableRow key={r.name}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right">{formatKES(r.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableShell>
          </div>
        </CardContent>
      </Card>

      {/* 2) Loans Deep Dive */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-800">Loans Deep Dive</h2>
          <p className="text-sm text-slate-500">Status distribution, disbursements vs repayments</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Loan status"
              description="Count by status"
              loading={loading}
              empty={loanStatusArray.length === 0}
              emptyMessage="No loan data"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanStatusArray}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value, payload }: { name?: string; value?: number; payload?: { status: string; count: number } }) => {
                      const status = payload?.status ?? name ?? '—'
                      const count = payload?.count ?? value ?? 0
                      return `${status}: ${count}`
                    }}
                  >
                    {loanStatusArray.map((entry, i) => (
                      <Cell key={entry.status} fill={['#f59e0b', '#10b981', '#ef4444', '#2563eb', '#8b5cf6', '#64748b'][i % 6]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Risk distribution (simplified)"
              description="By status category"
              loading={loading}
              empty={riskDistributionData.every((d) => d.count === 0)}
              emptyMessage="No loan data"
            >
              <RiskDistributionChart data={riskDistributionData} />
            </ChartCard>
          </div>
          <ChartCard
            title="Disbursements vs repayments"
            description="Monthly totals"
            loading={loading}
            empty={!(series.loanDisburseMonthly?.length || series.repaymentsMonthly?.length)}
            emptyMessage="No data"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={(() => {
                  const d: Record<string, { month: string; disbursements: number; repayments: number }> = {}
                  ;(series.loanDisburseMonthly || []).forEach((m) => {
                    d[m.month] = { month: m.month, disbursements: m.totalAmount, repayments: 0 }
                  })
                  ;(series.repaymentsMonthly || []).forEach((m) => {
                    if (!d[m.month]) d[m.month] = { month: m.month, disbursements: 0, repayments: 0 }
                    d[m.month].repayments = m.totalAmount
                  })
                  return Object.values(d).sort((a, b) => a.month.localeCompare(b.month))
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(v: number) => [formatKES(v), '']} />
                <Legend />
                <Line type="monotone" dataKey="disbursements" stroke="#ef4444" strokeWidth={2} name="Disbursements" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="repayments" stroke="#10b981" strokeWidth={2} name="Repayments" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </CardContent>
      </Card>

      {/* 3) Mpesa Deep Dive */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-800">M-Pesa Deep Dive</h2>
          <p className="text-sm text-slate-500">Outcomes and success rate</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ChartCard
            title="Success rate by month"
            description="M-Pesa success rate trend"
            loading={loading}
            empty={!mpesaSuccessByMonth.length}
            emptyMessage="No M-Pesa data"
          >
            <MpesaSuccessRateChart data={mpesaSuccessByMonth} />
          </ChartCard>
          <ChartCard
            title="Outcomes by month"
            description="Success, failed, pending"
            loading={loading}
            empty={!series.mpesaOutcomesMonthly?.length}
            emptyMessage="No data"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.mpesaOutcomesMonthly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} name="Success" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </CardContent>
      </Card>

      {/* 4) Members Growth */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-800">Members Growth</h2>
          <p className="text-sm text-slate-500">New members per month</p>
        </CardHeader>
        <CardContent>
          <ChartCard
            title="New members monthly"
            description="Joins in range"
            loading={loading}
            empty={!series.newMembersMonthly?.length}
            emptyMessage="No join data"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series.newMembersMonthly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(v: number) => [v, 'New members']} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="New members" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </CardContent>
      </Card>

      {/* Cashflow */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-800">Cashflow</h2>
          <p className="text-sm text-slate-500">Inflow vs outflow by month</p>
        </CardHeader>
        <CardContent>
          <ChartCard
            title="Inflow vs outflow"
            loading={loading}
            empty={!cashflowChartData.length}
            emptyMessage="No transaction data"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashflowChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatKES(v), '']} />
                <Legend />
                <Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={2} name="Inflow" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} name="Outflow" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </CardContent>
      </Card>
    </div>
  )
}
