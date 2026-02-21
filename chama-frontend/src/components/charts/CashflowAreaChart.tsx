import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type CashflowAreaChartProps = {
  data: Array<{ month: string; in: number; out: number }>
}

export function CashflowAreaChart({ data }: CashflowAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, ''] : ['', '']}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="in"
          stackId="1"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.6}
          name="Money In"
        />
        <Area
          type="monotone"
          dataKey="out"
          stackId="2"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.6}
          name="Money Out"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
