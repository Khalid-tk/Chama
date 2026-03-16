import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { BrandLogo } from '../BrandLogo'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl border border-ink-300/80 bg-white/80 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.7)] backdrop-blur-sm lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <BrandLogo size="md" showWordmark variant="light" />
            <h2 className="mt-10 text-3xl font-semibold tracking-tight">
              Trusted financial coordination for modern chamas.
            </h2>
            <p className="mt-4 max-w-md text-sm text-blue-100/90">
              Contributions, loans, repayments, and reporting in one elegant workspace built for transparency.
            </p>
          </div>
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
              <ShieldCheck size={16} />
              Bank-grade inspired controls
            </div>
            <p className="mt-2 text-sm text-blue-50/90">
              Fine-grained approvals, role-based access, and full activity visibility for every member.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={16} />
            Back to landing page
          </Link>

          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
            <p className="mt-2 text-sm text-ink-500">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
