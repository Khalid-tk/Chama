import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Plus,
} from 'lucide-react'
import { formatKES, formatDateShort } from '../../lib/format'
import { useAuthStore } from '../../store/authStore'
import { useChamaId } from '../../hooks/useChamaId'
import { chamaRoute } from '../../lib/api'
import api from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { ChartCard } from '../../components/charts/ChartCard'
import { ContributionsTrendChart } from '../../components/charts/ContributionsTrendChart'
import { ContributionConsistencyChart } from '../../components/charts/ContributionConsistencyChart'
import { TransactionDistributionChart } from '../../components/charts/TransactionDistributionChart'
import { LoanRepaymentChart } from '../../components/charts/LoanRepaymentChart'
import { MemberMpesaTrendChart } from '../../components/charts/MemberMpesaTrendChart'
import { SavingsProgressChart } from '../../components/charts/SavingsProgressChart'
import { MemberRecentActivityTabs } from '../../components/member/MemberRecentActivityTabs'
import { InsightsPanel } from '../../components/member/InsightsPanel'
import { ChamaHealthWidget } from '../../components/member/ChamaHealthWidget'
import { generateMemberInsights } from '../../utils/memberInsights'

export function MemberDashboard() {
  useAuthStore()
  const chamaId = useChamaId()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [contributions, setContributions] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [chamaId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch real data from API
      const [contributionsRes, loansRes, paymentsRes] = await Promise.all([
        api.get(chamaRoute(chamaId, '/my/contributions')).catch(() => ({ data: { data: { data: [] } } })),
        api.get(chamaRoute(chamaId, '/my/loans')).catch(() => ({ data: { data: { data: [] } } })),
        api.get(chamaRoute(chamaId, '/my/mpesa')).catch(() => ({ data: { data: { data: [] } } })),
      ])

      setContributions(contributionsRes.data.data.data || [])
      setLoans(loansRes.data.data.data || [])
      setPayments(paymentsRes.data.data.data || [])
      
      // Transactions can be derived from contributions and loans for now
      // In the future, add a dedicated transactions endpoint
      const allTransactions = [
        ...(contributionsRes.data.data.data || []).map((c: any) => ({
          id: c.id,
          type: 'CONTRIBUTION',
          amount: c.amount,
          direction: 'IN',
          description: `Contribution - ${c.method}`,
          createdAt: c.paidAt || c.createdAt,
        })),
      ]
      setTransactions(allTransactions)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Use real data, fallback to empty arrays if loading
  const memberContributions = useMemo(() => {
    if (loading) return []
    return contributions.map((c: any) => ({
      id: c.id,
      amount: c.amount,
      date: c.paidAt || c.createdAt,
      method: c.method,
      status: c.status ?? 'Paid',
    }))
  }, [contributions, loading])

  const memberLoans = useMemo(() => {
    if (loading) return []
    return loans.map((l: any) => ({
      id: l.id,
      amount: l.totalDue,
      date: l.requestedAt,
      status: l.status === 'ACTIVE' ? 'Active' : l.status === 'PAID' ? 'Paid' : l.status === 'PENDING' ? 'Pending' : l.status,
      repayments: l.repayments ?? [],
    }))
  }, [loans, loading])

  const memberTransactions = useMemo(() => {
    if (loading) return []
    return transactions.map((t: any) => ({
      id: t.id,
      type: t.direction === 'IN' ? 'credit' as const : 'debit' as const,
      amount: t.amount,
      date: t.createdAt,
      desc: t.desc ?? t.description ?? '',
    }))
  }, [transactions, loading])

  const memberPayments = useMemo(() => {
    if (loading) return []
    return payments.map((p: any) => ({
      id: p.id,
      phoneNumber: p.phone,
      amount: p.amount,
      date: p.createdAt,
      status: p.status.toLowerCase(),
      description: `${p.purpose} - ${p.phone}`,
    }))
  }, [payments, loading])

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalContributions = memberContributions.reduce((sum, c) => sum + c.amount, 0)
    const active = memberLoans.find((l) => l.status === 'Active')
    const loanBalance = active ? active.amount : 0

    // Next due date (simplified: 15 days from now)
    const nextDue = new Date()
    nextDue.setDate(nextDue.getDate() + 15)

    // This month contributions
    const now = new Date()
    const thisMonthContributions = memberContributions.filter((c) => {
      const date = new Date(c.date)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    const thisMonthTotal = thisMonthContributions.reduce((sum, c) => sum + c.amount, 0)
    const thisMonthCount = thisMonthContributions.length

    // Loan repayment progress (from actual repayments)
    const paid = active?.repayments
      ? (active.repayments as any[]).reduce((s, r) => s + Number(r.amount || 0), 0)
      : 0
    const owed = active ? Number(active.amount) : 0
    const loanProgress = owed > 0 ? Math.round((paid / owed) * 100) : 0

    // Mpesa payments this month
    const thisMonthPayments = memberPayments.filter(p => {
      const date = new Date(p.date)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    const thisMonthMpesaTotal = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0)
    const successfulPayments = thisMonthPayments.filter(p => p.status === 'success').length
    const mpesaSuccessRate = thisMonthPayments.length > 0 ? (successfulPayments / thisMonthPayments.length) * 100 : 0

    // Member consistency score (0-100)
    const consistencyScore = computeConsistencyScore(memberContributions)

    return {
      totalBalance: totalContributions - loanBalance, // Simplified savings
      thisMonthContributions: thisMonthTotal,
      thisMonthCount,
      loanBalance: active ? active.amount : 0,
      nextDue: nextDue.toISOString().split('T')[0],
      loanProgress,
      thisMonthMpesaTotal,
      mpesaSuccessRate,
      consistencyScore,
    }
  }, [memberContributions, memberLoans, memberPayments])

  // Chart data: Contributions Trend
  const contributionsTrend = useMemo(() => {
    const grouped: Record<string, number> = {}
    memberContributions.forEach((c) => {
      const date = new Date(c.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      grouped[monthKey] = (grouped[monthKey] || 0) + c.amount
    })
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([monthKey, amount]) => ({ date: monthKey, amount }))
  }, [memberContributions])

  // Chart data: Contribution Consistency
  const contributionConsistency = useMemo(() => {
    const grouped: Record<string, { amount: number; missed: boolean }> = {}
    const now = new Date()
    
    // Build last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      grouped[month] = { amount: 0, missed: true }
    }

    // Fill in actual contributions
    memberContributions.forEach((c) => {
      const month = new Date(c.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (grouped[month]) {
        grouped[month].amount += c.amount
        grouped[month].missed = false
      }
    })

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([month, data]) => ({ month, ...data }))
  }, [memberContributions])

  // Chart data: Mpesa Trends
  const mpesaTrends = useMemo(() => {
    const grouped: Record<string, { success: number; failed: number; pending: number }> = {}
    memberPayments.forEach((p) => {
      const date = new Date(p.date).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = { success: 0, failed: 0, pending: 0 }
      }
      if (p.status === 'success') grouped[date].success++
      else if (p.status === 'failed') grouped[date].failed++
      else grouped[date].pending++
    })

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...data,
      }))
  }, [memberPayments])

  // Loan repayment data (from API repayments)
  const activeLoan = useMemo(() => {
    return memberLoans.find((l) => l.status === 'Active')
  }, [memberLoans])

  const totalPaid = useMemo(() => {
    if (!activeLoan?.repayments) return 0
    return (activeLoan.repayments as any[]).reduce((sum, r) => sum + Number(r.amount || 0), 0)
  }, [activeLoan])
  const totalOwed = activeLoan ? activeLoan.amount : 0

  // Generate insights
  const insights = useMemo(() => {
    return generateMemberInsights({
      contributions: memberContributions,
      loans: memberLoans,
      transactions: memberTransactions,
      mpesaPayments: memberPayments,
    })
  }, [memberContributions, memberLoans, memberTransactions, memberPayments])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">Dashboard</h1>
            <p className="text-sm text-ink-500">Your Chama overview and insights</p>
          </div>
        </div>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-ink-300 border-t-blue-600" />
            <p className="text-ink-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 min-w-0 w-full max-w-full overflow-x-hidden page-enter">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-ink-900 sm:text-2xl lg:text-3xl truncate">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">Your Chama overview and insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button onClick={() => navigate(`/member/${chamaId}/mpesa`)}>
            <Plus size={18} />
            Pay Contribution
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/member/${chamaId}/loans`)}>
            <CreditCard size={18} />
            Request Loan
          </Button>
        </div>
      </div>

      {/* Hero KPI section */}
      <div className="rounded-2xl border border-ink-300/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Your Balance</p>
          <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{formatKES(kpis.totalBalance)}</p>
          <p className="text-sm text-ink-400">Personal savings in this Chama</p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-ink-400">This Month</p>
            <p className="font-display mt-1 text-lg font-bold">{formatKES(kpis.thisMonthContributions)}</p>
            <p className="text-xs text-ink-400">{kpis.thisMonthCount} contribution{kpis.thisMonthCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-ink-400">Active Loan</p>
            <p className="font-display mt-1 text-lg font-bold">{activeLoan ? formatKES(kpis.loanBalance) : 'None'}</p>
            {activeLoan && <p className="text-xs text-ink-400">Due {formatDateShort(kpis.nextDue)}</p>}
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-ink-400">Repayment</p>
            <p className="font-display mt-1 text-lg font-bold">{activeLoan ? `${kpis.loanProgress}%` : 'N/A'}</p>
            <p className="text-xs text-ink-400">{activeLoan ? 'Complete' : '—'}</p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-ink-400">Mpesa</p>
            <p className="font-display mt-1 text-lg font-bold">{formatKES(kpis.thisMonthMpesaTotal)}</p>
            <p className="text-xs text-ink-400">{kpis.mpesaSuccessRate.toFixed(0)}% success</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-xl bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-ink-400">Consistency</p>
            <p className="font-display mt-1 text-lg font-bold">{kpis.consistencyScore}/100</p>
            <p className="text-xs text-ink-400">
              {kpis.consistencyScore >= 80 ? 'Excellent' : kpis.consistencyScore >= 60 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Grid - featured first, then rest */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <ChartCard title="Contributions Trend" description="Your contributions over the last 6 months">
          <ContributionsTrendChart data={contributionsTrend} />
        </ChartCard>

        <ChartCard title="Contribution Consistency" description="Monthly contributions (red = missed)">
          <ContributionConsistencyChart data={contributionConsistency} />
        </ChartCard>

        <ChartCard title="Transaction Distribution" description="Your spending breakdown by category">
          <TransactionDistributionChart transactions={memberTransactions} />
        </ChartCard>

        {activeLoan ? (
          <ChartCard title="Loan Repayment Progress" description="Your active loan repayment status">
            <LoanRepaymentChart paid={totalPaid} total={totalOwed} />
          </ChartCard>
        ) : (
          <ChartCard title="Savings Progress" description="Your savings growth">
            <SavingsProgressChart totalContributions={kpis.totalBalance} />
          </ChartCard>
        )}

        {mpesaTrends.length > 0 && (
          <ChartCard title="Mpesa Payments Trend" description="Success/failed/pending over time">
            <MemberMpesaTrendChart data={mpesaTrends} />
          </ChartCard>
        )}

        <ChartCard title="Savings Overview" description="Your total savings progress">
          <SavingsProgressChart totalContributions={kpis.totalBalance} />
        </ChartCard>
      </div>

      {/* Chama Health Widget + Insights + Recent Activity (stack on small screens) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div>
          <ChamaHealthWidget />
        </div>
        <div>
          <InsightsPanel insights={insights} />
        </div>
        <div>
          <MemberRecentActivityTabs
            transactions={memberTransactions}
            contributions={memberContributions}
            mpesaPayments={memberPayments}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Compute member consistency score (0-100) based on contribution regularity
 */
function computeConsistencyScore(contributions: Array<{ date: string; amount: number }>): number {
  if (contributions.length === 0) return 0

  // Group by month
  const monthlyContribs: Record<string, number> = {}
  contributions.forEach((c) => {
    const month = new Date(c.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthlyContribs[month] = (monthlyContribs[month] || 0) + 1
  })

  const months = Object.keys(monthlyContribs).length
  if (months === 0) return 0

  // Calculate consistency: expected 1 contribution per month
  const avgPerMonth = contributions.length / months
  const consistency = Math.min(100, Math.round((avgPerMonth / 1) * 100))

  // Bonus for consecutive months
  const sortedMonths = Object.keys(monthlyContribs).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )
  let streak = 0
  for (const month of sortedMonths) {
    if (monthlyContribs[month] > 0) {
      streak++
    } else {
      break
    }
  }

  // Add streak bonus (max 10 points)
  const streakBonus = Math.min(10, streak * 2)

  return Math.min(100, consistency + streakBonus)
}
