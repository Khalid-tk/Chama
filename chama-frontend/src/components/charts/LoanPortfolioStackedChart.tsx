import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type LoanPortfolioStackedChartProps = {
  data: Array<{ month: string; active: number; late: number; repaid: number }>
}

export function LoanPortfolioStackedChart({ data }: LoanPortfolioStackedChartProps) {
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
        />
        <Legend />
        <Bar dataKey="repaid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
        <Bar dataKey="active" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
        <Bar dataKey="late" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
