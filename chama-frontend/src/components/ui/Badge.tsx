type BadgeProps = {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: BadgeProps) {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
