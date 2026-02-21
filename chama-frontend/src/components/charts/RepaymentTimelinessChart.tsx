import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type RepaymentTimelinessChartProps = {
  data: Array<{ period: string; onTime: number; late: number }>
}

export function RepaymentTimelinessChart({ data }: RepaymentTimelinessChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="onTime" stackId="a" fill="#10b981" name="On Time" radius={[0, 0, 0, 0]} />
        <Bar dataKey="late" stackId="a" fill="#ef4444" name="Late" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
