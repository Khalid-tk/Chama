import type { ReactNode, InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'

type FilterBarProps = {
  search?: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }
  filters?: ReactNode
  actions?: ReactNode
  className?: string
}

export function FilterBar({ search, filters, actions, className = '' }: FilterBarProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {search && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              type="search"
              value={search.value}
              onChange={e => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? 'Search…'}
              className="h-9 w-56 rounded-md border border-ink-300 bg-warm-card pl-8 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brown focus:outline-none focus:ring-1 focus:ring-brown/20 transition-colors"
            />
          </div>
        )}
        {filters}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

export function FilterSelect({ className = '', ...props }: InputHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-9 rounded-md border border-ink-300 bg-warm-card px-3 text-sm text-ink-700 focus:border-brown focus:outline-none focus:ring-1 focus:ring-brown/20 transition-colors cursor-pointer ${className}`}
      {...props}
    />
  )
}
