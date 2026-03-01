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

export function DateRangeFilter({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0 w-full sm:w-auto">
      <Calendar size={18} className="text-slate-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DateRange)}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="this_month">This Month</option>
        <option value="last_3_months">Last 3 Months</option>
        <option value="last_6_months">Last 6 Months</option>
        <option value="custom">Custom Range</option>
      </select>
      {value === 'custom' && (
        <>
          <input
            type="date"
            value={customStart || ''}
            onChange={(e) => onCustomStartChange?.(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={customEnd || ''}
            onChange={(e) => onCustomEndChange?.(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </>
      )}
    </div>
  )
}
