import { useState } from 'react'
import { Badge } from '../ui/Badge'
import { TableShell, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/TableShell'
import { formatKES, formatDateShort, statusChipColor } from '../../lib/format'
import { RefreshCw } from 'lucide-react'

type ActivityTab = 'transactions' | 'loans' | 'mpesa'

type RecentActivityTabsProps = {
  transactions: Array<{ id: string; date: string; desc: string; amount: number; type: string; member?: string }>
  loans: Array<{ id: string; date: string; member: string; amount: number; status: string }>
  mpesaPayments: Array<{ id: string; date: string; phoneNumber: string; amount: number; status: string; description?: string }>
  onRefresh?: () => void
  className?: string
}

const TABS: { key: ActivityTab; label: string }[] = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'loans',        label: 'Loans' },
  { key: 'mpesa',        label: 'M-Pesa' },
]

export function RecentActivityTabs({ transactions, loans, mpesaPayments, onRefresh, className = '' }: RecentActivityTabsProps) {
  const [activeTab, setActiveTab]   = useState<ActivityTab>('transactions')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh) return
    setRefreshing(true)
    try { await onRefresh() } finally { setRefreshing(false) }
  }

  return (
    <div className={`flex flex-col rounded-lg border border-ink-300 bg-warm-card overflow-hidden ${className}`} style={{ boxShadow: 'var(--shadow-xs)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-4 py-3">
        <div className="flex gap-1">
          {TABS.map(({ key, label }) => (
            <button key={key} type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === key
                  ? 'bg-warm-sidebar text-white'
                  : 'text-ink-500 hover:bg-warm-deep hover:text-ink-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
        {onRefresh && (
          <button type="button" onClick={handleRefresh} disabled={refreshing}
            className="rounded p-1 text-ink-400 hover:bg-warm-deep hover:text-ink-700 disabled:opacity-40 transition-colors"
            title="Refresh">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        {activeTab === 'transactions' && (
          <TableShell className="rounded-none border-0 shadow-none">
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
              {transactions.slice(0, 8).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-ink-500 whitespace-nowrap">{formatDateShort(t.date)}</TableCell>
                  <TableCell className="font-medium text-ink-900">{(t as any).member || 'N/A'}</TableCell>
                  <TableCell className="text-ink-700">{t.desc}</TableCell>
                  <TableCell className={`text-right font-medium tabular-nums ${t.type === 'credit' ? 'text-emerald-700' : 'text-ink-700'}`}>
                    {t.type === 'credit' ? '+' : '-'}{formatKES(t.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.type === 'credit' ? 'success' : 'neutral'}>{t.type}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableShell>
        )}

        {activeTab === 'loans' && (
          <TableShell className="rounded-none border-0 shadow-none">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.slice(0, 8).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-ink-500 whitespace-nowrap">{formatDateShort(l.date)}</TableCell>
                  <TableCell className="font-medium text-ink-900">{l.member}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-ink-900">{formatKES(l.amount)}</TableCell>
                  <TableCell><Badge variant={statusChipColor(l.status)}>{l.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableShell>
        )}

        {activeTab === 'mpesa' && (
          <TableShell className="rounded-none border-0 shadow-none">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mpesaPayments.slice(0, 8).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-ink-500 whitespace-nowrap">{formatDateShort(p.date)}</TableCell>
                  <TableCell className="text-ink-700">{p.phoneNumber}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-ink-900">{formatKES(p.amount)}</TableCell>
                  <TableCell><Badge variant={statusChipColor(p.status)}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableShell>
        )}
      </div>
    </div>
  )
}
