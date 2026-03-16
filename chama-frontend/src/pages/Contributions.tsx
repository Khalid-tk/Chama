import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, ModalBody, ModalFooter } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { FilterBar } from '../components/ui/FilterBar'
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
  const [fixedContributionAmount, setFixedContributionAmount] = useState<number | null>(null)

  useEffect(() => {
    if (!chamaId) return
    api.get(chamaRoute(chamaId, '/context'))
      .then((res) => {
        const chama = res.data?.data
        const amt = chama?.contributionAmount ?? chama?.summary?.contributionAmount
        setFixedContributionAmount(amt != null ? Number(amt) : null)
      })
      .catch(() => setFixedContributionAmount(null))
  }, [chamaId])

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
  const stats = useMemo(() => {
    const total = filtered.reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const month = new Date().getMonth()
    const year = new Date().getFullYear()
    const thisMonth = filtered
      .filter((c) => {
        const d = new Date(c.paidAt || c.createdAt)
        return d.getMonth() === month && d.getFullYear() === year
      })
      .reduce((sum, c) => sum + Number(c.amount || 0), 0)
    return { total, thisMonth, count: filtered.length }
  }, [filtered])

  return (
    <div className="space-y-6">
      <ToastContainer />

      <PageHeader
        title="Contributions"
        description="Track and manage member contribution payments."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setLoading(true); loadContributions() }} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
            <Button size="sm" onClick={() => { setShowRecordModal(true); if (fixedContributionAmount != null) setRecordAmount(String(fixedContributionAmount)) }}>
              <Plus size={14} /> Record contribution
            </Button>
          </>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total collected', value: formatKES(stats.total) },
          { label: 'This month',      value: formatKES(stats.thisMonth) },
          { label: 'Entries',         value: stats.count },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-ink-300 bg-warm-card px-4 py-4" style={{ boxShadow: 'var(--shadow-xs)' }}>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-ink-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <FilterBar
        search={{ value: search, onChange: v => { setSearch(v); setCurrentPage(1) }, placeholder: 'Search by member name or email…' }}
      />

      <Card>
        <CardContent className="overflow-hidden p-0">
          {loading ? (
            <div className="p-8 text-center text-ink-500">Loading...</div>
          ) : (
            <>
              <div className="space-y-3 p-4 lg:hidden">
                {paginated.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-500">No contributions found.</p>
                ) : (
                  paginated.map((c) => (
                    <div key={c.id} className="rounded-lg border border-ink-300 bg-warm-bg/50 p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-xs text-ink-500">Member</p>
                          <p className="font-medium text-ink-900">{c.user?.fullName ?? '—'}</p>
                        </div>
                        <p className="font-semibold text-ink-900 amount-cell">{formatKES(c.amount)}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-ink-500">{formatDateShort(c.paidAt || c.createdAt)}</span>
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
                <div className="flex items-center justify-between border-t border-ink-200 px-6 py-4">
                  <div className="text-sm text-ink-700">
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

      <Modal open={showRecordModal} onClose={() => setShowRecordModal(false)}
        title="Record contribution"
        description={fixedContributionAmount != null ? `Fixed contribution: ${formatKES(fixedContributionAmount)}` : 'Manual entry for this period.'}>
        <form onSubmit={handleRecordContribution}>
          <ModalBody className="space-y-4">
            <Input label="Amount (KES)" type="number" min="1" required
              value={recordAmount} onChange={e => setRecordAmount(e.target.value)} disabled={recordLoading} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Payment method</label>
              <select value={recordMethod} onChange={e => setRecordMethod(e.target.value)} disabled={recordLoading}
                className="h-9 w-full rounded-md border border-ink-300 bg-warm-card px-3 text-sm text-ink-700 focus:border-brown focus:outline-none focus:ring-1 focus:ring-brown/20 transition-colors">
                <option value="MANUAL">Manual</option>
                <option value="MPESA">M-Pesa</option>
                <option value="BANK">Bank transfer</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowRecordModal(false)} disabled={recordLoading}>Cancel</Button>
            <Button type="submit" size="sm" loading={recordLoading}>Save contribution</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
