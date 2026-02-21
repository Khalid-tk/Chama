import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  CreditCard,
  Users,
  TrendingUp,
  AlertTriangle,
  Smartphone,
  Plus,
  FileText,
  UserPlus,
  UserCog,
  Coins,
  Inbox,
  ChevronDown,
} from 'lucide-react'
import { formatKES } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { ChartCard } from '../../components/charts/ChartCard'
import { ContributionsTrendChart } from '../../components/charts/ContributionsTrendChart'
import { ContributionsByMemberChart } from '../../components/charts/ContributionsByMemberChart'
import { LoanPortfolioStackedChart } from '../../components/charts/LoanPortfolioStackedChart'
import { CashflowAreaChart } from '../../components/charts/CashflowAreaChart'
import { DefaultsTrendChart } from '../../components/charts/DefaultsTrendChart'
import { MpesaTrendsChart } from '../../components/charts/MpesaTrendsChart'
import { InsightsPanel } from '../../components/admin/InsightsPanel'
import { RecentActivityTabs } from '../../components/admin/RecentActivityTabs'
import { DateRangeFilter, type DateRange } from '../../components/admin/DateRangeFilter'
import { generateAdminInsights } from '../../utils/adminInsights'
import { useChamaId } from '../../hooks/useChamaId'
import api, { chamaRoute } from '../../lib/api'
import { exportToCSV } from '../../utils/csvExport'

const RANGE_MAP: Record<DateRange, string> = {
  last_1_month: '1m',
  last_3_months: '3m',
  last_6_months: '6m',
  last_12_months: '12m',
}

