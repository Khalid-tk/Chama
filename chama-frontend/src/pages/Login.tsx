/**
 * Login page: email/password + Google OAuth.
 *
 * Manual test checklist (Google login):
 * 1. Click "Continue with Google" -> Google account picker opens
 * 2. Choose account -> backend POST /api/auth/google receives idToken
 * 3. Backend returns { token, user, memberships } -> stored in auth store + localStorage
 * 4. Redirect to /select-chama -> chama list loads (or empty if no chamas)
 *
 * If you get HTTP 403 on Google login:
 * - From Google popup: In Google Cloud Console, add your app origin (e.g. http://localhost:5173)
 *   to the OAuth 2.0 Client ID under "Authorized JavaScript origins".
 * - From our API: Backend now sends Cross-Origin-Resource-Policy: cross-origin so the SPA can call it.
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { GoogleLogin } from '@react-oauth/google'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user, memberships } = response.data.data

      login(token, user, memberships)

      // Redirect to chama selection
      navigate('/select-chama')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      setError('Google login failed: no credential received.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/google', {
        idToken: credentialResponse.credential,
      })
      // Backend returns { success, data: { token, user, memberships } }
      const { token, user, memberships } = response.data?.data ?? {}

      if (!token || !user) {
        setError('Invalid response from server. Please try again.')
        return
      }

      login(token, user, memberships || [])

      navigate('/select-chama')
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Google login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.')
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-4 overflow-x-hidden">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8 max-w-[100%]">
        <div className="mb-6 sm:mb-8 flex justify-center">
          <BrandLogo size="lg" showWordmark variant="dark" />
        </div>
        <h1 className="mb-2 text-center text-xl font-semibold text-slate-800 sm:text-2xl">
          Sign in
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Enter your credentials to access your account
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" className="w-full min-h-[44px]" loading={loading}>
            Sign in
          </Button>
        </form>

        {googleClientId && (
          <>
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-xs text-slate-500">OR</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Continue with Google</span>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
