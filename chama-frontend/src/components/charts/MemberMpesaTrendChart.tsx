import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type MemberMpesaTrendChartProps = {
  data: Array<{ date: string; success: number; failed: number; pending: number }>
}

export function MemberMpesaTrendChart({ data }: MemberMpesaTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
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
          dataKey="success"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
          name="Success"
        />
        <Line
          type="monotone"
          dataKey="failed"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: '#ef4444', r: 4 }}
          name="Failed"
        />
        <Line
          type="monotone"
          dataKey="pending"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ fill: '#f59e0b', r: 4 }}
          name="Pending"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