export function AdminDashboard() {
  const chamaId = useChamaId()
  const navigate = useNavigate()
  const plusMenuRef = useRef<HTMLDivElement>(null)
  const [dateRange, setDateRange] = useState<DateRange>('last_6_months')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [analytics, setAnalytics] = useState<{
    kpis: {
      totalBalance: number
      contributionsThisMonth: number
      outstandingLoans: number
      lateLoansCount: number
      mpesaSuccessRate30d: number
      activeMembers: number
    }
    series: {
      contributionsMonthly: Array<{ month: string; totalAmount: number }>
      contributionsByMemberTop: Array<{ name: string; totalAmount: number }>
      loanStatusCounts: Record<string, number>
      cashflowMonthly: Array<{ month: string; inflow: number; outflow: number }>
      mpesaOutcomesMonthly: Array<{ month: string; success: number; failed: number; pending: number }>
      loanDisburseMonthly: Array<{ month: string; totalAmount: number }>
      repaymentsMonthly: Array<{ month: string; totalAmount: number }>
    }
  } | null>(null)
  const [contributions, setContributions] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [mpesaPayments, setMpesaPayments] = useState<any[]>([])

  const rangeParam = RANGE_MAP[dateRange] || '6m'

  useEffect(() => {
    loadData()
  }, [chamaId, rangeParam])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false)
      }
    }
    if (plusMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [plusMenuOpen])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [analyticsRes, contributionsRes, loansRes, mpesaRes] = await Promise.all([
        api.get(chamaRoute(chamaId, '/analytics/admin'), { params: { range: rangeParam } }),
        api.get(chamaRoute(chamaId, '/contributions'), { params: { limit: 500 } }).catch(() => ({ data: { data: { data: [] } } })),
        api.get(chamaRoute(chamaId, '/loans'), { params: { limit: 200 } }).catch(() => ({ data: { data: { data: [] } } })),
        api.get(chamaRoute(chamaId, '/mpesa')).catch(() => ({ data: { data: { data: [] } } })),
      ])
      const raw = analyticsRes.data?.data
      if (raw?.kpis && raw?.series) {
        setAnalytics({
          kpis: raw.kpis,
          series: raw.series,
        })
      } else {
        setAnalytics(null)
      }
      setContributions(contributionsRes.data?.data?.data ?? [])
      setLoans(loansRes.data?.data?.data ?? [])
      setMpesaPayments(mpesaRes.data?.data?.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const kpis = analytics?.kpis ?? {
    totalBalance: 0,
    contributionsThisMonth: 0,
    outstandingLoans: 0,
    lateLoansCount: 0,
    mpesaSuccessRate30d: 0,
    activeMembers: 0,
  }

  const cycleChange = useMemo(() => {
    const series = analytics?.series?.contributionsMonthly
    if (!series || series.length < 2) return 0
    const thisMonth = series[series.length - 1]?.totalAmount ?? 0
    const lastMonth = series[series.length - 2]?.totalAmount ?? 0
    if (lastMonth === 0) return 0
    return ((thisMonth - lastMonth) / lastMonth) * 100
  }, [analytics?.series?.contributionsMonthly])

  const contributionsTrend = useMemo(() => {
    const s = analytics?.series?.contributionsMonthly ?? []
    return s.map((m) => ({ date: m.month, amount: Number(m.totalAmount) || 0 }))
  }, [analytics?.series?.contributionsMonthly])

  const contributionsByMember = useMemo(() => {
    const s = analytics?.series?.contributionsByMemberTop ?? []
    return s.map((m) => ({ member: m.name, amount: Number(m.totalAmount) || 0 }))
  }, [analytics?.series?.contributionsByMemberTop])

  const loanPortfolioData = useMemo(() => {
    const counts = analytics?.series?.loanStatusCounts ?? {}
    return [
      {
        month: 'Current',
        active: Number(counts.ACTIVE) || 0,
        late: Number(counts.LATE) || 0,
        repaid: Number(counts.PAID) || 0,
      },
    ]
  }, [analytics?.series?.loanStatusCounts])

  const cashflowData = useMemo(() => {
    const s = analytics?.series?.cashflowMonthly ?? []
    return s.map((m) => ({
      month: m.month,
      in: Number(m.inflow) || 0,
      out: Number(m.outflow) || 0,
    }))
  }, [analytics?.series?.cashflowMonthly])

  const defaultsTrend = useMemo(() => {
    const late = analytics?.kpis?.lateLoansCount ?? 0
    return [{ month: 'Current', lateCount: Number(late), overdueCount: 0 }]
  }, [analytics?.kpis?.lateLoansCount])

  const mpesaTrends = useMemo(() => {
    const s = analytics?.series?.mpesaOutcomesMonthly ?? []
    return s.map((m) => ({
      date: m.month,
      success: Number(m.success) || 0,
      failed: Number(m.failed) || 0,
      pending: Number(m.pending) || 0,
    }))
  }, [analytics?.series?.mpesaOutcomesMonthly])

  const insights = useMemo(() => {
    return generateAdminInsights({
      contributions: contributions.map((c: any) => ({ date: c.paidAt || c.createdAt, amount: c.amount })),
      loans: loans.map((l: any) => ({ status: l.status, date: l.requestedAt, amount: l.principal ?? l.totalDue })),
      mpesaPayments: mpesaPayments.map((p: any) => ({ status: p.status?.toLowerCase() ?? '', date: p.createdAt })),
      members: Array.from({ length: kpis.activeMembers }, () => ({ joined: '' })),
    })
  }, [contributions, loans, mpesaPayments, kpis.activeMembers])

  const allTransactions = useMemo(() => {
    const txns: Array<{ id: string; date: string; desc: string; amount: number; type: 'credit' | 'debit'; member?: string }> = []
    contributions.forEach((c: any) => {
      txns.push({
        id: `c-${c.id}`,
        date: c.paidAt || c.createdAt,
        desc: `Contribution - ${c.method ?? 'Payment'}`,
        amount: c.amount,
        type: 'credit',
        member: c.user?.fullName,
      })
    })
    loans
      .filter((l: any) => l.status === 'ACTIVE' || l.status === 'APPROVED')
      .forEach((l: any) => {
        txns.push({
          id: `l-${l.id}`,
          date: l.approvedAt || l.requestedAt,
          desc: `Loan Disbursement`,
          amount: l.principal ?? l.totalDue,
          type: 'debit',
          member: l.user?.fullName,
        })
      })
    return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [contributions, loans])

  const loansForTabs = useMemo(() => {
    return loans.slice(0, 20).map((l: any) => ({
      id: l.id,
      date: l.requestedAt || l.approvedAt,
      member: l.user?.fullName ?? 'Member',
      amount: l.principal ?? l.totalDue,
      status: l.status,
    }))
  }, [loans])

  const mpesaForTabs = useMemo(() => {
    return mpesaPayments.slice(0, 20).map((p: any) => ({
      id: p.id,
      date: p.createdAt,
      phoneNumber: p.phone,
      amount: p.amount,
      status: p.status,
      description: `${p.purpose ?? ''}`,
    }))
  }, [mpesaPayments])

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">{error}</p>
            <Button className="mt-4" onClick={loadData}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Chama overview and key performance indicators</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={plusMenuRef}>
            <Button
              onClick={() => setPlusMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Admin actions
              <ChevronDown size={16} className={plusMenuOpen ? 'rotate-180' : ''} />
            </Button>
            {plusMenuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false)
                    navigate(`/admin/${chamaId}/members`)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <UserPlus size={18} />
                  Invite member
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false)
                    navigate(`/admin/${chamaId}/members`)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <UserCog size={18} />
                  Manage members
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false)
                    navigate(`/admin/${chamaId}/contributions`)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Coins size={18} />
                  Record contribution
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false)
                    navigate(`/admin/${chamaId}/join-requests`)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Inbox size={18} />
                  Join requests
                </button>
              </div>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              const reportRows = [
                { metric: 'Total Balance', value: formatKES(kpis.totalBalance) },
                { metric: 'This Cycle', value: formatKES(kpis.contributionsThisMonth) },
                { metric: 'Outstanding Loans', value: formatKES(kpis.outstandingLoans) },
                { metric: 'Late Repayments', value: kpis.lateLoansCount },
                { metric: 'Mpesa Success Rate', value: `${kpis.mpesaSuccessRate30d}%` },
                { metric: 'Active Members', value: kpis.activeMembers },
              ]
              exportToCSV(reportRows, 'chama-dashboard-report', ['metric', 'value'])
            }}
          >
            <FileText size={18} />
            Generate Report
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </CardContent>
      </Card>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
        <StatCard icon={Wallet} label="Total Balance" value={formatKES(kpis.totalBalance)} />
        <StatCard
          icon={TrendingUp}
          label="This Cycle"
          value={
            <>
              <span className="block truncate">{formatKES(kpis.contributionsThisMonth)}</span>
              <span className={`block truncate text-xs ${cycleChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {cycleChange >= 0 ? '+' : ''}
                {cycleChange.toFixed(1)}%
              </span>
            </>
          }
        />
        <StatCard icon={CreditCard} label="Outstanding Loans" value={formatKES(kpis.outstandingLoans)} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
        <StatCard icon={AlertTriangle} label="Late Repayments" value={kpis.lateLoansCount} />
        <StatCard icon={Smartphone} label="Mpesa Success Rate" value={`${kpis.mpesaSuccessRate30d}%`} />
        <StatCard icon={Users} label="Active Members" value={kpis.activeMembers} />
      </div>

      {/* Chart Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Contributions Trend" description="Contribution trends from analytics">
          <ContributionsTrendChart data={contributionsTrend} />
        </ChartCard>
        <ChartCard title="Top Contributors" description="Top members by total contributions">
          <ContributionsByMemberChart data={contributionsByMember} />
        </ChartCard>
        <ChartCard title="Loan Portfolio Status" description="Current loan status (active, late, repaid)">
          <LoanPortfolioStackedChart data={loanPortfolioData} />
        </ChartCard>
        <ChartCard title="Cashflow Overview" description="Money in vs money out">
          <CashflowAreaChart data={cashflowData} />
        </ChartCard>
        <ChartCard title="Defaults Trend" description="Late repayments">
          <DefaultsTrendChart data={defaultsTrend} />
        </ChartCard>
        <ChartCard title="Mpesa Outcomes" description="Success/failure/pending by month">
          <MpesaTrendsChart data={mpesaTrends} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <InsightsPanel insights={insights} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivityTabs
            transactions={allTransactions}
            loans={loansForTabs}
            mpesaPayments={mpesaForTabs}
            onRefresh={loadData}
          />
        </div>
      </div>
    </div>
  )
}
