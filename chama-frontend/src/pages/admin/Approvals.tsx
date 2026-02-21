import { useState, useMemo, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import {
  TableShell,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../../components/ui/TableShell'
import { Users } from 'lucide-react'
import { formatKES, formatDateShort } from '../../lib/format'
import { computeLoanRisk } from '../../utils/analytics'
import { useChamaId } from '../../hooks/useChamaId'
import { useToast } from '../../hooks/useToast'
import api, { chamaRoute } from '../../lib/api'

export function Approvals() {
  const chamaId = useChamaId()
  const { showToast, ToastContainer } = useToast()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'loans' | 'members'>('loans')
  const [loans, setLoans] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)

  useEffect(() => {
    if (typeFilter === 'loans' && chamaId) {
      setLoading(true)
      loadPendingLoans()
      loadContributions()
    }
  }, [chamaId, typeFilter])

  const loadPendingLoans = async () => {
    try {
      const response = await api.get(chamaRoute(chamaId, '/loans?status=PENDING'))
      const data = response.data.data?.data ?? response.data.data ?? []
      setLoans(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load loans:', error)
      showToast('Failed to load loans', 'error')
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  const loadContributions = async () => {
    try {
      const res = await api.get(chamaRoute(chamaId, '/contributions?limit=500'))
      const data = res.data.data?.data ?? res.data.data ?? []
      setContributions(Array.isArray(data) ? data : [])
    } catch {
      setContributions([])
    }
  }

  const pendingLoans = loans.filter((l) => l.status === 'PENDING')

  const filteredLoans = useMemo(() => {
    return pendingLoans.filter(
      (l) =>
        l.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        l.id?.toLowerCase().includes(search.toLowerCase())
    )
  }, [pendingLoans, search])

  const getRisk = (loan: any) => {
    const userId = loan.user?.id
    if (!userId) return { level: 'Medium' as const, recommendation: 'Review' as const, reasons: [] }
    const userContributions = contributions
      .filter((c: any) => c.userId === userId)
      .map((c: any) => ({ date: c.paidAt || c.createdAt, amount: c.amount }))
    const userLoans = loans
      .filter((l: any) => l.user?.id === userId)
      .map((l: any) => ({ status: l.status, amount: l.principal, date: l.createdAt }))
    return computeLoanRisk(
      { contributions: userContributions, loans: userLoans },
      loan.principal
    )
  }

  const handleApprove = async (loanId: string) => {
    setActioningId(loanId)
    try {
      await api.patch(chamaRoute(chamaId, `/loans/${loanId}/approve`), {})
      showToast('Loan approved', 'success')
      loadPendingLoans()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to approve loan', 'error')
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (loanId: string) => {
    setActioningId(loanId)
    try {
      await api.patch(chamaRoute(chamaId, `/loans/${loanId}/reject`))
      showToast('Loan rejected', 'success')
      loadPendingLoans()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to reject loan', 'error')
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Approvals</h1>
        <p className="text-sm text-slate-500">Review and approve pending requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTypeFilter('loans')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            typeFilter === 'loans'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Loan Applications ({pendingLoans.length})
        </button>
        <button
          onClick={() => setTypeFilter('members')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            typeFilter === 'members'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Member Requests (0)
        </button>
      </div>

      {typeFilter === 'loans' && (
        <>
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <Input
                placeholder="Search loan applications..."
                icon={<Search size={18} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Loans Table */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">Pending Loan Applications</h2>
              <p className="text-sm text-slate-500">Review loan requests and risk assessments</p>
            </CardHeader>
            <CardContent className="overflow-hidden p-0">
              <div className="max-h-[600px] overflow-auto">
                <TableShell>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Recommendation</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredLoans.length === 0 ? (
                      <TableEmpty colSpan={7} message="No pending loan applications." />
                    ) : (
                      filteredLoans.map((loan) => {
                        const risk = getRisk(loan)
                        return (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">{loan.id?.slice(0, 8)}</TableCell>
                            <TableCell className="font-medium">{loan.user?.fullName ?? '—'}</TableCell>
                            <TableCell className="text-right font-semibold">{formatKES(loan.principal)}</TableCell>
                            <TableCell>{formatDateShort(loan.createdAt)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  risk.level === 'Low' ? 'success' : risk.level === 'Medium' ? 'warning' : 'danger'
                                }
                              >
                                {risk.level} Risk
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {risk.recommendation === 'Approve' ? (
                                  <CheckCircle className="text-emerald-600" size={16} />
                                ) : risk.recommendation === 'Review' ? (
                                  <AlertTriangle className="text-amber-600" size={16} />
                                ) : (
                                  <XCircle className="text-red-600" size={16} />
                                )}
                                <span className="text-sm text-slate-700">{risk.recommendation}</span>
                              </div>
                              {risk.reasons.length > 0 && (
                                <div className="mt-1 text-xs text-slate-500">{risk.reasons[0]}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  disabled={actioningId !== null}
                                  loading={actioningId === loan.id}
                                  onClick={() => handleApprove(loan.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <CheckCircle size={14} />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={actioningId !== null}
                                  onClick={() => handleReject(loan.id)}
                                >
                                  <XCircle size={14} />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </TableShell>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {typeFilter === 'members' && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="text-slate-300 mx-auto mb-4" size={48} />
            <p className="text-slate-500">No pending member join requests</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
