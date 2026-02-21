import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'

type LoanRepaymentChartProps = {
  paid: number
  total: number
}

export function LoanRepaymentChart({ paid, total }: LoanRepaymentChartProps) {
  const remaining = total - paid
  const percentage = Math.round((paid / total) * 100)

  const data = [
    { name: 'Paid', value: paid, fill: '#10b981' },
    { name: 'Remaining', value: remaining, fill: '#e5e7eb' },
  ]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="90%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar dataKey="value" cornerRadius={10} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #c7d2fe',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, 'Amount'] : ['', '']}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-slate-800"
        >
          {percentage}%
        </text>
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm fill-slate-500"
        >
          Paid
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  )
}
