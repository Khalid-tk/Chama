import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type ContributionsByMemberChartProps = {
  data: Array<{ member: string; amount: number }>
}

const COLORS = ['#4F46E5', '#22D3EE', '#10B981', '#818CF8', '#F59E0B', '#F472B6']

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(79,70,229,0.2)',
  borderRadius: '12px',
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  color: '#111827',
  fontSize: 12,
}

export function ContributionsByMemberChart({ data }: ContributionsByMemberChartProps) {
  const chartData = data.slice(0, 7).map((d) => ({
    name: d.member?.split(' ')[0] ?? 'Member',
    amount: d.amount,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: number | undefined) => val !== undefined ? [`KES ${val.toLocaleString()}`, 'Contributions'] : ['', 'Contributions']} cursor={{ fill: 'rgba(79,70,229,0.05)' }} />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
