import type { HTMLAttributes } from 'react'

export function TableShell({
  className = '',
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200/80 bg-white max-w-full [-webkit-overflow-scrolling:touch]">
      <table className={`w-full min-w-[400px] ${className}`} {...props} />
    </div>
  )
}

export function TableHeader({
  className = '',
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`border-b border-slate-200 bg-slate-50/80 ${className}`}
      {...props}
    />
  )
}

export function TableBody({
  className = '',
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-slate-100 ${className}`} {...props} />
}

export function TableRow({
  className = '',
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-slate-50/80 transition-colors ${className}`} {...props} />
}

type TableEmptyProps = {
  colSpan: number
  message?: string
}

export function TableEmpty({ colSpan, message = 'No data found.' }: TableEmptyProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-16 text-center text-slate-500 text-sm"
      >
        {message}
      </td>
    </tr>
  )
}

export function TableHead({
  className = '',
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 ${className}`}
      {...props}
    />
  )
}

export function TableCell({
  className = '',
  ...props
}: HTMLAttributes<HTMLTableCellElement> & { colSpan?: number }) {
  return (
    <td
      className={`px-4 py-3 text-sm text-slate-700 ${className}`}
      {...props}
    />
  )
}
