import type { HTMLAttributes } from 'react'

/** Card — warm parchment surface with framed styling. */
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-ink-300 bg-warm-card ${className}`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
      {...props}
    />
  )
}

/**
 * CardHeader — deeper parchment tone for the header section,
 * creating a visual document-section feel.
 */
export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-ink-300 bg-warm-deep px-5 py-4 ${className}`}
      {...props}
    />
  )
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-4 py-4 ${className}`} {...props} />
}
