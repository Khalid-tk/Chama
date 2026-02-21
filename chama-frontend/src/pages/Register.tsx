import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Phone, AlertCircle } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { GoogleLogin } from '@react-oauth/google'

export function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/api/auth/register', {
        fullName,
        email,
        phone: phone || undefined,
        password,
      })
      const { token, user, memberships } = response.data.data

      login(token, user, memberships || [])

      // Redirect to chama selection
      navigate('/select-chama')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError('Google login failed')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/api/auth/google', {
        idToken: credentialResponse.credential,
      })
      const { token, user, memberships } = response.data.data

      login(token, user, memberships || [])

      navigate('/select-chama')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.')
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 flex justify-center">
          <BrandLogo size="lg" showWordmark variant="dark" />
        </div>
        <h1 className="mb-2 text-center text-2xl font-semibold text-slate-800">
          Create account
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Sign up to start managing your chama
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Full name"
            icon={<User size={18} />}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
          />
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
            type="tel"
            placeholder="Phone number (optional)"
            icon={<Phone size={18} />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          <Input
            type="password"
            placeholder="Confirm password"
            icon={<Lock size={18} />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        {googleClientId && (
          <>
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-xs text-slate-500">OR</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
