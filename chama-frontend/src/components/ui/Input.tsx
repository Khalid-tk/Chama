import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  icon?: React.ReactNode
  error?: string
}

export function Input({ label, icon, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500 min-h-[44px] sm:min-h-0 ${
            icon ? 'pl-10' : 'pl-4'
          } ${error ? 'border-red-300' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
