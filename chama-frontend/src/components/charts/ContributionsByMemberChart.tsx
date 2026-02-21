import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type ContributionsByMemberChartProps = {
  data: Array<{ member: string; amount: number }>
}

export function ContributionsByMemberChart({ data }: ContributionsByMemberChartProps) {
  // Sort by amount descending and take top 10
  const topMembers = [...data]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map(item => ({
      member: item.member.split(' ')[0], // Use first name for brevity
      amount: item.amount,
    }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={topMembers} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#64748b" fontSize={12} />
        <YAxis dataKey="member" type="category" stroke="#64748b" fontSize={12} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => value !== undefined ? [`KES ${value.toLocaleString()}`, 'Amount'] : ['', '']}
        />
        <Bar dataKey="amount" fill="#2563eb" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
