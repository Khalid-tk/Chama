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

const REASONS = [
  'Contribution tracking with full audit trail',
  'Loan applications reviewed and approved in-app',
  'M-Pesa STK push with automatic reconciliation',
  'Analytics dashboard built for transparency',
]

export function Login() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuthStore()
  const { clearActiveChama }  = useChamaStore()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const doLogin = async (e: string, p: string) => {
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email: e, password: p })
      storeLogin(data.token, data.user, data.memberships ?? [])
      clearActiveChama()
      navigate('/select-chama')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); doLogin(email, password) }

  const handleGoogle = async (credentialResponse: any) => {
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/google', { token: credentialResponse.credential })
      storeLogin(data.token, data.user, data.memberships ?? [])
      clearActiveChama()
      navigate('/select-chama')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Google sign-in failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-warm-bg">

      {/* ── Left — heritage branding panel ─────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col bg-warm-sidebar px-10 py-10 xl:px-12">
        <Link to="/"><BrandLogo size="sm" showWordmark variant="light" /></Link>

        <div className="flex flex-1 flex-col justify-center max-w-sm">
          {/* Serif heading */}
          <h2 className="text-3xl font-bold text-warm-card leading-snug mb-3"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Sign in to your chama.
          </h2>
          {/* Fine rule */}
          <div className="mb-6 w-12 border-t border-gold" />
          <p className="text-sm text-ink-300 mb-10 leading-relaxed">
            Manage contributions, loans, and your group's full financial picture.
          </p>

          <ul className="space-y-3">
            {REASONS.map(r => (
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

      {/* ── Right — form ────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-warm-bg">

        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-ink-300 bg-warm-card px-6 py-4 lg:hidden">
          <Link to="/"><BrandLogo size="sm" showWordmark /></Link>
          <Link to="/register" className="text-sm font-medium text-brown hover:text-brown-dark transition-colors">Create account</Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[380px]">

            {/* Parchment form panel */}
            <div className="rounded-lg border border-ink-300 bg-warm-card px-8 py-8"
              style={{ boxShadow: 'var(--shadow-sm)' }}>

              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink-900"
                  style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                  Sign in
                </h1>
                <div className="mt-2 mb-3 w-10 border-t border-gold" />
                <p className="text-sm text-ink-500">Enter your email and password to continue.</p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-3">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v4a1 1 0 102 0V9a1 1 0 10-2 0zm0-4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-ink-700">Password</label>
                    <Link to="/forgot-password" className="text-xs text-brown hover:text-brown-dark transition-colors">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-md border border-ink-300 bg-warm-card px-3.5 py-2.5 pr-9 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brown focus:outline-none focus:ring-1 focus:ring-brown/20 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" loading={loading}>
                  Sign in
                </Button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-ink-200" />
                <span className="text-xs text-ink-400">or</span>
                <div className="flex-1 h-px bg-ink-200" />
              </div>

              {/* Google */}
              <div className="flex justify-center [&>div]:w-full [&_iframe]:w-full">
                <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-in failed.')} theme="outline" shape="rectangular" width="100%" />
              </div>
            </div>

            {/* Footer links */}
            <p className="mt-5 text-center text-sm text-ink-500">
              No account?{' '}
              <Link to="/register" className="font-semibold text-brown hover:text-brown-dark transition-colors">Create one</Link>
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
