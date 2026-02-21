import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type DefaultsTrendChartProps = {
  data: Array<{ month: string; lateCount: number; overdueCount: number }>
}

export function DefaultsTrendChart({ data }: DefaultsTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="lateCount"
          stroke="#f59e0b"
          strokeWidth={2}
          name="Late Repayments"
          dot={{ fill: '#f59e0b', r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="overdueCount"
          stroke="#ef4444"
          strokeWidth={2}
          name="Overdue"
          dot={{ fill: '#ef4444', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
