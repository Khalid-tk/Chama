import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string | number | ReactNode
  className?: string
}

export function StatCard({ icon: Icon, label, value, className = '' }: StatCardProps) {
  const isPlain = typeof value === 'string' || typeof value === 'number'
  return (
    <div
      className={`flex min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-6 ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-12 sm:w-12">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden" style={{ width: '1px' }}>
        <p className="truncate text-sm font-medium text-slate-500">{label}</p>
        {isPlain ? (
          <p className="truncate text-base font-semibold text-slate-800 sm:text-xl">{String(value)}</p>
        ) : (
          <div className="flex min-w-0 flex-col overflow-hidden text-base font-semibold text-slate-800 sm:text-xl [&>*]:truncate">
            {value}
          </div>
        )}
      </div>
    </div>
  )
}
