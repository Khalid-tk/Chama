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
import { MpesaTrendsChart } from '../../components/charts/MpesaTrendsChart'
import { InsightsPanel } from '../../components/admin/InsightsPanel'
import { RecentActivityTabs } from '../../components/admin/RecentActivityTabs'
import { DateRangeFilter, type DateRange } from '../../components/admin/DateRangeFilter'
import { generateAdminInsights } from '../../utils/adminInsights'
import { useChamaId } from '../../hooks/useChamaId'
import api, { chamaRoute } from '../../lib/api'
import { exportToCSV } from '../../utils/csvExport'

const RANGE_MAP: Record<DateRange, string> = {
  this_month: '1m',
  last_3_months: '3m',
  last_6_months: '6m',
  custom: '12m',
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
        setAnalytics({ kpis: raw.kpis, series: raw.series })
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
    return [{ month: 'Current', active: Number(counts.ACTIVE) || 0, late: Number(counts.LATE) || 0, repaid: Number(counts.PAID) || 0 }]
  }, [analytics?.series?.loanStatusCounts])

  const cashflowData = useMemo(() => {
    const s = analytics?.series?.cashflowMonthly ?? []
    return s.map((m) => ({ month: m.month, in: Number(m.inflow) || 0, out: Number(m.outflow) || 0 }))
  }, [analytics?.series?.cashflowMonthly])

  const mpesaTrends = useMemo(() => {
    const s = analytics?.series?.mpesaOutcomesMonthly ?? []
    return s.map((m) => ({ date: m.month, success: Number(m.success) || 0, failed: Number(m.failed) || 0, pending: Number(m.pending) || 0 }))
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
      txns.push({ id: `c-${c.id}`, date: c.paidAt || c.createdAt, desc: `Contribution - ${c.method ?? 'Payment'}`, amount: c.amount, type: 'credit', member: c.user?.fullName })
    })
    loans.filter((l: any) => l.status === 'ACTIVE' || l.status === 'APPROVED').forEach((l: any) => {
      txns.push({ id: `l-${l.id}`, date: l.approvedAt || l.requestedAt, desc: 'Loan Disbursement', amount: l.principal ?? l.totalDue, type: 'debit', member: l.user?.fullName })
    })
    return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [contributions, loans])

  const loansForTabs = useMemo(() => {
    return loans.slice(0, 20).map((l: any) => ({ id: l.id, date: l.requestedAt || l.approvedAt, member: l.user?.fullName ?? 'Member', amount: l.principal ?? l.totalDue, status: l.status }))
  }, [loans])

  const mpesaForTabs = useMemo(() => {
    return mpesaPayments.slice(0, 20).map((p: any) => ({ id: p.id, date: p.createdAt, phoneNumber: p.phone, amount: p.amount, status: p.status, description: `${p.purpose ?? ''}` }))
  }, [mpesaPayments])

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-ink-500 text-sm">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={loadData}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-w-0 w-full max-w-full overflow-x-hidden">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-500 mt-0.5">Financial overview for your chama</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />

          <div className="relative" ref={plusMenuRef}>
            <Button variant="secondary" onClick={() => setPlusMenuOpen((o) => !o)} size="sm">
              <Plus size={14} />
              Actions
              <ChevronDown size={13} className={`transition-transform ${plusMenuOpen ? 'rotate-180' : ''}`} />
            </Button>
            {plusMenuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg overflow-hidden py-1 bg-warm-card border border-ink-300"
                style={{ boxShadow: 'var(--shadow-md)' }}>
                {[
                  { icon: UserPlus, label: 'Invite member',        to: 'members' },
                  { icon: UserCog,  label: 'Manage members',       to: 'members' },
                  { icon: Coins,    label: 'Record contribution',   to: 'contributions' },
                  { icon: Inbox,    label: 'Join requests',         to: 'join-requests' },
                ].map((item) => (
                  <button key={item.label} type="button"
                    onClick={() => { setPlusMenuOpen(false); navigate(`/admin/${chamaId}/${item.to}`) }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-ink-700 hover:bg-warm-bg transition-colors">
                    <item.icon size={14} className="text-ink-400 shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="secondary" size="sm"
            onClick={() => {
              exportToCSV([
                { metric: 'Total Balance',      value: formatKES(kpis.totalBalance) },
                { metric: 'This Cycle',          value: formatKES(kpis.contributionsThisMonth) },
                { metric: 'Outstanding Loans',   value: formatKES(kpis.outstandingLoans) },
                { metric: 'Late Repayments',     value: kpis.lateLoansCount },
                { metric: 'M-Pesa Success Rate', value: `${kpis.mpesaSuccessRate30d}%` },
                { metric: 'Active Members',      value: kpis.activeMembers },
              ], 'chama-dashboard-report', ['metric', 'value'])
            }}>
            <FileText size={14} />
            Export
          </Button>
        </div>
      </div>

      {/* ─── Primary charts — dominant hero area ─── */}
      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="lg:col-span-2">
          <ChartCard title="Contribution Trends" description="Monthly total collected over selected period" height="lg">
            <ContributionsTrendChart data={contributionsTrend} />
          </ChartCard>
        </div>
        <ChartCard title="Cashflow" description="Inflows vs outflows" height="lg">
          <CashflowAreaChart data={cashflowData} />
        </ChartCard>
      </div>

      {/* ─── Secondary charts — equal 3-col ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
        <ChartCard title="Top Contributors" description="Ranked by total contributions">
          <ContributionsByMemberChart data={contributionsByMember} />
        </ChartCard>
        <ChartCard title="Loan Portfolio" description="Active, late, and repaid">
          <LoanPortfolioStackedChart data={loanPortfolioData} />
        </ChartCard>
        <ChartCard title="M-Pesa Outcomes" description="Success / failure / pending">
          <MpesaTrendsChart data={mpesaTrends} />
        </ChartCard>
      </div>

      {/* ─── KPI strip ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        <StatCard icon={Wallet}        label="Total Balance"     value={formatKES(kpis.totalBalance)}            accent="blue"    />
        <StatCard icon={TrendingUp}    label="This Cycle"        value={formatKES(kpis.contributionsThisMonth)}  accent="emerald" trend={cycleChange} trendLabel="vs last month" />
        <StatCard icon={CreditCard}    label="Outstanding Loans" value={formatKES(kpis.outstandingLoans)}         accent="amber"   />
        <StatCard icon={AlertTriangle} label="Late Repayments"   value={kpis.lateLoansCount}                      accent="red"     />
        <StatCard icon={Smartphone}    label="M-Pesa Rate"       value={`${kpis.mpesaSuccessRate30d}%`}           accent="cyan"    />
        <StatCard icon={Users}         label="Active Members"    value={kpis.activeMembers}                       accent="blue"    />
      </div>

      {/* ─── Insights + Activity ─── */}
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <InsightsPanel insights={insights} />
        <RecentActivityTabs transactions={allTransactions} loans={loansForTabs} mpesaPayments={mpesaForTabs} onRefresh={loadData} />
      </div>
    </div>
  )
}


