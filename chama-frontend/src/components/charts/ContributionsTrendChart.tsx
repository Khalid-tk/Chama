import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type ContributionsTrendChartProps = {
  data: Array<{ date: string; amount: number }>
}

export function ContributionsTrendChart({ data }: ContributionsTrendChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: item.amount,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #c7d2fe',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, 'Amount'] : ['', '']}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ fill: '#2563eb', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
