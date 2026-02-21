import { useState, useMemo, useEffect, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, CheckCircle, XCircle, RefreshCw, Banknote, Sparkles, Smartphone } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import {
  TableShell,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../components/ui/TableShell'
import { AILoanAssessment, type AIEvaluation } from '../components/admin/AILoanAssessment'
import { formatKES, formatDateShort, statusChipColor } from '../lib/format'
import { computeLoanRisk } from '../utils/analytics'
import { useChamaId } from '../hooks/useChamaId'
import { useToast } from '../hooks/useToast'
import api, { chamaRoute } from '../lib/api'

type Tab = 'pending' | 'active' | 'history'

type Loan = {
  id: string
  principal: number
  interest: number
  totalDue: number
  status: string
  dueDate: string | null
  createdAt: string
  approvedAt: string | null
  user?: { id: string; fullName: string; email: string; phone?: string }
  repayments?: { id: string; amount: number; paidAt: string }[]
}

const ITEMS_PER_PAGE = 10

export function Loans() {
  const chamaId = useChamaId()
  const [searchParams] = useSearchParams()
  const userIdFromUrl = searchParams.get('userId')
  const { showToast, ToastContainer } = useToast()
  const [tab, setTab] = useState<Tab>('pending')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loans, setLoans] = useState<Loan[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null)
  const [aiAssessmentByLoanId, setAIAssessmentByLoanId] = useState<Record<string, AIEvaluation>>({})
  const [highRiskApproveModal, setHighRiskApproveModal] = useState<{ loanId: string; loan: Loan } | null>(null)
  const [disburseModal, setDisburseModal] = useState<{ loanId: string; loan: Loan } | null>(null)
  const [disburseDueDate, setDisburseDueDate] = useState('')
  const [disburseMethod, setDisburseMethod] = useState<'MPESA' | 'CASH' | 'BANK' | 'OTHER'>('MPESA')
  const [disbursePhone, setDisbursePhone] = useState('')
  const [recordRepayModal, setRecordRepayModal] = useState<{ loanId: string; loan: Loan } | null>(null)
  const [recordRepayAmount, setRecordRepayAmount] = useState('')
  const [recordRepayMethod, setRecordRepayMethod] = useState<'CASH' | 'BANK' | 'MPESA' | 'OTHER'>('CASH')
  const [recordRepayRef, setRecordRepayRef] = useState('')
  const [recordRepayLoading, setRecordRepayLoading] = useState(false)

  const loadLoans = async () => {
    if (!chamaId) return
    try {
      const statusParam = tab === 'pending' ? 'PENDING' : tab === 'active' ? 'ACTIVE' : undefined
      const params = new URLSearchParams()
      if (statusParam) params.set('status', statusParam)
      if (userIdFromUrl) params.set('userId', userIdFromUrl)
      const res = await api.get(chamaRoute(chamaId, `/loans?${params.toString()}`))
      const data = res.data.data?.data ?? res.data.data ?? []
      setLoans(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      showToast('Failed to load loans', 'error')
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  const loadContributions = async () => {
    if (!chamaId) return
    try {
      const res = await api.get(chamaRoute(chamaId, '/contributions?limit=500'))
      const data = res.data.data?.data ?? res.data.data ?? []
      setContributions(Array.isArray(data) ? data : [])
    } catch {
      setContributions([])
    }
  }

  useEffect(() => {
    if (chamaId) {
      setLoading(true)
      loadLoans()
    }
  }, [chamaId, tab, userIdFromUrl])

  useEffect(() => {
    if (chamaId && tab === 'pending') {
      loadContributions()
    }
  }, [chamaId, tab])

  const handleRefresh = () => {
    setLoading(true)
    loadLoans()
    if (tab === 'pending') loadContributions()
  }

  const handleApprove = async (loanId: string) => {
    if (!chamaId) return
    const assessment = aiAssessmentByLoanId[loanId]
    if (assessment?.riskLevel === 'HIGH') {
      const loan = loans.find((l) => l.id === loanId)
      if (loan) setHighRiskApproveModal({ loanId, loan })
      return
    }
    await doApprove(loanId)
  }

  const doApprove = async (loanId: string) => {
    if (!chamaId) return
    setHighRiskApproveModal(null)
    setActioningId(loanId)
    try {
      await api.patch(chamaRoute(chamaId, `/loans/${loanId}/approve`), {})
      showToast('Loan approved', 'success')
      loadLoans()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to approve loan', 'error')
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (loanId: string) => {
    if (!chamaId) return
    setActioningId(loanId)
    try {
      await api.patch(chamaRoute(chamaId, `/loans/${loanId}/reject`))
      showToast('Loan rejected', 'success')
      loadLoans()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reject loan', 'error')
    } finally {
      setActioningId(null)
    }
  }

  const openDisburseModal = (loan: Loan) => {
    const defaultDue = new Date()
    defaultDue.setMonth(defaultDue.getMonth() + 6)
    setDisburseDueDate(defaultDue.toISOString().slice(0, 10))
    setDisburseMethod('MPESA')
    setDisbursePhone((loan.user as { phone?: string })?.phone ?? '')
    setDisburseModal({ loanId: loan.id, loan })
  }

  const handleDisburse = async () => {
    if (!chamaId || !disburseModal) return
    if (!disburseDueDate) {
      showToast('Please set a due date', 'error')
      return
    }
    if (disburseMethod === 'MPESA') {
      const phone = disbursePhone.trim() || (disburseModal.loan.user as { phone?: string })?.phone
      if (!phone || phone.length < 10) {
        showToast('Enter a valid M-Pesa number (from member profile or override below)', 'error')
        return
      }
    }
    setActioningId(disburseModal.loanId)
    try {
      const body: { dueDate: string; method: string; phone?: string } = {
        dueDate: new Date(disburseDueDate).toISOString(),
        method: disburseMethod,
      }
      if (disburseMethod === 'MPESA') {
        body.phone = disbursePhone.trim() || (disburseModal.loan.user as { phone?: string })?.phone || undefined
      }
      await api.post(chamaRoute(chamaId, `/loans/${disburseModal.loanId}/disburse`), body)
      showToast('Loan disbursed', 'success')
      setDisburseModal(null)
      loadLoans()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to disburse loan', 'error')
    } finally {
      setActioningId(null)
    }
  }

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chamaId || !recordRepayModal) return
    const amount = parseInt(recordRepayAmount, 10)
    if (isNaN(amount) || amount < 1) {
      showToast('Enter a valid amount', 'error')
      return
    }
    setRecordRepayLoading(true)
    try {
      await api.post(chamaRoute(chamaId, `/loans/${recordRepayModal.loanId}/repayments/record`), {
        amount,
        method: recordRepayMethod,
        reference: recordRepayRef || undefined,
      })
      showToast('Repayment recorded', 'success')
      setRecordRepayModal(null)
      setRecordRepayAmount('')
      setRecordRepayRef('')
      loadLoans()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to record repayment', 'error')
    } finally {
      setRecordRepayLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const statusFilter =
      tab === 'pending' ? 'PENDING' : tab === 'active' ? 'ACTIVE' : undefined
    let list = statusFilter ? loans.filter((l) => l.status === statusFilter) : loans.filter((l) => ['PAID', 'REJECTED'].includes(l.status))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (l) =>
          l.user?.fullName?.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
      )
    }
    return list
  }, [loans, tab, search])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const getRisk = (loan: Loan) => {
    if (loan.status !== 'PENDING' || !loan.user?.id) return null
    const userContributions = contributions
      .filter((c: any) => c.userId === loan.user?.id)
      .map((c: any) => ({ date: c.paidAt || c.createdAt, amount: c.amount }))
    const userLoans = loans
      .filter((l) => l.user?.id === loan.user?.id)
      .map((l) => ({
        status: l.status,
        amount: l.principal,
        date: l.createdAt,
      }))
    return computeLoanRisk(
      { contributions: userContributions, loans: userLoans },
      loan.principal
    )
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Loans</h1>
          <p className="text-sm text-slate-500">Manage loan requests and disbursements</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(['pending', 'active', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setCurrentPage(1)
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                tab === t
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search loans..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="overflow-hidden p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : (
            <>
              <div className="max-h-[600px] overflow-auto">
                <TableShell>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableEmpty colSpan={7} message={`No ${tab} loans.`} />
                    ) : (
                      paginated.map((l) => (
                        <Fragment key={l.id}>
                        {
                        (() => {
                        const risk = getRisk(l)
                        const statusLabel = l.status === 'PENDING' ? 'Pending' : l.status === 'APPROVED' ? 'Approved' : l.status === 'ACTIVE' ? 'Active' : l.status === 'PAID' ? 'Paid' : l.status === 'REJECTED' ? 'Rejected' : l.status
                        return (
                          <>
                          <TableRow>
                            <TableCell className="font-medium">{l.id.slice(0, 8)}</TableCell>
                            <TableCell className="font-medium">{l.user?.fullName ?? '—'}</TableCell>
                            <TableCell className="text-right font-semibold">{formatKES(l.principal)}</TableCell>
                            <TableCell>{formatDateShort(l.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant={statusChipColor(statusLabel)}>{statusLabel}</Badge>
                            </TableCell>
                            <TableCell>
                              {risk ? (
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant={
                                      risk.level === 'Low' ? 'success' : risk.level === 'Medium' ? 'warning' : 'danger'
                                    }
                                  >
                                    {risk.level} Risk
                                  </Badge>
                                  <span className="text-xs text-slate-500">{risk.recommendation}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {l.status === 'PENDING' && (
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setExpandedLoanId((id) => (id === l.id ? null : l.id))}
                                    className="gap-1"
                                  >
                                    <Sparkles size={14} />
                                    AI Assessment
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={actioningId !== null}
                                    loading={actioningId === l.id}
                                    onClick={() => handleApprove(l.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    <CheckCircle size={14} />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={actioningId !== null}
                                    onClick={() => handleReject(l.id)}
                                  >
                                    <XCircle size={14} />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {l.status === 'APPROVED' && (
                                <Button
                                  size="sm"
                                  disabled={actioningId !== null}
                                  loading={actioningId === l.id}
                                  onClick={() => openDisburseModal(l)}
                                >
                                  <Banknote size={14} />
                                  Disburse
                                </Button>
                              )}
                              {l.status === 'ACTIVE' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setRecordRepayModal({ loanId: l.id, loan: l })
                                    setRecordRepayAmount('')
                                    setRecordRepayRef('')
                                  }}
                                >
                                  Record repayment
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedLoanId === l.id && (
                            <TableRow className="bg-slate-50/80">
                              <TableCell colSpan={7} className="p-4">
                                <AILoanAssessment
                                  chamaId={chamaId!}
                                  loanId={l.id}
                                  onEvaluationLoaded={(ev) =>
                                    setAIAssessmentByLoanId((prev) => ({ ...prev, [l.id]: ev }))
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          )}
                          </>
                        );
                        })()}
                        </Fragment>
                      ))
                    )}
                  </TableBody>
                </TableShell>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                  <div className="text-sm text-slate-600">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} loans
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Disburse modal: due date + method */}
      {disburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-800">Disburse loan</h3>
              <p className="mt-1 text-sm text-slate-500">
                {disburseModal.loan.user?.fullName} · {formatKES(disburseModal.loan.principal)}
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Due date</label>
                  <input
                    type="date"
                    value={disburseDueDate}
                    onChange={(e) => setDisburseDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Disbursement method</label>
                  <select
                    value={disburseMethod}
                    onChange={(e) => setDisburseMethod(e.target.value as 'MPESA' | 'CASH' | 'BANK' | 'OTHER')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="MPESA">M-Pesa (send to member&apos;s number)</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                {disburseMethod === 'MPESA' && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                      Send via M-Pesa to member
                    </div>
                    <p className="text-xs text-slate-500">
                      Amount {formatKES(disburseModal.loan.principal)} will be sent to the number below (from member profile or override).
                    </p>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">M-Pesa number</label>
                      <input
                        type="tel"
                        value={disbursePhone}
                        onChange={(e) => setDisbursePhone(e.target.value)}
                        placeholder={(disburseModal.loan.user as { phone?: string })?.phone || '254712345678'}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      {!(disburseModal.loan.user as { phone?: string })?.phone && (
                        <p className="mt-1 text-xs text-amber-600">Member has no phone on file — enter number above.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setDisburseModal(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={actioningId !== null}
                  loading={actioningId === disburseModal.loanId}
                  onClick={handleDisburse}
                >
                  <Banknote size={16} />
                  Disburse
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Record repayment modal (admin) */}
      {recordRepayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-800">Record repayment</h3>
              <p className="mt-1 text-sm text-slate-500">
                {recordRepayModal.loan.user?.fullName} · Loan {recordRepayModal.loanId.slice(0, 8)}…
              </p>
              <form onSubmit={handleRecordRepayment} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Amount (KES)</label>
                  <input
                    type="number"
                    min="1"
                    value={recordRepayAmount}
                    onChange={(e) => setRecordRepayAmount(e.target.value)}
                    required
                    disabled={recordRepayLoading}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Method</label>
                  <select
                    value={recordRepayMethod}
                    onChange={(e) => setRecordRepayMethod(e.target.value as 'CASH' | 'BANK' | 'MPESA' | 'OTHER')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Reference (optional)</label>
                  <input
                    type="text"
                    value={recordRepayRef}
                    onChange={(e) => setRecordRepayRef(e.target.value)}
                    placeholder="e.g. receipt number"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setRecordRepayModal(null)}>Cancel</Button>
                  <Button type="submit" loading={recordRepayLoading}>Record repayment</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* High-risk approve confirmation modal */}
      {highRiskApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800">High risk loan</h3>
              <p className="mt-2 text-sm text-slate-600">
                AI Assessment recommends <strong>REJECT</strong> for this application (high risk).
                Approve anyway?
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {highRiskApproveModal.loan.user?.fullName} · {formatKES(highRiskApproveModal.loan.principal)}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setHighRiskApproveModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700"
                  disabled={actioningId !== null}
                  loading={actioningId === highRiskApproveModal.loanId}
                  onClick={() => doApprove(highRiskApproveModal.loanId)}
                >
                  Approve anyway
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
