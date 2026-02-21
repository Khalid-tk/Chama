import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, Smartphone, Banknote } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
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
import { useToast } from '../../hooks/useToast'
import api, { chamaRoute } from '../../lib/api'
import { ChartCard } from '../../components/charts/ChartCard'
import { LoanRepaymentChart } from '../../components/charts/LoanRepaymentChart'

const ITEMS_PER_PAGE = 10

export function MemberLoans() {
  const chamaId = useChamaId()
  const { showToast, ToastContainer } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loans, setLoans] = useState<any[]>([])
  const navigate = useNavigate()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestPrincipal, setRequestPrincipal] = useState('')
  const [requestDueDate, setRequestDueDate] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [showRecordRepayModal, setShowRecordRepayModal] = useState(false)
  const [recordAmount, setRecordAmount] = useState('')
  const [recordMethod, setRecordMethod] = useState<'CASH' | 'BANK' | 'MPESA' | 'OTHER'>('CASH')
  const [recordReference, setRecordReference] = useState('')
  const [recordLoading, setRecordLoading] = useState(false)

  useEffect(() => {
    loadLoans()
  }, [chamaId])

  const loadLoans = async () => {
    try {
      setLoading(true)
      const response = await api.get(chamaRoute(chamaId, '/my/loans'))
      const raw = response.data.data
      setLoans(raw?.data ?? raw ?? [])
    } catch (error) {
      console.error('Failed to load loans:', error)
    } finally {
      setLoading(false)
    }
  }

  // Map API data to expected format
  const memberLoans = useMemo(() => {
    return loans.map((l: any) => ({
      id: l.id,
      amount: l.totalDue,
      date: l.createdAt,
      status: l.status === 'ACTIVE' ? 'Active' : l.status === 'PAID' ? 'Paid' : l.status === 'PENDING' ? 'Pending' : l.status === 'APPROVED' ? 'Approved' : l.status,
      principal: l.principal,
      interest: l.interest,
      dueDate: l.dueDate,
    }))
  }, [loans])

  const activeLoan = useMemo(() => {
    const active = memberLoans.find((l) => l.status === 'Active')
    if (active) {
      const raw = loans.find((l: any) => l.id === active.id)
      return { ...active, repayments: raw?.repayments ?? [] }
    }
    return null
  }, [memberLoans, loans])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return memberLoans.slice(start, start + ITEMS_PER_PAGE)
  }, [memberLoans, currentPage])

  const totalPages = Math.ceil(memberLoans.length / ITEMS_PER_PAGE)
  const totalLoanAmount = activeLoan ? activeLoan.amount : 0
  const paidAmount = activeLoan?.repayments?.reduce((s: number, r: any) => s + (r.amount || 0), 0) ?? 0
  const nextDueDate = activeLoan?.dueDate ?? null

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chamaId || !activeLoan) return
    const amount = parseInt(recordAmount, 10)
    if (isNaN(amount) || amount < 1) {
      showToast('Enter a valid amount', 'error')
      return
    }
    setRecordLoading(true)
    try {
      await api.post(chamaRoute(chamaId, `/loans/${activeLoan.id}/repayments`), {
        amount,
        method: recordMethod,
        reference: recordReference || undefined,
      })
      showToast('Repayment recorded', 'success')
      setShowRecordRepayModal(false)
      setRecordAmount('')
      setRecordReference('')
      loadLoans()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to record repayment', 'error')
    } finally {
      setRecordLoading(false)
    }
  }

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chamaId) return
    const principal = parseInt(requestPrincipal, 10)
    if (isNaN(principal) || principal < 1) {
      showToast('Enter a valid amount', 'error')
      return
    }
    setRequestLoading(true)
    try {
      await api.post(chamaRoute(chamaId, '/loans/request'), {
        principal,
        dueDate: requestDueDate ? new Date(requestDueDate).toISOString() : undefined,
      })
      showToast('Loan request submitted', 'success')
      setShowRequestModal(false)
      setRequestPrincipal('')
      setRequestDueDate('')
      loadLoans()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to request loan', 'error')
    } finally {
      setRequestLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">My Loans</h1>
          <p className="text-sm text-slate-500">Track your loan status and repayments</p>
        </div>
        <Button onClick={() => setShowRequestModal(true)}>
          <Plus size={18} />
          Request Loan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="text-sm text-slate-500">Active Loan Balance</div>
            <div className="text-2xl font-bold text-slate-800">{formatKES(totalLoanAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar size={16} />
              Next Payment Due
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {nextDueDate ? formatDateShort(nextDueDate) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-slate-500">Repayment Progress</div>
            <div className="text-2xl font-bold text-slate-800">
              {activeLoan ? `${Math.round((paidAmount / totalLoanAmount) * 100)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {activeLoan && (
        <>
          <ChartCard title="Loan Repayment Progress" description="Your active loan repayment status">
            <LoanRepaymentChart paid={paidAmount} total={totalLoanAmount} />
          </ChartCard>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">Repay this loan</h2>
              <p className="text-sm text-slate-500">Repayments show in Analytics under money loaned and repaid.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Repayment through M-Pesa
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Pay with your M-Pesa number. You will be taken to the M-Pesa page with this loan pre-selected.
                </p>
                <Button
                  onClick={() => navigate(`/member/${chamaId}/mpesa`, { state: { purpose: 'REPAYMENT', loanId: activeLoan.id } })}
                  className="mt-3 gap-2"
                >
                  <Smartphone size={18} />
                  Repay via M-Pesa
                </Button>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-slate-600" />
                  Record payment (Cash / Bank / M-Pesa / Other)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Already paid by cash, bank transfer, or M-Pesa? Record it here so it reflects in your loan balance and analytics.
                </p>
                <Button variant="secondary" onClick={() => setShowRecordRepayModal(true)} className="mt-3 gap-2">
                  <Banknote size={18} />
                  Record payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Loan History</h2>
          <p className="text-sm text-slate-500">Your loan requests and status</p>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          {/* Mobile: card list */}
          <div className="space-y-3 p-4 lg:hidden">
            {paginated.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No loans found.</p>
            ) : (
              paginated.map((l) => (
                <div key={l.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="font-semibold text-slate-800 amount-cell">{formatKES(l.amount)}</p>
                    </div>
                    <Badge variant={statusChipColor(l.status)}>{l.status}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-slate-500">Date: {formatDateShort(l.date)}</span>
                    <span className="text-slate-500 truncate">ID: {String(l.id).slice(0, 8)}…</span>
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
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableEmpty colSpan={4} message="No loans found." />
                ) : (
                  paginated.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium truncate max-w-[120px]">{l.id}</TableCell>
                      <TableCell className="text-right font-semibold amount-cell">{formatKES(l.amount)}</TableCell>
                      <TableCell>{formatDateShort(l.date)}</TableCell>
                      <TableCell>
                        <Badge variant={statusChipColor(l.status)}>
                          {l.status}
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
                {Math.min(currentPage * ITEMS_PER_PAGE, memberLoans.length)} of {memberLoans.length} loans
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showRecordRepayModal && activeLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
            <CardContent className="p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Record repayment</h2>
              <p className="text-sm text-slate-500 mb-4">Outstanding: {formatKES(totalLoanAmount - paidAmount)}</p>
              <form onSubmit={handleRecordRepayment} className="space-y-4">
                <Input
                  label="Amount (KES)"
                  type="number"
                  min="1"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                  required
                  disabled={recordLoading}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Method</label>
                  <select
                    value={recordMethod}
                    onChange={(e) => setRecordMethod(e.target.value as 'CASH' | 'BANK' | 'MPESA' | 'OTHER')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[44px]"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <Input
                  label="Reference (optional)"
                  type="text"
                  placeholder="e.g. receipt number"
                  value={recordReference}
                  onChange={(e) => setRecordReference(e.target.value)}
                  disabled={recordLoading}
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="secondary" onClick={() => setShowRecordRepayModal(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" loading={recordLoading} className="w-full sm:w-auto">Record payment</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
            <CardContent className="p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-800 sm:text-xl">Request Loan</h2>
              <form onSubmit={handleRequestLoan} className="space-y-4">
                <Input
                  label="Amount (KES)"
                  type="number"
                  min="1"
                  value={requestPrincipal}
                  onChange={(e) => setRequestPrincipal(e.target.value)}
                  required
                  disabled={requestLoading}
                />
                <Input
                  label="Due date (optional)"
                  type="date"
                  value={requestDueDate}
                  onChange={(e) => setRequestDueDate(e.target.value)}
                  disabled={requestLoading}
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="secondary" onClick={() => setShowRequestModal(false)} disabled={requestLoading} className="min-h-[44px] w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" loading={requestLoading} className="flex-1 min-h-[44px] w-full sm:w-auto">Submit</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
