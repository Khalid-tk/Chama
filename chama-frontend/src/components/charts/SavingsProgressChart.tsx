import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type SavingsProgressChartProps = {
  totalContributions: number
}

export function SavingsProgressChart({ totalContributions }: SavingsProgressChartProps) {
  // Generate mock progress data over 6 months
  const monthlyTarget = totalContributions / 6
  const chartData = Array.from({ length: 6 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
    savings: Math.round(monthlyTarget * (i + 1)),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #c7d2fe',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, 'Savings'] : ['', '']}
        />
        <Area
          type="monotone"
          dataKey="savings"
          stroke="#2563eb"
          fill="url(#colorSavings)"
          strokeWidth={2}
        />
        <defs>
          <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  )
}
