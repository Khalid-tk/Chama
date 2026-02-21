import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type LoanStatusChartProps = {
  data: Array<{ status: string; count: number }>
}

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Active: '#10b981',
  Repaid: '#2563eb',
}

export function LoanStatusChart({ data }: LoanStatusChartProps) {
  const chartData = data.map((item) => ({
    status: item.status,
    count: item.count,
    fill: STATUS_COLORS[item.status] || '#8b5cf6',
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
        <XAxis dataKey="status" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #c7d2fe',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [value, 'Loans'] : [0, 'Loans']}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
