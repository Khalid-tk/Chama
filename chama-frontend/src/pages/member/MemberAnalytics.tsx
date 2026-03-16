import { useEffect, useState } from 'react'
import { FileDown } from 'lucide-react'
import { useChamaId } from '../../hooks/useChamaId'
import { chamaRoute } from '../../lib/api'
import api from '../../lib/api'
import { ChartCard } from '../../components/charts/ChartCard'
import { ContributionsTrendChart } from '../../components/charts/ContributionsTrendChart'
import { LoanRepaymentChart } from '../../components/charts/LoanRepaymentChart'
import { MemberMpesaTrendChart } from '../../components/charts/MemberMpesaTrendChart'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatKES, formatDateShort } from '../../lib/format'
import { exportToCSV } from '../../utils/csvExport'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type MemberAnalyticsData = {
  kpis: {
    myContributionThisMonth: number
    myTotalContributions: number
    myLoanRemaining: number
    nextDueDate: string | null
    mpesaSuccessRate30d: number
    contributionStreakMonths: number
  }
  series: {
    myContributionsMonthly: Array<{ month: string; totalAmount: number }>
    myRepaymentsMonthly: Array<{ month: string; totalAmount: number }>
    myMpesaOutcomesMonthly: Array<{ month: string; success: number; failed: number; pending: number }>
    chamaMembersJoiningMonthly: Array<{ month: string; count: number }>
  }
  loanProgress: {
    totalDue: number
    paidSoFar: number
    remaining: number
  }
}

const RANGE_OPTIONS = [
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '12m', label: '12 months' },
]

