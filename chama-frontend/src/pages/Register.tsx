import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { BrandLogo } from '../components/BrandLogo'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useChamaStore } from '../store/chamaStore'

const PERKS = [
  'Free to create and get started',
  'Contributions tracked automatically',
  'Loan approvals managed in-app',
  'Real-time analytics dashboard',
  'M-Pesa integration built in',
]

export function Register() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuthStore()
  const { clearActiveChama }  = useChamaStore()

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [showCf, setShowCf]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { fullName: form.fullName, email: form.email, phone: form.phone || undefined, password: form.password })
      const { token, user, memberships } = res.data.data
      storeLogin(token, user, memberships ?? [])
      clearActiveChama()
      navigate('/select-chama')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleGoogle = async (credentialResponse: any) => {
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/google', { idToken: credentialResponse.credential })
      const { token, user, memberships } = res.data.data
      storeLogin(token, user, memberships ?? [])
      clearActiveChama()
      navigate('/select-chama')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Google sign-up failed.')
    } finally { setLoading(false) }
  }

  /* Shared password input class (not extracted as INPUT_CLS — use the Input component instead) */
  const pwCls = 'w-full rounded-md border border-ink-300 bg-warm-card px-3.5 py-2.5 pr-9 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brown focus:outline-none focus:ring-1 focus:ring-brown/20 transition-colors'

  return (
    <div className="min-h-screen flex overflow-hidden bg-warm-bg">

      {/* ── Left — branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col bg-warm-sidebar px-10 py-10 xl:px-12">
        <Link to="/"><BrandLogo size="sm" showWordmark variant="light" /></Link>

        <div className="flex flex-1 flex-col justify-center max-w-sm">
          <h2 className="text-3xl font-bold text-warm-card leading-snug mb-3"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Bring your chama online.
          </h2>
          <div className="mb-6 w-12 border-t border-gold" />
          <p className="text-sm text-ink-300 mb-10 leading-relaxed">
            Create your account and have your group fully set up in under five minutes.
          </p>

          <ul className="space-y-3">
            {PERKS.map(r => (
              <li key={r} className="flex items-start gap-3">
                <span className="mt-1.5 h-1 w-4 shrink-0 border-t border-gold" />
                <span className="text-sm text-ink-300">{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-ink-500">
          &copy; {new Date().getFullYear()} Chama. All rights reserved.
        </p>
      </div>

      {/* ── Right — form ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-warm-bg">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4 lg:hidden">
          <Link to="/"><BrandLogo size="sm" showWordmark /></Link>
          <Link to="/login" className="text-sm font-medium text-brown hover:text-brown-dark transition-colors">Sign in</Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[380px]">
          <div className="rounded-lg border border-ink-300 bg-warm-card px-8 py-8"
            style={{ boxShadow: 'var(--shadow-sm)' }}>

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-ink-900"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                Create your account
              </h1>
              <div className="mt-2 mb-3 w-10 border-t border-gold" />
              <p className="text-sm text-ink-500">Fill in your details to get started.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-3">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v4a1 1 0 102 0V9a1 1 0 10-2 0zm0-4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full name" type="text" required autoComplete="name" value={form.fullName} onChange={set('fullName')} placeholder="Jane Doe" />
              <Input label="Email address" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              <Input label="Phone" hint="Optional. Required for M-Pesa payments." type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+254 700 000 000" />

              {/* Password — eye toggle not in Input component, inline here */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="Minimum 8 characters" className={pwCls} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">Confirm password</label>
                <div className="relative">
                  <input type={showCf ? 'text' : 'password'} required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat your password" className={pwCls} />
                  <button type="button" onClick={() => setShowCf(!showCf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors">
                    {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Create account
              </Button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-warm-deep" />
              <span className="text-xs text-ink-400">or sign up with</span>
              <div className="flex-1 h-px bg-warm-deep" />
            </div>

            {/* Google */}
            <div className="flex justify-center [&>div]:w-full [&_iframe]:w-full">
              <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-up failed.')} theme="outline" shape="rectangular" width="100%" />
            </div>

          </div>{/* end panel card */}

            {/* Footer links */}
            <p className="mt-5 text-center text-sm text-ink-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brown hover:text-brown-dark transition-colors">Sign in</Link>
            </p>
            <p className="mt-2 text-center">
              <Link to="/" className="text-xs text-ink-400 hover:text-ink-700 transition-colors">Back to home</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
