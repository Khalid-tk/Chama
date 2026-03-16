import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type ContributionsTrendChartProps = {
  data: Array<{ date: string; amount: number }>
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  color: '#111827',
  fontSize: 13,
}

export function ContributionsTrendChart({ data }: ContributionsTrendChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
    amount: item.amount,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, 'Contributions'] : ['', 'Contributions']}
          cursor={{ stroke: 'rgba(79,70,229,0.2)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#4F46E5"
          strokeWidth={2.5}
          fill="url(#contribGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
