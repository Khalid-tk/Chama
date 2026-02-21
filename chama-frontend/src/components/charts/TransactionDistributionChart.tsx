import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type TransactionDistributionChartProps = {
  transactions: Array<{ desc: string; amount: number; type: 'credit' | 'debit' }>
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

export function TransactionDistributionChart({ transactions }: TransactionDistributionChartProps) {
  // Group by description/category
  const grouped = transactions.reduce((acc, t) => {
    const key = t.desc
    acc[key] = (acc[key] || 0) + t.amount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(grouped).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #c7d2fe',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, 'Amount'] : ['', '']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
