import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type LoanPortfolioStackedChartProps = {
  data: Array<{ month: string; active: number; late: number; repaid: number }>
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(79,70,229,0.2)',
  borderRadius: '12px',
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  color: '#111827',
  fontSize: 12,
}

export function LoanPortfolioStackedChart({ data }: LoanPortfolioStackedChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.05)' }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
        <Bar dataKey="active" name="Active" stackId="a" fill="#4F46E5" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
        <Bar dataKey="late"   name="Late"   stackId="a" fill="#F43F5E" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
        <Bar dataKey="repaid" name="Repaid" stackId="a" fill="#10B981" fillOpacity={0.85} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
