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
import { formatKES, formatDateShort, statusChipColor } from '../../lib/format'
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

  // Build transaction list from contributions and loans
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

    // Add loans as debit transactions
    loans.forEach((l: any) => {
      txns.push({
        id: `loan-${l.id}`,
        type: 'debit',
        amount: l.totalDue,
        desc: `Loan - ${l.status}`,
        date: l.requestedAt,
      })
    })

    return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [contributions, loans])

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      const matchesSearch = t.desc.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || t.type === typeFilter
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
    return {
      totalCredits: credits,
      totalDebits: debits,
      netBalance: credits - debits,
      transactionCount: allTransactions.length,
    }
  }, [allTransactions])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Transactions</h1>
          <p className="text-sm text-slate-500">View your transaction history</p>
        </div>
        <div className="text-center py-12 text-slate-500">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Transactions</h1>
        <p className="text-sm text-slate-500">View your transaction history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 max-w-xs">
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
              <Filter size={18} className="text-slate-500" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Transaction History</h2>
          <p className="text-sm text-slate-500">Your recent transactions</p>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          {/* Mobile: card list */}
          <div className="space-y-3 p-4 lg:hidden">
            {paginated.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No transactions found.</p>
            ) : (
              paginated.map((t) => (
                <div key={t.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-medium text-slate-800 text-sm line-clamp-2">{t.desc}</p>
                    <span
                      className={`text-right font-semibold shrink-0 amount-cell ${
                        t.type === 'credit' ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {t.type === 'credit' ? '+' : '-'}
                      {formatKES(t.amount)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">{formatDateShort(t.date)}</span>
                    <Badge variant={t.type === 'credit' ? 'success' : 'neutral'}>{t.type}</Badge>
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
                          t.type === 'credit' ? 'text-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        {t.type === 'credit' ? '+' : '-'}
                        {formatKES(t.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.type === 'credit' ? 'success' : 'neutral'}>
                          {t.type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </TableShell>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <div className="text-sm text-slate-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} transactions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
