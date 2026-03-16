import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type CashflowAreaChartProps = {
  data: Array<{ month: string; in: number; out: number }>
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(79,70,229,0.2)',
  borderRadius: '12px',
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  color: '#111827',
  fontSize: 12,
}

export function CashflowAreaChart({ data }: CashflowAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10B981" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F43F5E" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: number | undefined, name: string | undefined) => val !== undefined ? [`KES ${val.toLocaleString()}`, name === 'in' ? 'Inflow' : 'Outflow'] : ['', name ?? '']} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} formatter={(val) => val === 'in' ? 'Inflow' : 'Outflow'} />
        <Area type="monotone" dataKey="in" stroke="#10B981" strokeWidth={2} fill="url(#inflowGrad)" dot={false} activeDot={{ r: 4, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }} />
        <Area type="monotone" dataKey="out" stroke="#F43F5E" strokeWidth={2} fill="url(#outflowGrad)" dot={false} activeDot={{ r: 4, fill: '#F43F5E', stroke: '#FFFFFF', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
