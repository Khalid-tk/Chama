import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type MpesaTrendsChartProps = {
  data: Array<{ date: string; success: number; failed: number; pending: number }>
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(79,70,229,0.2)',
  borderRadius: '12px',
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  color: '#111827',
  fontSize: 12,
}

export function MpesaTrendsChart({ data }: MpesaTrendsChartProps) {
  const chartData = data.map((d) => ({
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }),
    success: d.success,
    failed: d.failed,
    pending: d.pending,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.05)' }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
        <Bar dataKey="success" name="Success" fill="#10B981" fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="failed"  name="Failed"  fill="#F43F5E" fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="pending" name="Pending" fill="#F59E0B" fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
