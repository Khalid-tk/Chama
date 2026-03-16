import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
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
import { formatKES, formatDateShort, statusChipColor } from '../../lib/format'
import { useChamaId } from '../../hooks/useChamaId'
import { chamaRoute } from '../../lib/api'
import api from '../../lib/api'
import { ChartCard } from '../../components/charts/ChartCard'
import { ContributionsTrendChart } from '../../components/charts/ContributionsTrendChart'

const ITEMS_PER_PAGE = 10

export function MemberContributions() {
  const chamaId = useChamaId()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [contributions, setContributions] = useState<any[]>([])

  useEffect(() => {
    loadContributions()
  }, [chamaId])

  const loadContributions = async () => {
    try {
      setLoading(true)
      const response = await api.get(chamaRoute(chamaId, '/my/contributions'))
      setContributions(response.data.data.data || [])
    } catch (error) {
      console.error('Failed to load contributions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Map API data to expected format
  const memberContributions = useMemo(() => {
    return contributions.map((c: any) => ({
      id: c.id,
      amount: c.amount,
      date: c.paidAt || c.createdAt,
      method: c.method,
      reference: c.reference,
      status: 'completed',
    }))
  }, [contributions])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return memberContributions.slice(start, start + ITEMS_PER_PAGE)
  }, [memberContributions, currentPage])

  const totalPages = Math.ceil(memberContributions.length / ITEMS_PER_PAGE)
  const totalContributed = memberContributions.reduce((sum, c) => sum + c.amount, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">My Contributions</h1>
          <p className="text-sm text-ink-500">Track your personal contributions</p>
        </div>
        <div className="text-center py-12 text-ink-500">Loading contributions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">My Contributions</h1>
          <p className="text-sm text-ink-500">Track your personal contributions</p>
        </div>
        <Button onClick={() => navigate(`/member/${chamaId}/mpesa`)}>
          <Plus size={18} />
          Make Contribution
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-ink-500">Total Contributed</div>
            <div className="text-2xl font-bold text-ink-900">{formatKES(totalContributed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-ink-500">Total Contributions</div>
            <div className="text-2xl font-bold text-ink-900">{memberContributions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-ink-500">Average per Contribution</div>
            <div className="text-2xl font-bold text-ink-900">
              {formatKES(Math.round(totalContributed / memberContributions.length) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <ChartCard title="My Contribution Trend" description="Your contributions over time">
        <ContributionsTrendChart data={memberContributions} />
      </ChartCard>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-ink-900">Contribution History</h2>
          <p className="text-sm text-ink-500">Your recent contributions</p>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          {/* Mobile: card list */}
          <div className="space-y-3 p-4 lg:hidden">
            {paginated.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">No contributions found.</p>
            ) : (
              paginated.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-ink-300 bg-warm-bg/50 p-4"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs text-ink-500">Date</p>
                      <p className="font-medium text-ink-900">{formatDateShort(c.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ink-500">Amount</p>
                      <p className="font-semibold text-ink-900 amount-cell">{formatKES(c.amount)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-ink-500">Status</p>
                    <Badge variant={statusChipColor(c.status)}>{c.status}</Badge>
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
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableEmpty colSpan={3} message="No contributions found." />
                ) : (
                  paginated.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatDateShort(c.date)}</TableCell>
                      <TableCell className="text-right font-semibold amount-cell">{formatKES(c.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={statusChipColor(c.status)}>{c.status}</Badge>
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
                {Math.min(currentPage * ITEMS_PER_PAGE, memberContributions.length)} of {memberContributions.length} contributions
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
    </div>
  )
}
