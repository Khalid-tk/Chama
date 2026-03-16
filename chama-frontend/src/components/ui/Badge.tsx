type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'blue' | 'purple'

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-50   text-amber-800   ring-amber-200',
  danger:  'bg-red-50     text-red-800     ring-red-200',
  neutral: 'bg-ink-100    text-ink-700     ring-ink-300',
  blue:    'bg-brown-light text-brown-dark  ring-ink-300',
  purple:  'bg-ink-100    text-ink-700     ring-ink-300',
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}
