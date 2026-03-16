import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type TransactionDistributionChartProps = {
  transactions: Array<{ desc: string; amount: number; type: 'credit' | 'debit' }>
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

export function TransactionDistributionChart({ transactions }: TransactionDistributionChartProps) {
  const grouped = transactions.reduce((acc, t) => {
    acc[t.desc] = (acc[t.desc] || 0) + t.amount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(grouped).slice(0, 5).map(([name, value], i) => ({ name, value, color: COLORS[i] }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%" cy="50%"
          outerRadius="75%"
          innerRadius="45%"
          dataKey="value"
          paddingAngle={3}
          label={({ percent }) => percent !== undefined ? `${(percent * 100).toFixed(0)}%` : ''}
          labelLine={false}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} fillOpacity={0.9} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: number | undefined) => val !== undefined ? [`KES ${val.toLocaleString()}`, 'Amount'] : ['', '']} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
