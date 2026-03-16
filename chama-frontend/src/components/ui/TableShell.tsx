import type { HTMLAttributes, ReactNode } from 'react'

export function TableShell({ className = '', ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-ink-300 bg-warm-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <table className={`w-full min-w-[440px] text-sm ${className}`} {...props} />
    </div>
  )
}

/** Table header section — uses deeper parchment to frame the column labels */
export function TableHeader({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`bg-warm-deep ${className}`} {...props} />
}

export function TableBody({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-ink-200 ${className}`} {...props} />
}

export function TableRow({ className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-warm-bg transition-colors ${className}`} {...props} />
}

/** Column header — editorial tracked uppercase */
export function TableHead({ className = '', ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-ink-300 px-4 py-3 text-left text-ink-500 ${className}`}
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
      }}
      {...props}
    />
  )
}

export function TableCell({ className = '', ...props }: HTMLAttributes<HTMLTableCellElement> & { colSpan?: number }) {
  return <td className={`px-4 py-3.5 text-ink-700 ${className}`} {...props} />
}

export function TableEmpty({ colSpan, message = 'No records found.', children }: { colSpan: number; message?: string; children?: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          {/* Archival document icon */}
          <svg className="h-9 w-9 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-sm text-ink-400">{children ?? message}</span>
        </div>
      </td>
    </tr>
  )
}
