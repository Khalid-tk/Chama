import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  /** Eyebrow label shown above the title (e.g. "Members · 24 total") */
  eyebrow?: string
  actions?: ReactNode
  meta?: ReactNode
  className?: string
}

/**
 * PageHeader — the editorial masthead for every internal page.
 *
 * Visual structure:
 *   [eyebrow label]          ← section-label utility (gold dash + small-caps)
 *   Title in Playfair serif
 *   ── gold rule ─────────
 *   [description]
 *   [meta badges]
 *                                           [actions]
 */
export function PageHeader({ title, description, eyebrow, actions, meta, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-5 mb-6 border-b border-ink-200 ${className}`}>

      {/* Left — title block */}
      <div className="min-w-0">
        {eyebrow && (
          <p className="section-label mb-2">{eyebrow}</p>
        )}
        <h1
          className="text-2xl font-bold text-ink-900 leading-tight"
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          {title}
        </h1>
        {/* Gold accent rule — editorial underline */}
        <div className="mt-2.5 w-10 border-t-2 border-gold" />
        {description && (
          <p className="mt-2.5 text-sm text-ink-500 leading-relaxed max-w-xl">{description}</p>
        )}
        {meta && (
          <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>
        )}
      </div>

      {/* Right — actions */}
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
          {actions}
        </div>
      )}
    </div>
  )
}