export function MemberAnalytics() {
  const chamaId = useChamaId()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [range, setRange] = useState('12m')
  const [data, setData] = useState<MemberAnalyticsData | null>(null)

  useEffect(() => {
    loadData()
  }, [chamaId, range])

  const loadData = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const res = await api.get(chamaRoute(chamaId, '/analytics/member'), { params: { range } })
      const raw = res.data?.data
      if (raw?.kpis && raw?.series) {
        setData({
          kpis: raw.kpis,
          series: raw.series,
          loanProgress: raw.loanProgress ?? { totalDue: 0, paidSoFar: 0, remaining: 0 },
        })
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
          <h1 className="text-2xl font-semibold text-ink-900">Analytics</h1>
          <p className="text-sm text-ink-500">Your personal analytics</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-300 border-t-blue-600" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Analytics</h1>
          <p className="text-sm text-ink-500">Your personal analytics</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium text-ink-700">Could not load analytics</p>
            <p className="text-sm text-ink-500 mt-1">{loadError}</p>
            <Button className="mt-4" onClick={() => loadData()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kpis = data?.kpis ?? {
    myContributionThisMonth: 0,
    myTotalContributions: 0,
    myLoanRemaining: 0,
    nextDueDate: null,
    mpesaSuccessRate30d: 0,
    contributionStreakMonths: 0,
  }
  const series = data?.series ?? {
    myContributionsMonthly: [],
    myRepaymentsMonthly: [],
    myMpesaOutcomesMonthly: [],
    chamaMembersJoiningMonthly: [],
  }
  const loanProgress = data?.loanProgress ?? { totalDue: 0, paidSoFar: 0, remaining: 0 }

  const contributionsTrend = (series.myContributionsMonthly || []).map((m) => ({
    date: m.month,
    amount: Number(m.totalAmount) || 0,
  }))
  const mpesaTrends = (series.myMpesaOutcomesMonthly || []).map((m) => ({
    date: m.month,
    success: Number(m.success) || 0,
    failed: Number(m.failed) || 0,
    pending: Number(m.pending) || 0,
  }))

  const hasData =
    kpis.myTotalContributions > 0 ||
    kpis.myLoanRemaining > 0 ||
    series.myContributionsMonthly?.length > 0 ||
    series.myRepaymentsMonthly?.length > 0

  const handleExportContributions = () => {
    exportToCSV(
      (series.myContributionsMonthly || []).map((r) => ({ Month: r.month, 'Amount (KES)': r.totalAmount })),
      'my-contributions'
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Analytics Deep Dive</h1>
          <p className="text-sm text-ink-500">Your personal analytics from backend</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-700">Range:</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-ink-300 bg-warm-card px-3 py-2 text-sm"
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={handleExportContributions}>
            <FileDown size={18} />
            Export contributions
          </Button>
        </div>
      </div>

      {!hasData && (
        <Card>
          <CardContent className="py-12 text-center text-ink-500">
            <p className="font-medium">No analytics data yet</p>
            <p className="text-sm mt-1">Your contributions, loans, and M-Pesa activity will appear here.</p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-ink-500">This month</p>
            <p className="text-xl font-semibold text-ink-900">{formatKES(kpis.myContributionThisMonth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-ink-500">Total contributions</p>
            <p className="text-xl font-semibold text-ink-900">{formatKES(kpis.myTotalContributions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-ink-500">Loan remaining</p>
            <p className="text-xl font-semibold text-ink-900">{formatKES(kpis.myLoanRemaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-ink-500">Next due date</p>
            <p className="text-xl font-semibold text-ink-900">{kpis.nextDueDate ? formatDateShort(kpis.nextDueDate) : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-ink-500">M-Pesa success (30d)</p>
            <p className="text-xl font-semibold text-ink-900">{kpis.mpesaSuccessRate30d}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-ink-500">Contribution streak</p>
            <p className="text-xl font-semibold text-ink-900">{kpis.contributionStreakMonths} months</p>
          </CardContent>
        </Card>
        {(loanProgress.totalDue > 0 || loanProgress.paidSoFar > 0) && (
          <>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-ink-500">Money loaned</p>
                <p className="text-xl font-semibold text-ink-900">{formatKES(loanProgress.totalDue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-ink-500">Repaid loans</p>
                <p className="text-xl font-semibold text-emerald-600">{formatKES(loanProgress.paidSoFar)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Contributions trend"
          description="Your contributions by month"
          loading={loading}
          empty={!series.myContributionsMonthly?.length}
          emptyMessage="No contribution data"
        >
          <ContributionsTrendChart data={contributionsTrend} />
        </ChartCard>

        <ChartCard
          title="Repayments trend"
          description="Your loan repayments by month"
          loading={loading}
          empty={!series.myRepaymentsMonthly?.length}
          emptyMessage="No repayment data"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series.myRepaymentsMonthly || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip formatter={(v: number | undefined) => [formatKES(Number(v ?? 0)), 'Repaid'] as const} />
              <Bar dataKey="totalAmount" fill="#10b981" radius={[4, 4, 0, 0]} name="Repayments" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {(loanProgress.totalDue > 0 || loanProgress.remaining > 0) && (
          <ChartCard
            title="Loan progress"
            description="Paid vs remaining"
            loading={loading}
            empty={false}
          >
            <LoanRepaymentChart
              paid={loanProgress.paidSoFar}
              total={loanProgress.totalDue}
            />
          </ChartCard>
        )}

        <ChartCard
          title="M-Pesa outcomes"
          description="Success / failed / pending by month"
          loading={loading}
          empty={!series.myMpesaOutcomesMonthly?.length}
          emptyMessage="No M-Pesa data"
        >
          <MemberMpesaTrendChart data={mpesaTrends} />
        </ChartCard>
      </div>

      {/* Chama members joining (if provided) */}
      {(series.chamaMembersJoiningMonthly?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-ink-900">Chama growth</h2>
              <p className="text-sm text-ink-500">New members joining per month</p>
            </div>
            <ChartCard
              title="New members monthly"
              loading={loading}
              empty={false}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series.chamaMembersJoiningMonthly || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(v: number | undefined) => [Number(v ?? 0), 'New members'] as const} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="New members" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

