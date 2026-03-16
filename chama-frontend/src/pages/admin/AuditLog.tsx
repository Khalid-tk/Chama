import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, FileText, User, DollarSign, CreditCard, Users, Settings } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
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
import { formatDateShort } from '../../lib/format'
import { useChamaId } from '../../hooks/useChamaId'
import api, { chamaRoute } from '../../lib/api'

type AuditLogEntry = {
  id: string
  createdAt: string
  action: string
  entity: string
  entityId: string | null
  meta: Record<string, unknown> | null
  actor: { id: string; fullName: string; email: string } | null
}

type LogType = 'loan' | 'contribution' | 'member' | 'settings' | 'payment' | 'other'

function entityToType(entity: string): LogType {
  const e = (entity || '').toUpperCase()
  if (e === 'LOAN') return 'loan'
  if (e === 'CONTRIBUTION') return 'contribution'
  if (e === 'MEMBERSHIP' || e === 'MEMBER') return 'member'
  if (e === 'CHAMA' || e === 'SETTINGS') return 'settings'
  if (e.includes('REPAYMENT') || e.includes('MPESA') || e.includes('PAYMENT')) return 'payment'
  return 'other'
}

function formatDetails(entry: AuditLogEntry): string {
  const meta = entry.meta || {}
  const parts: string[] = []
  if (typeof meta.amount === 'number') parts.push(`KES ${meta.amount.toLocaleString()}`)
  if (meta.principal != null) parts.push(`Principal: KES ${Number(meta.principal).toLocaleString()}`)
  if (meta.role) parts.push(`Role: ${meta.role}`)
  if (meta.name) parts.push(String(meta.name))
  if (meta.chamaCode) parts.push(`Code: ${meta.chamaCode}`)
  if (Object.keys(meta).length > 0 && parts.length === 0) {
    parts.push(entry.action.replace(/_/g, ' ') + (entry.entityId ? ` (${entry.entityId.slice(0, 8)}…)` : ''))
  }
  return parts.length > 0 ? parts.join(' · ') : `${entry.action.replace(/_/g, ' ')}`
}

const ITEMS_PER_PAGE = 10

export function AuditLog() {
  const chamaId = useChamaId()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })

  useEffect(() => {
    if (!chamaId) return
    setLoading(true)
    api
      .get(chamaRoute(chamaId, '/audit-log'), {
        params: { page: currentPage, limit: ITEMS_PER_PAGE },
      })
      .then((res) => {
        const data = res.data?.data
        setLogs(data?.logs ?? [])
        setPagination(data?.pagination ?? { page: 1, limit: ITEMS_PER_PAGE, total: 0, pages: 0 })
      })
      .catch(() => {
        setLogs([])
        setPagination({ page: 1, limit: ITEMS_PER_PAGE, total: 0, pages: 0 })
      })
      .finally(() => setLoading(false))
  }, [chamaId, currentPage])

  const filtered = useMemo(() => {
    return logs.filter((entry) => {
      const user = entry.actor?.fullName ?? entry.actor?.email ?? ''
      const details = formatDetails(entry)
      const action = entry.action ?? ''
      const matchesSearch =
        search === '' ||
        user.toLowerCase().includes(search.toLowerCase()) ||
        action.toLowerCase().includes(search.toLowerCase()) ||
        details.toLowerCase().includes(search.toLowerCase())
      const type = entityToType(entry.entity)
      const matchesType = typeFilter === 'all' || type === typeFilter
      const matchesUser = userFilter === 'all' || user === userFilter
      return matchesSearch && matchesType && matchesUser
    })
  }, [logs, search, typeFilter, userFilter])

  const uniqueUsers = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((e) => {
      const u = e.actor?.fullName ?? e.actor?.email ?? 'System'
      if (u) set.add(u)
    })
    return Array.from(set)
  }, [logs])

  const getIcon = (type: LogType) => {
    switch (type) {
      case 'loan':
        return <CreditCard className="text-brown" size={16} />
      case 'contribution':
        return <DollarSign className="text-emerald-600" size={16} />
      case 'member':
        return <Users className="text-purple-600" size={16} />
      case 'payment':
        return <DollarSign className="text-brown" size={16} />
      case 'settings':
        return <Settings className="text-amber-600" size={16} />
      default:
        return <FileText className="text-ink-700" size={16} />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Audit Log</h1>
        <p className="text-sm text-ink-500">Track all system activities and changes</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 max-w-xs">
              <Input
                placeholder="Search audit log..."
                icon={<Search size={18} />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-ink-500" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="rounded-lg border border-ink-300 bg-warm-card px-4 py-2 text-sm text-ink-700 focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20"
              >
                <option value="all">All Types</option>
                <option value="loan">Loans</option>
                <option value="contribution">Contributions</option>
                <option value="member">Members</option>
                <option value="payment">Payments</option>
                <option value="settings">Settings</option>
                <option value="other">Other</option>
              </select>
              <select
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="rounded-lg border border-ink-300 bg-warm-card px-4 py-2 text-sm text-ink-700 focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-ink-900">Activity Timeline</h2>
          <p className="text-sm text-ink-500">Chronological log of chama activities</p>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-300 border-t-blue-600" />
            </div>
          ) : (
            <>
              <div className="max-h-[600px] overflow-auto">
                <TableShell>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableEmpty colSpan={5} message="No audit log entries found." />
                    ) : (
                      filtered.map((entry) => {
                        const type = entityToType(entry.entity)
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <div className="text-sm font-medium text-ink-900">
                                {formatDateShort(entry.createdAt)}
                              </div>
                              <div className="text-xs text-ink-500">
                                {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="text-ink-400" size={14} />
                                <span className="font-medium">
                                  {entry.actor?.fullName ?? entry.actor?.email ?? 'System'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {entry.action.replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getIcon(type)}
                                <Badge variant="neutral" className="capitalize">
                                  {type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-ink-700">
                              {formatDetails(entry)}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </TableShell>
              </div>
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-ink-200 px-6 py-4">
                  <div className="text-sm text-ink-700">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} entries)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-ink-300 bg-warm-card px-4 py-2 text-sm text-ink-700 hover:bg-warm-bg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={currentPage === pagination.pages}
                      className="rounded-lg border border-ink-300 bg-warm-card px-4 py-2 text-sm text-ink-700 hover:bg-warm-bg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
