import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type ContributionConsistencyChartProps = {
  data: Array<{ month: string; amount: number; missed: boolean }>
}

export function ContributionConsistencyChart({ data }: ContributionConsistencyChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => {
            if (value === undefined) return ['', '']
            return [`KES ${value.toLocaleString()}`, 'Amount']
          }}
        />
        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.missed ? '#ef4444' : '#2563eb'} // Red for missed, blue for paid
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
