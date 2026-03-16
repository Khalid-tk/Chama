import { useEffect, useState } from 'react'
import { FileText, Calendar, User } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatDateShort } from '../../lib/format'
import api from '../../lib/api'

type AuditLog = {
  id: string
  action: string
  entity: string
  entityId?: string
  meta?: any
  createdAt: string
  actor?: {
    fullName: string
    email: string
  }
  chama?: {
    name: string
    chamaCode: string
  }
}

export function SuperAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadLogs()
  }, [page])

  const loadLogs = async () => {
    try {
      const response = await api.get(`/super/audit?page=${page}&limit=50`)
      setLogs(response.data.data.logs || [])
      setTotalPages(response.data.data.pagination?.pages || 1)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-brown border-t-transparent"></div>
          <p className="text-ink-700">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Platform Audit Logs</h1>
        <p className="text-sm text-ink-500">View all platform-level activities</p>
      </div>

      <Card>
        <CardContent className="overflow-hidden p-0">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-ink-500">No audit logs found</div>
          ) : (
            <div className="divide-y divide-ink-200">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-warm-bg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-ink-500" />
                        <span className="font-semibold text-ink-900">{log.action}</span>
                        <Badge variant="neutral">{log.entity}</Badge>
                      </div>
                      <div className="ml-6 space-y-1 text-sm text-ink-700">
                        {log.actor && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>
                              {log.actor.fullName} ({log.actor.email})
                            </span>
                          </div>
                        )}
                        {log.chama && (
                          <div>
                            Chama: {log.chama.name} ({log.chama.chamaCode})
                          </div>
                        )}
                        {log.meta && (
                          <div className="text-xs text-ink-500">
                            {JSON.stringify(log.meta, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2 text-xs text-ink-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateShort(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink-200 px-6 py-4">
              <div className="text-sm text-ink-700">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-ink-300 bg-warm-card px-4 py-2 text-sm text-ink-700 hover:bg-warm-bg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-ink-300 bg-warm-card px-4 py-2 text-sm text-ink-700 hover:bg-warm-bg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
