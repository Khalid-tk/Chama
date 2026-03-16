import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  icon?: React.ReactNode
  error?: string
  hint?: string
}

export function Input({ label, icon, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            {icon}
          </div>
        )}
        <input
          className={[
            'w-full rounded-md border bg-warm-card text-sm text-ink-900',
            'placeholder:text-ink-400',
            'focus:outline-none focus:ring-2 focus:ring-brown focus:ring-offset-0',
            'disabled:bg-warm-deep disabled:text-ink-400',
            'transition-colors',
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
              : 'border-ink-300 focus:border-brown',
            icon ? 'pl-9 pr-3.5 py-2.5' : 'px-3.5 py-2.5',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  )
}
