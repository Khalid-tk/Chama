import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Plus,
} from 'lucide-react'
import { formatKES, formatDateShort } from '../../lib/format'
import { useChamaId } from '../../hooks/useChamaId'
import { chamaRoute } from '../../lib/api'
import api from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { ChartCard } from '../../components/charts/ChartCard'
import { ContributionsTrendChart } from '../../components/charts/ContributionsTrendChart'
import { ContributionConsistencyChart } from '../../components/charts/ContributionConsistencyChart'
import { TransactionDistributionChart } from '../../components/charts/TransactionDistributionChart'
import { LoanRepaymentChart } from '../../components/charts/LoanRepaymentChart'
import { SavingsProgressChart } from '../../components/charts/SavingsProgressChart'

const CHART_H = 168

export function MemberDashboard() {
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
      const [contributionsRes, loansRes, paymentsRes] = await Promise.all([
        api.get(chamaRoute(chamaId, '/my/contributions')).catch(() => ({ data: { data: { data: [] } } })),
        api.get(chamaRoute(chamaId, '/my/loans')).catch(() => ({ data: { data: { data: [] } } })),
        api.get(chamaRoute(chamaId, '/my/mpesa')).catch(() => ({ data: { data: { data: [] } } })),
      ])

      setContributions(contributionsRes.data.data.data || [])
      setLoans(loansRes.data.data.data || [])
      setPayments(paymentsRes.data.data.data || [])

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

  const kpis = useMemo(() => {
    const totalContributions = memberContributions.reduce((sum, c) => sum + c.amount, 0)
    const active = memberLoans.find((l) => l.status === 'Active')
    const loanBalance = active ? active.amount : 0

    const nextDue = new Date()
    nextDue.setDate(nextDue.getDate() + 15)

    const now = new Date()
    const thisMonthContributions = memberContributions.filter((c) => {
      const date = new Date(c.date)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    const thisMonthTotal = thisMonthContributions.reduce((sum, c) => sum + c.amount, 0)
    const thisMonthCount = thisMonthContributions.length

    const paid = active?.repayments
      ? (active.repayments as any[]).reduce((s, r) => s + Number(r.amount || 0), 0)
      : 0
    const owed = active ? Number(active.amount) : 0
    const loanProgress = owed > 0 ? Math.round((paid / owed) * 100) : 0

    const pendingLoanCount = memberLoans.filter((l) => l.status === 'Pending').length

    return {
      totalBalance: totalContributions - loanBalance,
      totalContributionsAll: totalContributions,
      thisMonthContributions: thisMonthTotal,
      thisMonthCount,
      loanBalance: active ? active.amount : 0,
      nextDue: nextDue.toISOString().split('T')[0],
      loanProgress,
      pendingLoanCount,
    }
  }, [memberContributions, memberLoans, memberPayments])

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

  const contributionConsistency = useMemo(() => {
    const grouped: Record<string, { amount: number; missed: boolean }> = {}
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      grouped[month] = { amount: 0, missed: true }
    }

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

  const activeLoan = useMemo(() => memberLoans.find((l) => l.status === 'Active'), [memberLoans])

  const totalPaid = useMemo(() => {
    if (!activeLoan?.repayments) return 0
    return (activeLoan.repayments as any[]).reduce((sum, r) => sum + Number(r.amount || 0), 0)
  }, [activeLoan])
  const totalOwed = activeLoan ? activeLoan.amount : 0

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink-900">Dashboard</h1>
            <p className="text-xs text-ink-500">Your Chama overview</p>
          </div>
        </div>
        <div className="flex min-h-[32vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-brown" />
            <p className="text-sm text-ink-500">Loading dashboard…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 min-w-0 w-full max-w-full overflow-x-hidden xl:max-h-[calc(100vh-7.5rem)] xl:overflow-y-auto page-enter">

      {/* 1. Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ink-900 truncate">Dashboard</h1>
          <p className="text-xs text-ink-500">Your Chama overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <Button size="sm" onClick={() => navigate(`/member/${chamaId}/mpesa`)}>
            <Plus size={15} />
            Pay Contribution
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/member/${chamaId}/loans`)}>
            <CreditCard size={15} />
            Request Loan
          </Button>
        </div>
      </div>

      {/* 2. Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5 [&>*]:min-w-0 shrink-0">
        {[
          { label: 'Available Balance', value: formatKES(kpis.totalBalance), sub: 'Net position' },
          { label: 'Total Contributions', value: formatKES(kpis.totalContributionsAll), sub: 'All time' },
          { label: 'This Month', value: formatKES(kpis.thisMonthContributions), sub: `${kpis.thisMonthCount} payment${kpis.thisMonthCount !== 1 ? 's' : ''}` },
          { label: 'Pending Loans', value: kpis.pendingLoanCount, sub: 'Awaiting review' },
          {
            label: 'Active Loan',
            value: activeLoan ? formatKES(kpis.loanBalance) : 'None',
            sub: activeLoan ? `Due ${formatDateShort(kpis.nextDue)} · ${kpis.loanProgress}% repaid` : '—',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-ink-300 bg-warm-card px-3 py-2.5 min-w-0"
            style={{ boxShadow: 'var(--shadow-xs)' }}
          >
            <p className="text-ink-400 mb-0.5" style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {k.label}
            </p>
            <p className="text-lg font-bold text-ink-900 break-words leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
              {k.value}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-500 line-clamp-2">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* 3. Charts */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 [&>*]:min-w-0">
        <ChartCard title="Contribution Trends" description="Last 6 months" height={CHART_H}>
          <ContributionsTrendChart data={contributionsTrend} />
        </ChartCard>
        <ChartCard title="Monthly Activity" description="Consistency by month" height={CHART_H}>
          <ContributionConsistencyChart data={contributionConsistency} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 [&>*]:min-w-0">
        <ChartCard title="Transaction Distribution" description="By category" height={CHART_H}>
          <TransactionDistributionChart transactions={memberTransactions} />
        </ChartCard>
        {activeLoan ? (
          <ChartCard title="Loan Repayment" description="Progress toward settlement" height={CHART_H}>
            <LoanRepaymentChart paid={totalPaid} total={totalOwed} />
          </ChartCard>
        ) : (
          <ChartCard title="Savings Progress" description="Cumulative contributions" height={CHART_H}>
            <SavingsProgressChart totalContributions={kpis.totalBalance} />
          </ChartCard>
        )}
      </div>
    </div>
  )
}
