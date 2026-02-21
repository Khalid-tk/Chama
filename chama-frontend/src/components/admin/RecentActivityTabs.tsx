import { useState } from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import {
  TableShell,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/TableShell'
import { formatKES, formatDateShort, statusChipColor } from '../../lib/format'
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

type ActivityTab = 'transactions' | 'loans' | 'mpesa'

type RecentActivityTabsProps = {
  transactions: Array<{ id: string; date: string; desc: string; amount: number; type: string; member?: string }>
  loans: Array<{ id: string; date: string; member: string; amount: number; status: string }>
  mpesaPayments: Array<{ id: string; date: string; phoneNumber: string; amount: number; status: string; description?: string }>
  onRefresh?: () => void
}

export function RecentActivityTabs({ transactions, loans, mpesaPayments, onRefresh }: RecentActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('transactions')
  const [collapsed, setCollapsed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const recentTransactions = transactions.slice(0, 8)
  const recentLoans = loans.slice(0, 8)
  const recentPayments = mpesaPayments.slice(0, 8)

  const handleRefresh = async () => {
    if (!onRefresh) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex flex-1 items-center gap-2 text-left"
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />
            ) : (
              <ChevronUp className="h-5 w-5 text-slate-500 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800">Recent Activity</h3>
              <p className="text-sm text-slate-500">Latest transactions, loans, and payments</p>
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                title="Refresh data"
                aria-label="Refresh"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
            )}
            {(['transactions', 'loans', 'mpesa'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setCollapsed(false)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      {!collapsed && (
      <CardContent className="overflow-hidden p-0">
        <div className="max-h-80 overflow-auto">
          {activeTab === 'transactions' && (
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
                {recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDateShort(t.date)}</TableCell>
                    <TableCell className="font-medium">{(t as any).member || 'N/A'}</TableCell>
                    <TableCell>{t.desc}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
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
                ))}
              </TableBody>
            </TableShell>
          )}

          {activeTab === 'loans' && (
            <TableShell>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLoans.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{formatDateShort(l.date)}</TableCell>
                    <TableCell className="font-medium">{l.member}</TableCell>
                    <TableCell className="text-right font-semibold">{formatKES(l.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusChipColor(l.status)}>{l.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableShell>
          )}

          {activeTab === 'mpesa' && (
            <TableShell>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDateShort(p.date)}</TableCell>
                    <TableCell>{p.phoneNumber}</TableCell>
                    <TableCell className="text-right font-semibold">{formatKES(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusChipColor(p.status)}>{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableShell>
          )}
        </div>
      </CardContent>
      )}
    </Card>
  )
}
