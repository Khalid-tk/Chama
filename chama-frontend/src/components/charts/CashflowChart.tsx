import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type CashflowChartProps = {
  data: Array<{ month: string; in: number; out: number }>
}

export function CashflowChart({ data }: CashflowChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #c7d2fe',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, ''] : ['', '']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="in"
          stroke="#10b981"
          strokeWidth={2}
          name="Money In"
          dot={{ fill: '#10b981', r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="out"
          stroke="#ef4444"
          strokeWidth={2}
          name="Money Out"
          dot={{ fill: '#ef4444', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
