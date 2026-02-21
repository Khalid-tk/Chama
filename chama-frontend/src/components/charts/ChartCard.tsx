import type { ReactNode } from 'react'

type ChartCardProps = {
  title: string
  description?: string
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  children: ReactNode
}

export function ChartCard({
  title,
  description,
  loading,
  empty,
  emptyMessage = 'No data',
  children,
}: ChartCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm max-w-full overflow-hidden">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 sm:text-lg">{title}</h3>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      <div className="h-[240px] sm:h-[260px] lg:h-[280px] w-full min-h-[200px] max-w-full relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          </div>
        )}
        {!loading && empty && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            {emptyMessage}
          </div>
        )}
        {!loading && !empty && children}
      </div>
    </div>
  )
}
