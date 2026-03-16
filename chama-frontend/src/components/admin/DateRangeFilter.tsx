import { Calendar } from 'lucide-react'

export type DateRange = 'this_month' | 'last_3_months' | 'last_6_months' | 'custom'

type DateRangeFilterProps = {
  value: DateRange
  onChange: (range: DateRange) => void
  customStart?: string
  customEnd?: string
  onCustomStartChange?: (date: string) => void
  onCustomEndChange?: (date: string) => void
}

const selectCls = 'rounded-md border border-ink-300 bg-warm-card px-3 py-1.5 text-sm text-ink-700 focus:border-brown focus:outline-none focus:ring-1 focus:ring-brown/20 transition-colors h-9'

export function DateRangeFilter({ value, onChange, customStart, customEnd, onCustomStartChange, onCustomEndChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar size={14} className="text-ink-400 shrink-0" />
      <select value={value} onChange={e => onChange(e.target.value as DateRange)} className={`${selectCls} cursor-pointer`}>
        <option value="this_month">This month</option>
        <option value="last_3_months">Last 3 months</option>
        <option value="last_6_months">Last 6 months</option>
        <option value="custom">Custom range</option>
      </select>
      {value === 'custom' && (
        <>
          <input type="date" value={customStart ?? ''} onChange={e => onCustomStartChange?.(e.target.value)} className={selectCls} />
          <span className="text-xs text-ink-400">–</span>
          <input type="date" value={customEnd ?? ''} onChange={e => onCustomEndChange?.(e.target.value)} className={selectCls} />
        </>
      )}
    </div>
  )
}
