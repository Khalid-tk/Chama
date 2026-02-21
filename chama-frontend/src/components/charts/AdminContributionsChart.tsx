import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type AdminContributionsChartProps = {
  data: Array<{ month: string; amount: number }>
}

export function AdminContributionsChart({ data }: AdminContributionsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #c7d2fe',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, 'Amount'] : ['', '']}
        />
        <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
