import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
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
import { formatKES, formatDateShort } from '../lib/format'
import { useChamaId } from '../hooks/useChamaId'
import { useToast } from '../hooks/useToast'
import api, { chamaRoute } from '../lib/api'

const ITEMS_PER_PAGE = 10

type Contribution = {
  id: string
  amount: number
  method: string
  paidAt: string
  createdAt: string
  user?: { fullName: string; email: string }
}

export function Contributions() {
  const chamaId = useChamaId()
  const [searchParams] = useSearchParams()
  const userIdFromUrl = searchParams.get('userId')
  const { showToast, ToastContainer } = useToast()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [recordAmount, setRecordAmount] = useState('')
  const [recordMethod, setRecordMethod] = useState('MANUAL')
  const [recordLoading, setRecordLoading] = useState(false)

  const loadContributions = async () => {
    if (!chamaId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '500')
      if (userIdFromUrl) params.set('userId', userIdFromUrl)
      const res = await api.get(chamaRoute(chamaId, `/contributions?${params.toString()}`))
      const data = res.data.data?.data ?? res.data.data ?? []
      setContributions(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      showToast('Failed to load contributions', 'error')
      setContributions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (chamaId) loadContributions()
  }, [chamaId, userIdFromUrl])

  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chamaId) return
    const amount = parseInt(recordAmount, 10)
    if (isNaN(amount) || amount < 1) {
      showToast('Enter a valid amount', 'error')
      return
    }
    setRecordLoading(true)
    try {
      await api.post(chamaRoute(chamaId, '/contributions'), {
        amount,
        method: recordMethod,
      })
      showToast('Contribution recorded', 'success')
      setShowRecordModal(false)
      setRecordAmount('')
      setRecordMethod('MANUAL')
      loadContributions()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to record contribution', 'error')
    } finally {
      setRecordLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = contributions
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.user?.fullName?.toLowerCase().includes(q) ||
          c.user?.email?.toLowerCase().includes(q)
      )
    }
    return list
  }, [contributions, search])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Contributions</h1>
          <p className="text-sm text-slate-500">Track and manage member contributions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setLoading(true); loadContributions(); }} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button onClick={() => setShowRecordModal(true)}>
            <Plus size={18} />
            Record Contribution
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search contributions..."
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
              <div className="space-y-3 p-4 lg:hidden">
                {paginated.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No contributions found.</p>
                ) : (
                  paginated.map((c) => (
                    <div key={c.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-xs text-slate-500">Member</p>
                          <p className="font-medium text-slate-800">{c.user?.fullName ?? '—'}</p>
                        </div>
                        <p className="font-semibold text-slate-800 amount-cell">{formatKES(c.amount)}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-slate-500">{formatDateShort(c.paidAt || c.createdAt)}</span>
                        <Badge variant="neutral">{c.method}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="max-h-[600px] overflow-auto hidden lg:block">
                <TableShell>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableEmpty colSpan={4} message="No contributions found." />
                    ) : (
                      paginated.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{formatDateShort(c.paidAt || c.createdAt)}</TableCell>
                          <TableCell className="font-medium">{c.user?.fullName ?? '—'}</TableCell>
                          <TableCell className="text-right font-semibold amount-cell">{formatKES(c.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="neutral">{c.method}</Badge>
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
                    {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} contributions
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      Previous
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
            <CardContent className="p-4 sm:p-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">Record Contribution</h2>
              <p className="mb-4 text-sm text-slate-500">Record your own contribution (manual entry).</p>
              <form onSubmit={handleRecordContribution} className="space-y-4">
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
                    onChange={(e) => setRecordMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="BANK">Bank</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={recordLoading} className="flex-1">Save</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowRecordModal(false)} disabled={recordLoading}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
