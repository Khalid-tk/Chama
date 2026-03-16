import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, Search, Filter } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { StatCard } from '../../components/ui/StatCard'
import {
  TableShell,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../../components/ui/TableShell'
import { formatKES, formatDateShort } from '../../lib/format'
import { useChamaId } from '../../hooks/useChamaId'
import { chamaRoute } from '../../lib/api'
import api from '../../lib/api'
import { ChartCard } from '../../components/charts/ChartCard'
import { TransactionDistributionChart } from '../../components/charts/TransactionDistributionChart'

const ITEMS_PER_PAGE = 10

export function MemberTransactions() {
  const chamaId = useChamaId()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [contributions, setContributions] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])

  useEffect(() => {
    loadTransactions()
  }, [chamaId])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      // Fetch contributions and loans to build transaction list
      const [contributionsRes, loansRes] = await Promise.all([
        api.get(chamaRoute(chamaId, '/my/contributions')).catch(() => ({ data: { data: { data: [] } } })),
        api.get(chamaRoute(chamaId, '/my/loans')).catch(() => ({ data: { data: { data: [] } } })),
      ])
      setContributions(contributionsRes.data.data.data || [])
      setLoans(loansRes.data.data.data || [])
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Build transaction list from contributions, loans, and loan repayments
  const allTransactions = useMemo(() => {
    const txns: any[] = []
    
    // Add contributions as credit transactions
    contributions.forEach((c: any) => {
      txns.push({
        id: `contrib-${c.id}`,
        type: 'credit',
        amount: c.amount,
        desc: `Contribution - ${c.method}`,
        date: c.paidAt || c.createdAt,
      })
    })

    // Add loan disbursements as debit transactions
    loans.forEach((l: any) => {
      txns.push({
        id: `loan-${l.id}`,
        type: 'debit',
        amount: l.totalDue ?? l.principal,
        desc: `Loan - ${l.status}`,
        date: l.approvedAt || l.requestedAt,
      })
      // Add loan repayments as debit transactions (money out)
      const repayments = l.repayments ?? []
      repayments.forEach((r: any) => {
        txns.push({
          id: `repay-${r.id}`,
          type: 'repayment',
          amount: r.amount,
          desc: 'Loan Repayment',
          date: r.paidAt || r.createdAt,
          loanId: l.id,
        })
      })
    })

    return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [contributions, loans])

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      const matchesSearch = t.desc.toLowerCase().includes(search.toLowerCase())
      const matchesType =
        typeFilter === 'all' ||
        t.type === typeFilter ||
        (typeFilter === 'debit' && t.type === 'repayment') // repayments show with debits
      return matchesSearch && matchesType
    })
  }, [allTransactions, search, typeFilter])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const credits = allTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)
    const debits = allTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)
    const repayments = allTransactions.filter(t => t.type === 'repayment').reduce((sum, t) => sum + t.amount, 0)
    return {
      totalCredits: credits,
      totalDebits: debits + repayments,
      netBalance: credits - debits - repayments,
      transactionCount: allTransactions.length,
    }
  }, [allTransactions])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Transactions</h1>
          <p className="text-sm text-ink-500">View your transaction history</p>
        </div>
        <div className="text-center py-12 text-ink-500">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-ink-900 truncate">Transactions</h1>
        <p className="text-sm text-ink-500">View your transaction history</p>
      </div>

      {/* Stats Cards - full row each on mobile like admin dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
        <StatCard
          icon={TrendingUp}
          label="Total Credits"
          value={formatKES(stats.totalCredits)}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Debits"
          value={formatKES(stats.totalDebits)}
        />
        <StatCard
          icon={TrendingUp}
          label="Net Balance"
          value={formatKES(stats.netBalance)}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Transactions"
          value={stats.transactionCount}
        />
      </div>

      {/* Chart */}
      {allTransactions.length > 0 && (
        <ChartCard title="Transaction Distribution" description="Your spending breakdown by category">
          <TransactionDistributionChart transactions={allTransactions.map(t => ({ ...t, desc: t.desc }))} />
        </ChartCard>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center min-w-0">
            <div className="flex-1 min-w-0 max-w-full sm:max-w-xs">
              <Input
                placeholder="Search transactions..."
                icon={<Search size={18} />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-ink-500" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="rounded-lg border border-ink-300 bg-warm-card px-4 py-2 text-sm text-ink-700 focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20"
              >
                <option value="all">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits & Repayments</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-ink-900">Transaction History</h2>
          <p className="text-sm text-ink-500">Your recent transactions</p>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          {/* Mobile: card list */}
          <div className="space-y-3 p-4 lg:hidden min-w-0">
            {paginated.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">No transactions found.</p>
            ) : (
              paginated.map((t) => (
                <div key={t.id} className="rounded-lg border border-ink-300 bg-warm-bg/50 p-4">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-medium text-ink-900 text-sm line-clamp-2">{t.desc}</p>
                    <span
                      className={`text-right font-semibold shrink-0 amount-cell ${
                        t.type === 'credit' ? 'text-emerald-600' : t.type === 'repayment' ? 'text-amber-600' : 'text-ink-900'
                      }`}
                    >
                      {t.type === 'credit' ? '+' : '-'}
                      {formatKES(t.amount)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-ink-500">{formatDateShort(t.date)}</span>
                    <Badge variant={t.type === 'credit' ? 'success' : t.type === 'repayment' ? 'warning' : 'neutral'}>
                      {t.type === 'repayment' ? 'Repayment' : t.type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop: table */}
          <div className="max-h-[600px] overflow-auto hidden lg:block">
            <TableShell>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableEmpty colSpan={4} message="No transactions found." />
                ) : (
                  paginated.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDateShort(t.date)}</TableCell>
                      <TableCell className="font-medium">{t.desc}</TableCell>
                      <TableCell
                        className={`text-right font-semibold amount-cell ${
                          t.type === 'credit' ? 'text-emerald-600' : t.type === 'repayment' ? 'text-amber-600' : 'text-ink-900'
                        }`}
                      >
                        {t.type === 'credit' ? '+' : '-'}
                        {formatKES(t.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.type === 'credit' ? 'success' : t.type === 'repayment' ? 'warning' : 'neutral'}>
                          {t.type === 'repayment' ? 'Repayment' : t.type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </TableShell>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-ink-200 px-4 sm:px-6 py-4">
              <div className="text-sm text-ink-700">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} transactions
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-ink-300 bg-warm-card px-4 py-2 text-sm text-ink-700 hover:bg-warm-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-ink-300 bg-warm-card px-4 py-2 text-sm text-ink-700 hover:bg-warm-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
