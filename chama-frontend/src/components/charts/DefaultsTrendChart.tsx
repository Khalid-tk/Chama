import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type DefaultsTrendChartProps = {
  data: Array<{ month: string; lateCount: number; overdueCount?: number }>
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(244,63,94,0.25)',
  borderRadius: '12px',
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  color: '#111827',
  fontSize: 12,
}

export function DefaultsTrendChart({ data }: DefaultsTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: number | undefined, name: string | undefined) => [val !== undefined ? val : 0, name === 'lateCount' ? 'Late' : 'Overdue']} cursor={{ fill: 'rgba(244,63,94,0.05)' }} />
        <Bar dataKey="lateCount" name="Late" fill="#F43F5E" fillOpacity={0.8} radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
