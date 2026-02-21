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
import api, { chamaRoute } from '../../lib/api'

const ITEMS_PER_PAGE = 10

export function AdminTransactions() {
  const chamaId = useChamaId()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [contributions, setContributions] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [contributionsRes, loansRes] = await Promise.all([
          api.get(chamaRoute(chamaId, '/contributions'), { params: { limit: 500 } }).catch(() => ({ data: { data: { data: [] } } })),
          api.get(chamaRoute(chamaId, '/loans'), { params: { limit: 500 } }).catch(() => ({ data: { data: { data: [] } } })),
        ])
        setContributions(contributionsRes.data?.data?.data ?? [])
        setLoans(loansRes.data?.data?.data ?? [])
      } catch (e) {
        console.error('Failed to load transactions:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [chamaId])

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
          desc: 'Loan Disbursement',
          amount: l.principal ?? l.totalDue,
          type: 'debit',
          member: l.user?.fullName,
        })
      })
    return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [contributions, loans])

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      const matchesSearch = t.desc.toLowerCase().includes(search.toLowerCase()) || (t.member?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchesType = typeFilter === 'all' || t.type === typeFilter
      const matchesMember = memberFilter === 'all' || t.member === memberFilter
      return matchesSearch && matchesType && matchesMember
    })
  }, [allTransactions, search, typeFilter, memberFilter])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const credits = allTransactions.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)
    const debits = allTransactions.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)
    return {
      totalCredits: credits,
      totalDebits: debits,
      netBalance: credits - debits,
      transactionCount: allTransactions.length,
    }
  }, [allTransactions])

  const uniqueMembers = useMemo(() => {
    return Array.from(new Set(allTransactions.map((t) => t.member).filter(Boolean))) as string[]
  }, [allTransactions])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <p className="text-slate-600">Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Transactions</h1>
        <p className="text-sm text-slate-500">View all chama transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <select
                value={memberFilter}
                onChange={(e) => {
                  setMemberFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Members</option>
                {uniqueMembers.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">All Transactions</h2>
          <p className="text-sm text-slate-500">Complete transaction history</p>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          <div className="max-h-[600px] overflow-auto">
            <TableShell>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableEmpty colSpan={5} message="No transactions found." />
                ) : (
                  paginated.map((t, idx) => (
                    <TableRow key={t.id || idx}>
                      <TableCell>{formatDateShort(t.date)}</TableCell>
                      <TableCell className="font-medium">{t.member || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{t.desc}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
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
