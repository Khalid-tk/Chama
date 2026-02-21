import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { useToast } from '../../hooks/useToast'
import { Button } from '../../components/ui/Button'
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
import api, { chamaRoute } from '../../lib/api'

type JoinRequest = {
  id: string
  chamaId: string
  userId: string
  status: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    fullName: string
    email: string
    phone?: string
  }
}

export function JoinRequests() {
  const { chamaId } = useParams<{ chamaId: string }>()
  const { showToast, ToastContainer } = useToast()
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')

  useEffect(() => {
    if (chamaId) {
      loadRequests()
    }
  }, [chamaId, statusFilter])

  const loadRequests = async () => {
    if (!chamaId) return
    try {
      const response = await api.get(chamaRoute(chamaId, `/join-requests?status=${statusFilter}`))
      setRequests(response.data.data)
    } catch (error) {
      console.error('Failed to load join requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!chamaId) return
    try {
      await api.patch(chamaRoute(chamaId, `/join-requests/${requestId}/approve`))
      showToast('Request approved', 'success')
      loadRequests()
    } catch (error) {
      console.error('Failed to approve request:', error)
      showToast('Failed to approve request', 'error')
    }
  }

  const handleReject = async (requestId: string) => {
    if (!chamaId) return
    try {
      await api.patch(chamaRoute(chamaId, `/join-requests/${requestId}/reject`))
      showToast('Request rejected', 'success')
      loadRequests()
    } catch (error) {
      console.error('Failed to reject request:', error)
      showToast('Failed to reject request', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Join Requests</h1>
          <p className="text-sm text-slate-500">Manage member join requests for this chama</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => loadRequests()} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              statusFilter === status
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">
            {statusFilter} Requests ({requests.length})
          </h2>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : requests.length === 0 ? (
            <TableEmpty colSpan={5} message={`No ${statusFilter.toLowerCase()} requests`} />
          ) : (
            <div className="overflow-x-auto">
              <TableShell>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    {statusFilter === 'PENDING' && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.user.fullName}</TableCell>
                      <TableCell>{request.user.email}</TableCell>
                      <TableCell>{request.user.phone || '-'}</TableCell>
                      <TableCell>{formatDateShort(request.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === 'APPROVED'
                              ? 'success'
                              : request.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      {statusFilter === 'PENDING' && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleApprove(request.id)}
                            >
                              <CheckCircle size={16} />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReject(request.id)}
                            >
                              <XCircle size={16} />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </TableShell>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
