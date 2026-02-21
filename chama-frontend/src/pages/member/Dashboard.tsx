import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  CreditCard,
  Calendar,
  TrendingUp,
  Smartphone,
  Award,
  Plus,
  FileText,
} from 'lucide-react'
import { formatKES, formatDateShort } from '../../lib/format'
import { useAuthStore } from '../../store/authStore'
import { useChamaId } from '../../hooks/useChamaId'
import { chamaRoute } from '../../lib/api'
import api from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
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
  const { user } = useAuthStore()
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
      type: t.type,
      amount: t.amount,
      date: t.createdAt,
      description: t.description,
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
            <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
            <p className="text-sm text-slate-500">Your Chama overview and insights</p>
          </div>
        </div>
        <div className="text-center py-12 text-slate-500">Loading dashboard data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Your Chama overview and insights</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/member/${chamaId}/mpesa`)}>
            <Plus size={18} />
            Pay Contribution
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/member/${chamaId}/loans`)}>
            <CreditCard size={18} />
            Request Loan
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/member/${chamaId}/analytics`)}>
            <FileText size={18} />
            View Statement
          </Button>
        </div>
      </div>

      {/* KPI Row 1 - Balance, This Month, Active Loan */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Current Balance"
          value={formatKES(kpis.totalBalance)}
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={
            <div>
              <div>{formatKES(kpis.thisMonthContributions)}</div>
              <div className="text-xs text-slate-500">{kpis.thisMonthCount} contribution{kpis.thisMonthCount !== 1 ? 's' : ''}</div>
            </div>
          }
        />
        <StatCard
          icon={CreditCard}
          label="Active Loan"
          value={
            activeLoan ? (
              <div>
                <div>{formatKES(kpis.loanBalance)}</div>
                <div className="text-xs text-slate-500">Due: {formatDateShort(kpis.nextDue)}</div>
              </div>
            ) : (
              <span className="text-slate-500">None</span>
            )
          }
        />
      </div>

      {/* KPI Row 2 - Repayment, Mpesa, Consistency */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Calendar}
          label="Repayment Progress"
          value={
            activeLoan ? (
              <div>
                <div>{kpis.loanProgress}%</div>
                <div className="text-xs text-slate-500">Complete</div>
              </div>
            ) : (
              <span className="text-slate-500">N/A</span>
            )
          }
        />
        <StatCard
          icon={Smartphone}
          label="Mpesa This Month"
          value={
            <div>
              <div>{formatKES(kpis.thisMonthMpesaTotal)}</div>
              <div className="text-xs text-slate-500">{kpis.mpesaSuccessRate.toFixed(0)}% success</div>
            </div>
          }
        />
        <StatCard
          icon={Award}
          label="Consistency Score"
          value={
            <div>
              <div>{kpis.consistencyScore}/100</div>
              <div className="text-xs text-slate-500">
                {kpis.consistencyScore >= 80 ? 'Excellent' : kpis.consistencyScore >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          }
        />
      </div>

      {/* Chart Grid - 5+ Charts (single column on small, 2 on lg+) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
