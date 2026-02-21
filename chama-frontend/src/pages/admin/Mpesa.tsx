import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { formatKES, formatDateShort } from '../../lib/format'
import { RecentMpesaPayments } from '../../components/mpesa/RecentMpesaPayments'
import { useChamaId } from '../../hooks/useChamaId'
import api, { chamaRoute } from '../../lib/api'

export function AdminMpesa() {
  const chamaId = useChamaId()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
    totalAmount: 0,
  })

  useEffect(() => {
    loadPayments()
  }, [chamaId, statusFilter])

  const loadPayments = async () => {
    if (!chamaId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      const response = await api.get(
        chamaRoute(chamaId, `/mpesa${params.toString() ? `?${params.toString()}` : ''}`)
      )
      const payload = response.data?.data
      const data = Array.isArray(payload?.data) ? payload.data : []
      setPayments(data)

      // Calculate stats
      const total = data.length
      const success = data.filter((p: any) => p.status === 'SUCCESS').length
      const failed = data.filter((p: any) => p.status === 'FAILED').length
      const pending = data.filter((p: any) => p.status === 'PENDING').length
      const totalAmount = data
        .filter((p: any) => p.status === 'SUCCESS')
        .reduce((sum: number, p: any) => sum + p.amount, 0)

      setStats({ total, success, failed, pending, totalAmount })
    } catch (error) {
      console.error('Failed to load payments:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.phone?.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Mpesa Payments</h1>
          <p className="text-sm text-slate-500">Monitor all Mpesa payments for this chama</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => loadPayments()} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Total Payments</div>
            <div className="text-2xl font-semibold text-slate-800">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Successful</div>
            <div className="text-2xl font-semibold text-emerald-600">{stats.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Failed</div>
            <div className="text-2xl font-semibold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Pending</div>
            <div className="text-2xl font-semibold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Total Amount</div>
            <div className="text-2xl font-semibold text-blue-600">{formatKES(Number(stats.totalAmount) || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search payments..."
            icon={<Search size={18} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
          <option value="TIMEOUT">Timeout</option>
        </select>
      </div>

      {/* Payments Table */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">Loading...</CardContent>
        </Card>
      ) : (
        <RecentMpesaPayments payments={filteredPayments} isAdmin={true} />
      )}
    </div>
  )
}
