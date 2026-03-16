import { useState } from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { formatKES, formatDateShort } from '../../lib/format'
import { Badge } from '../ui/Badge'
import {
  TableShell,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../ui/TableShell'

type Transaction = {
  id: string
  date: string
  desc: string
  amount: number
  type: 'credit' | 'debit'
}

type Contribution = {
  id: string
  date: string
  amount: number
  status: string
}

type MpesaPayment = {
  id: string
  date: string
  amount: number
  status: string
  description?: string
}

type MemberRecentActivityTabsProps = {
  transactions: Transaction[]
  contributions: Contribution[]
  mpesaPayments: MpesaPayment[]
}

export function MemberRecentActivityTabs({
  transactions,
  contributions,
  mpesaPayments,
}: MemberRecentActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<'transactions' | 'contributions' | 'mpesa'>('transactions')

  const displayItems = {
    transactions: transactions.slice(0, 8),
    contributions: contributions.slice(0, 8),
    mpesa: mpesaPayments.slice(0, 8),
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <div className="min-w-0">
            <h2 className="font-semibold text-ink-900 truncate">Recent Activity</h2>
            <p className="text-sm text-ink-500 truncate">Your latest activity across all categories</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {(['transactions', 'contributions', 'mpesa'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-brown text-white shadow-md'
                    : 'bg-warm-card border border-ink-300 text-ink-700 hover:bg-warm-bg'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden p-0">
        <div className="max-h-80 overflow-auto">
          {activeTab === 'transactions' && (
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
                {displayItems.transactions.length === 0 ? (
                  <TableEmpty colSpan={4}>No recent transactions</TableEmpty>
                ) : (
                  displayItems.transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{formatDateShort(t.date)}</TableCell>
                      <TableCell className="text-sm">{t.desc}</TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          t.type === 'credit' ? 'text-emerald-600' : 'text-ink-900'
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
          )}

          {activeTab === 'contributions' && (
            <TableShell>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.contributions.length === 0 ? (
                  <TableEmpty colSpan={3}>No recent contributions</TableEmpty>
                ) : (
                  displayItems.contributions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{formatDateShort(c.date)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatKES(c.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'Paid' ? 'success' : 'warning'}>
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </TableShell>
          )}

          {activeTab === 'mpesa' && (
            <TableShell>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.mpesa.length === 0 ? (
                  <TableEmpty colSpan={3}>No recent Mpesa payments</TableEmpty>
                ) : (
                  displayItems.mpesa.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{formatDateShort(p.date)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatKES(p.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === 'success'
                              ? 'success'
                              : p.status === 'failed'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </TableShell>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
