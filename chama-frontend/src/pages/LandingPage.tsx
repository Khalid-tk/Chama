import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart2, Shield, Users, CreditCard, Wallet,
  Smartphone, ChevronRight,
} from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'

/* ─── Data ────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Wallet,    title: 'Contribution Tracking',  desc: 'Record every payment — M-Pesa, bank transfer, or cash. Full audit trail, zero gaps.' },
  { icon: CreditCard,title: 'Loan Management',         desc: 'Members apply online, admins review and approve. Repayment schedules tracked automatically.' },
  { icon: BarChart2, title: 'Analytics & Reports',     desc: 'Dashboard charts, trend analysis, and one-click CSV exports for every reporting period.' },
  { icon: Smartphone,title: 'M-Pesa Integration',      desc: 'STK push for collections. Payments reconcile automatically against member accounts.' },
  { icon: Users,     title: 'Member Management',       desc: 'Role-based access, contribution consistency scores, and transparent per-member records.' },
  { icon: Shield,    title: 'Audit & Compliance',      desc: 'Every transaction logged, timestamped, and linked to the responsible user.' },
]

const STEPS = [
  { n: '01', title: 'Create your chama',  desc: 'Set up the group, define roles, and configure contribution schedules.' },
  { n: '02', title: 'Invite members',      desc: 'Members join via email invite or chama code. Roles assigned on entry.' },
  { n: '03', title: 'Collect & disburse', desc: 'Collect contributions via M-Pesa. Review and approve loan applications.' },
  { n: '04', title: 'Analyze & report',   desc: 'Dashboard shows health at a glance. Export reports for meetings.' },
]

const TESTIMONIALS = [
  { name: 'Grace Mwangi',  role: 'Treasurer — Nairobi',  quote: 'The analytics dashboard alone saves us three hours every month. It\'s indispensable.' },
  { name: 'David Otieno',  role: 'Chairperson — Kisumu', quote: 'Every member can log in and see exactly where their money is. No more disputes.' },
  { name: 'Amina Hassan',  role: 'Secretary — Mombasa',  quote: 'The loan tracking and repayment reminders changed how our group operates.' },
]

const STATS = [
  { value: '2,400+',   label: 'Active members' },
  { value: 'KES 18M+', label: 'Contributions tracked' },
  { value: '94%',      label: 'M-Pesa success rate' },
  { value: '< 5 min',  label: 'Setup time' },
]

/* ─── Component ───────────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-bg text-ink-900">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-ink-300 bg-warm-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/"><BrandLogo size="sm" showWordmark /></Link>

          <nav className="hidden md:flex items-center gap-7">
            {(['Features', 'How it works', 'Reviews'] as const).map((label, i) => (
              <a key={label}
                href={['#features','#how','#reviews'][i]}
                className="text-sm font-medium text-ink-700 hover:text-brown transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-ink-700 hover:text-brown transition-colors">Sign in</Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 rounded-md bg-brown px-4 py-2 text-sm font-semibold text-warm-card hover:bg-brown-dark transition-colors">
              Get started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="border-b border-ink-300 bg-warm-bg">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left — copy */}
            <div>
              {/* Editorial label */}
              <div className="mb-5 inline-flex items-center gap-2 rounded border border-ink-300 bg-warm-deep px-3 py-1 text-xs font-medium tracking-widest text-ink-500 uppercase">
                Built for Kenyan savings groups
              </div>

              {/* Serif headline */}
              <h1 className="mb-5 text-4xl font-bold leading-tight text-ink-900 sm:text-5xl"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', lineHeight: '1.2' }}>
                The financial platform your chama actually needs
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-ink-700 max-w-lg">
                Contributions, loans, repayments, M-Pesa — all in one place. Built for transparency, built for trust.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-brown px-6 py-3 text-sm font-semibold text-warm-card hover:bg-brown-dark transition-colors">
                  Start for free <ArrowRight size={15} />
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-md border border-ink-300 bg-warm-card px-6 py-3 text-sm font-semibold text-ink-700 hover:bg-warm-deep transition-colors">
                  Sign in to your account
                </Link>
              </div>
              <p className="mt-4 text-xs text-ink-400">No credit card required. Free to set up.</p>
            </div>

            {/* Right — product preview */}
            <div className="relative">
              {/* Outer frame — parchment ledger feel */}
              <div className="rounded-xl border border-ink-300 bg-warm-deep overflow-hidden"
                style={{ boxShadow: '0 4px 24px rgba(47,36,29,0.12)' }}>

                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 border-b border-ink-300 bg-warm-card px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-ink-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-ink-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-ink-300" />
                  <div className="mx-auto h-5 w-48 rounded-sm bg-warm-deep text-[10px] text-ink-400 flex items-center justify-center">app.chama.co.ke</div>
                </div>

                {/* App shell mockup */}
                <div className="flex h-72">
                  {/* Sidebar */}
                  <div className="w-36 shrink-0 border-r border-ink-300 bg-warm-sidebar p-3 space-y-1">
                    <div className="mb-3 h-5 w-20 rounded bg-white/10" />
                    {['Dashboard','Members','Contributions','Loans','Reports'].map(n => (
                      <div key={n} className={`h-7 rounded px-2 flex items-center text-[10px] ${n === 'Dashboard' ? 'bg-brown text-warm-card' : 'text-ink-300'}`}>
                        {n}
                      </div>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 space-y-3 overflow-hidden bg-warm-bg">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Total Balance', val: 'KES 284K', color: 'text-ink-900' },
                        { label: 'Outstanding',   val: 'KES 42K',  color: 'text-amber-700' },
                        { label: 'Members',        val: '24',       color: 'text-ink-900' },
                      ].map(k => (
                        <div key={k.label} className="rounded-md border border-ink-300 bg-warm-card p-2.5">
                          <p className="text-[9px] text-ink-500 mb-1">{k.label}</p>
                          <p className={`text-sm font-bold ${k.color}`}>{k.val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Chart placeholder */}
                    <div className="rounded-md border border-ink-300 bg-warm-card p-3">
                      <p className="text-[9px] font-medium text-ink-500 mb-2">Contribution Trends</p>
                      <svg viewBox="0 0 200 40" className="w-full">
                        <polyline points="0,32 40,26 80,18 120,22 160,10 200,8" fill="none" stroke="#8A5A3B" strokeWidth="1.5" strokeLinejoin="round" />
                        <polyline points="0,32 40,26 80,18 120,22 160,10 200,8 200,40 0,40" fill="#8A5A3B" fillOpacity="0.08" />
                      </svg>
                    </div>

                    {/* Recent rows */}
                    <div className="space-y-1">
                      {[
                        { name: 'Grace M.',        amount: '+KES 5,000',  cls: 'text-forest' },
                        { name: 'David O.',         amount: '+KES 5,000',  cls: 'text-forest' },
                        { name: 'Loan — Amina H.',  amount: '-KES 15,000', cls: 'text-red-700' },
                      ].map(r => (
                        <div key={r.name} className="flex items-center justify-between rounded border border-ink-200 bg-warm-card px-2.5 py-1.5">
                          <span className="text-[10px] text-ink-700">{r.name}</span>
                          <span className={`text-[10px] font-semibold ${r.cls}`}>{r.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <section className="border-b border-ink-300 bg-warm-deep">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-brown sm:text-3xl"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{s.value}</p>
                <p className="mt-1 text-sm text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="border-b border-ink-300 bg-warm-bg">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brown">Features</p>
            <h2 className="text-3xl font-bold text-ink-900 sm:text-4xl">Everything your group needs</h2>
            <p className="mt-3 text-base text-ink-700 max-w-xl">A complete financial management platform, not just a tracker.</p>
            {/* Editorial rule */}
            <div className="mt-5 w-16 border-t-2 border-gold" />
          </div>

          <div className="grid gap-px bg-ink-300 sm:grid-cols-2 lg:grid-cols-3 rounded-lg overflow-hidden border border-ink-300">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-warm-card px-6 py-6 hover:bg-warm-deep transition-colors">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-brown-light">
                  <Icon size={18} className="text-brown" strokeWidth={1.8} />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-ink-900">{title}</h3>
                <p className="text-sm leading-relaxed text-ink-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section id="how" className="border-b border-ink-300 bg-warm-deep">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brown">Process</p>
            <h2 className="text-3xl font-bold text-ink-900 sm:text-4xl">How it works</h2>
            <p className="mt-3 text-base text-ink-700 max-w-lg">From setup to your first report in under an hour.</p>
            <div className="mt-5 w-16 border-t-2 border-gold" />
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative">
                {/* Step number — editorial large numeral */}
                <p className="mb-3 text-4xl font-bold text-ink-200 select-none"
                  style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>{n}</p>
                {/* Warm divider */}
                <div className="mb-4 w-8 border-t-2 border-brown" />
                <h3 className="mb-2 text-sm font-semibold text-ink-900">{title}</h3>
                <p className="text-sm leading-relaxed text-ink-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section id="reviews" className="border-b border-ink-300 bg-warm-bg">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brown">Reviews</p>
            <h2 className="text-3xl font-bold text-ink-900 sm:text-4xl">What groups are saying</h2>
            <div className="mt-5 w-16 border-t-2 border-gold" />
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, quote }) => (
              <div key={name} className="rounded-lg border border-ink-300 bg-warm-card px-6 py-7"
                style={{ boxShadow: 'var(--shadow-xs)' }}>
                {/* Opening quote mark */}
                <p className="mb-1 text-3xl leading-none text-gold select-none"
                  style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>&ldquo;</p>
                <p className="mb-5 text-sm leading-relaxed text-ink-700 italic">
                  {quote}
                </p>
                <div className="border-t border-ink-200 pt-4">
                  <p className="text-sm font-semibold text-ink-900">{name}</p>
                  <p className="text-xs text-ink-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="border-b border-ink-900 bg-warm-sidebar">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 text-center">
          {/* Fine rule at top */}
          <div className="mx-auto mb-8 w-24 border-t border-ink-300" />
          <h2 className="mb-4 text-3xl font-bold text-warm-card sm:text-4xl"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Ready to bring your chama online?
          </h2>
          <p className="mb-8 text-base text-ink-300 max-w-lg mx-auto">
            Join thousands of savings group members who manage their finances with clarity and confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-brown px-7 py-3 text-sm font-semibold text-warm-card hover:bg-brown-dark transition-colors">
              Create a free account <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-md border border-ink-300 bg-transparent px-7 py-3 text-sm font-semibold text-ink-300 hover:bg-white/[0.05] transition-colors">
              Sign in <ChevronRight size={14} />
            </Link>
          </div>
          <div className="mx-auto mt-8 w-24 border-t border-ink-700" />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-warm-sidebar">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <BrandLogo size="sm" showWordmark variant="light" />
              <p className="mt-2 text-xs text-ink-400">Financial management for savings groups.</p>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-2 text-xs text-ink-400">
              <Link to="/login"    className="hover:text-warm-card transition-colors">Sign in</Link>
              <Link to="/register" className="hover:text-warm-card transition-colors">Register</Link>
              <a href="#features"  className="hover:text-warm-card transition-colors">Features</a>
              <a href="#how"       className="hover:text-warm-card transition-colors">How it works</a>
            </div>
          </div>
          <div className="mt-8 border-t border-ink-700 pt-6 text-xs text-ink-500">
            &copy; {new Date().getFullYear()} Chama. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
