import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brown focus-visible:ring-offset-2 focus-visible:ring-offset-warm-bg',
    'disabled:opacity-50 disabled:pointer-events-none',
  ].join(' ')

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:   'bg-brown text-warm-card hover:bg-brown-dark active:bg-brown-dark',
    secondary: 'bg-warm-card border border-ink-300 text-ink-700 hover:bg-warm-deep hover:border-ink-300',
    ghost:     'text-ink-700 hover:bg-warm-deep hover:text-ink-900',
    danger:    'bg-red-700 text-warm-card hover:bg-red-800',
    outline:   'border border-brown text-brown hover:bg-brown-light',
  }

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    xs: 'px-2.5 py-1.5 text-xs h-7',
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-9',
    lg: 'px-5 py-2.5 text-sm h-10',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  )
}
