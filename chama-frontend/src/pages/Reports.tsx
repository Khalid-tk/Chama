import { useState, useMemo, useEffect } from 'react'
import { Search, FileDown } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import {
  TableShell,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../components/ui/TableShell'
import { formatDateShort } from '../lib/format'
import { ChartCard } from '../components/charts/ChartCard'
import { AdminContributionsChart } from '../components/charts/AdminContributionsChart'
import { CashflowChart } from '../components/charts/CashflowChart'
import { LoanStatusChart } from '../components/charts/LoanStatusChart'
import { MpesaTrendsChart } from '../components/charts/MpesaTrendsChart'
import { useChamaId } from '../hooks/useChamaId'
import api, { chamaRoute } from '../lib/api'

const mockReports = [
  { id: '1', name: 'Monthly Summary', period: 'Feb 2025', generated: '2025-02-01' },
  { id: '2', name: 'Contribution Report', period: 'Jan 2025', generated: '2025-01-31' },
  { id: '3', name: 'Loan Summary', period: 'Jan 2025', generated: '2025-01-31' },
]

function exportToCSV(data: typeof mockReports) {
  const headers = ['Report', 'Period', 'Generated']
  const rows = data.map((r) => [r.name, r.period, r.generated])
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chama-reports-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function Reports() {
  const chamaId = useChamaId()
  const [search, setSearch] = useState('')
  const [reportType] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<{
    series: {
      contributionsMonthly: Array<{ month: string; totalAmount: number }>
      loanStatusCounts: Record<string, number>
      cashflowMonthly: Array<{ month: string; inflow: number; outflow: number }>
      mpesaOutcomesMonthly: Array<{ month: string; success: number; failed: number; pending: number }>
    }
  } | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [chamaId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const res = await api.get(chamaRoute(chamaId, '/analytics/admin'), { params: { range: '12m' } })
      const raw = res.data?.data
      if (raw?.series) setAnalytics({ series: raw.series })
      else setAnalytics(null)
    } catch (e) {
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return mockReports.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.period.toLowerCase().includes(search.toLowerCase())
      const matchesType =
        reportType === 'all' || r.name.toLowerCase().includes(reportType.toLowerCase())
      return matchesSearch && matchesType
    })
  }, [search, reportType])

  const contributionsByMonth = useMemo(() => {
    const s = analytics?.series?.contributionsMonthly ?? []
    return s.map((m) => ({ month: m.month, amount: Number(m.totalAmount) || 0 }))
  }, [analytics?.series?.contributionsMonthly])

  const loanStatusData = useMemo(() => {
    const counts = analytics?.series?.loanStatusCounts ?? {}
    return Object.entries(counts).map(([status, count]) => ({
      status: status.charAt(0) + status.slice(1).toLowerCase(),
      count: Number(count) || 0,
    }))
  }, [analytics?.series?.loanStatusCounts])

  const cashflowData = useMemo(() => {
    const s = analytics?.series?.cashflowMonthly ?? []
    return s.map((m) => ({
      month: m.month,
      in: Number(m.inflow) || 0,
      out: Number(m.outflow) || 0,
    }))
  }, [analytics?.series?.cashflowMonthly])

  const mpesaTrends = useMemo(() => {
    const s = analytics?.series?.mpesaOutcomesMonthly ?? []
    return s.map((m) => ({
      date: m.month,
      success: Number(m.success) || 0,
      failed: Number(m.failed) || 0,
      pending: Number(m.pending) || 0,
    }))
  }, [analytics?.series?.mpesaOutcomesMonthly])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500">Generate and view Chama reports</p>
        </div>
        <Button onClick={() => exportToCSV(filtered)}>
          <FileDown size={18} />
          Export CSV
        </Button>
      </div>

      {/* Charts Section - same data source as Admin Dashboard / Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Contributions Over Time" description="Monthly contribution trends">
          <AdminContributionsChart data={contributionsByMonth} />
        </ChartCard>

        <ChartCard title="Loan Portfolio Breakdown" description="Distribution of loan statuses">
          <LoanStatusChart data={loanStatusData} />
        </ChartCard>

        <ChartCard title="Cashflow Overview" description="Money in vs money out">
          <CashflowChart data={cashflowData} />
        </ChartCard>

        <ChartCard title="Mpesa Payment Trends" description="Success/failure/pending trends">
          <MpesaTrendsChart data={mpesaTrends} />
        </ChartCard>
      </div>

      {/* Reports table */}
      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-800">Generated Reports</h2>
          <p className="text-sm text-slate-500">Previously generated report list</p>
        </div>
        <CardContent className="p-4">
          <div className="mb-4 max-w-xs">
            <Input
              placeholder="Search reports..."
              icon={<Search size={18} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-auto">
            <TableShell>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableEmpty colSpan={3} message="No reports match your filters." />
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.period}</TableCell>
                      <TableCell>{formatDateShort(r.generated)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </TableShell>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
