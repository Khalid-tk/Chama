import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type RiskDistributionChartProps = {
  data: Array<{ level: 'Low' | 'Medium' | 'High'; count: number }>
}

const COLORS = {
  Low: '#10b981', // emerald-500
  Medium: '#f59e0b', // amber-500
  High: '#ef4444', // red-500
}

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  const chartData = data.map((item) => ({
    name: item.level,
    value: item.count,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [value, 'Count'] : ['', '']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
