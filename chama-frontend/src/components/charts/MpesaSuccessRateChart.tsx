import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type MpesaSuccessRateChartProps = {
  data: Array<{ week: string; successRate: number; total: number }>
}

export function MpesaSuccessRateChart({ data }: MpesaSuccessRateChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          domain={[0, 100]}
          label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => {
            if (value === undefined) return ['', '']
            return [`${value.toFixed(1)}%`, 'Success Rate']
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="successRate"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ fill: '#2563eb', r: 4 }}
          name="Success Rate"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
