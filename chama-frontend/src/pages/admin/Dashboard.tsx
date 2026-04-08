import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  CreditCard,
  Users,
  TrendingUp,
  Inbox,
  Plus,
  FileText,
  UserPlus,
  UserCog,
  Coins,
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
import { DateRangeFilter, type DateRange } from '../../components/admin/DateRangeFilter'
import { useChamaId } from '../../hooks/useChamaId'
import api, { chamaRoute } from '../../lib/api'
import { exportToCSV } from '../../utils/csvExport'

const RANGE_MAP: Record<DateRange, string> = {
  this_month: '1m',
  last_3_months: '3m',
  last_6_months: '6m',
  custom: '12m',
}

/** Chart body height (px) — compact for single-screen desktop layouts */
const CHART_H = 168

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
  const [, setContributions] = useState<any[]>([])
  const [, setLoans] = useState<any[]>([])
  const [, setMpesaPayments] = useState<any[]>([])

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

  const pendingLoanCount = useMemo(() => {
    const c = analytics?.series?.loanStatusCounts ?? {}
    return Number(c.PENDING) || 0
  }, [analytics?.series?.loanStatusCounts])

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

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-brown" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-semibold text-ink-900">Dashboard</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-ink-500 text-sm">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={loadData}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCompact = '!py-2.5 !px-3 [&>div.text-2xl]:!text-lg [&>div:first-child]:!mb-2'

  return (
    <div className="flex min-h-0 flex-col gap-3 min-w-0 w-full max-w-full overflow-x-hidden xl:max-h-[calc(100vh-7.5rem)] xl:overflow-y-auto">

      {/* 1. Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ink-900 leading-tight">Dashboard</h1>
          <p className="text-xs text-ink-500">Financial overview for your chama</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:flex-shrink-0">
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
                { metric: 'Available Balance', value: formatKES(kpis.totalBalance) },
                { metric: 'Contributions (period)', value: formatKES(kpis.contributionsThisMonth) },
                { metric: 'Outstanding Loans', value: formatKES(kpis.outstandingLoans) },
                { metric: 'Active Members', value: kpis.activeMembers },
                { metric: 'Pending Loans', value: pendingLoanCount },
                { metric: 'Late Repayments', value: kpis.lateLoansCount },
                { metric: 'M-Pesa Success Rate', value: `${kpis.mpesaSuccessRate30d}%` },
              ], 'chama-dashboard-report', ['metric', 'value'])
            }}>
            <FileText size={14} />
            Export
          </Button>
        </div>
      </div>

      {/* 2. Summary cards — first row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5 [&>*]:min-w-0 shrink-0">
        <StatCard icon={Wallet}        label="Available Balance"   value={formatKES(kpis.totalBalance)}           accent="blue"    className={statCompact} />
        <StatCard icon={TrendingUp}    label="Total Contributions" value={formatKES(kpis.contributionsThisMonth)} accent="emerald" trend={cycleChange} trendLabel="vs prior" className={statCompact} />
        <StatCard icon={CreditCard}    label="Outstanding Loans" value={formatKES(kpis.outstandingLoans)}       accent="amber"   className={statCompact} />
        <StatCard icon={Users}         label="Active Members"    value={kpis.activeMembers}                       accent="blue"    className={statCompact} />
        <StatCard icon={Inbox}         label="Pending Loans"     value={pendingLoanCount}                         accent="violet"  className={`col-span-2 sm:col-span-1 xl:col-span-1 ${statCompact}`} />
      </div>

      {/* 3. Charts — below summary; compact heights */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="lg:col-span-2">
          <ChartCard title="Contribution Trends" description="Monthly total — selected period" height={CHART_H}>
            <ContributionsTrendChart data={contributionsTrend} />
          </ChartCard>
        </div>
        <div>
          <ChartCard title="Cashflow" description="Inflows vs outflows" height={CHART_H}>
            <CashflowAreaChart data={cashflowData} />
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3 [&>*]:min-w-0">
        <ChartCard title="Top Contributors" description="By total contributions" height={CHART_H}>
          <ContributionsByMemberChart data={contributionsByMember} />
        </ChartCard>
        <ChartCard title="Loan Distribution" description="Active, late, repaid" height={CHART_H}>
          <LoanPortfolioStackedChart data={loanPortfolioData} />
        </ChartCard>
        <ChartCard title="M-Pesa Activity" description="Success / failed / pending" height={CHART_H}>
          <MpesaTrendsChart data={mpesaTrends} />
        </ChartCard>
      </div>
    </div>
  )
}
