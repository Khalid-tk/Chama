import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type SavingsProgressChartProps = {
  totalContributions: number
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(34,211,238,0.2)',
  borderRadius: '12px',
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  color: '#111827',
  fontSize: 12,
}

export function SavingsProgressChart({ totalContributions }: SavingsProgressChartProps) {
  const monthlyTarget = totalContributions / 6
  const chartData = Array.from({ length: 6 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
    savings: Math.round(monthlyTarget * (i + 1)),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22D3EE" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: number | undefined) => val !== undefined ? [`KES ${val.toLocaleString()}`, 'Savings'] : ['', '']} cursor={{ stroke: 'rgba(34,211,238,0.2)', strokeWidth: 1 }} />
        <Area type="monotone" dataKey="savings" stroke="#22D3EE" strokeWidth={2.5} fill="url(#savingsGrad)" dot={false} activeDot={{ r: 5, fill: '#22D3EE', stroke: '#FFFFFF', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
