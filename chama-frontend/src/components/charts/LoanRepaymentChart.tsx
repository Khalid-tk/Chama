import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'

type LoanRepaymentChartProps = {
  paid: number
  total: number
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(79,70,229,0.2)',
  borderRadius: '12px',
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  color: '#111827',
  fontSize: 12,
}

export function LoanRepaymentChart({ paid, total }: LoanRepaymentChartProps) {
  const remaining = Math.max(0, total - paid)
  const percentage = total > 0 ? Math.round((paid / total) * 100) : 0

  const data = [
    { name: 'Paid',      value: paid,      fill: '#10B981' },
    { name: 'Remaining', value: remaining, fill: 'rgba(255,255,255,0.06)' },
  ]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="85%" data={data} startAngle={90} endAngle={-270}>
        <RadialBar dataKey="value" cornerRadius={8} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, 'Amount'] : ['', '']} />
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#E8F3FF" fontSize={28} fontWeight={700}>
          {percentage}%
        </text>
        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="#9CA3AF" fontSize={12}>
          Repaid
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  )
}
