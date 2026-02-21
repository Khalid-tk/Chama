import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type MpesaTrendsChartProps = {
  data: Array<{ date: string; success: number; failed: number; pending: number }>
}

export function MpesaTrendsChart({ data }: MpesaTrendsChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    success: item.success,
    failed: item.failed,
    pending: item.pending,
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
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="success"
          stroke="#10b981"
          strokeWidth={2}
          name="Success"
          dot={{ fill: '#10b981', r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="failed"
          stroke="#ef4444"
          strokeWidth={2}
          name="Failed"
          dot={{ fill: '#ef4444', r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="pending"
          stroke="#f59e0b"
          strokeWidth={2}
          name="Pending"
          dot={{ fill: '#f59e0b', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
