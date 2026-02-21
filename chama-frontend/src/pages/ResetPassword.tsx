import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import api from '../lib/api'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token. Please request a new password reset.')
    }
  }, [token])

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

    if (!token) {
      setError('Invalid reset token')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-8 flex justify-center">
            <BrandLogo size="lg" showWordmark variant="dark" />
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Invalid Token</span>
            </div>
            <p className="text-sm">Please request a new password reset link.</p>
          </div>
          <div className="mt-6 text-center">
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 flex justify-center">
          <BrandLogo size="lg" showWordmark variant="dark" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">Set New Password</h1>
        <p className="mb-6 text-sm text-slate-600">Enter your new password below.</p>

        {success ? (
          <div className="rounded-lg bg-green-50 p-4 text-green-800">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Password reset successful!</span>
            </div>
            <p className="text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter new password"
              minLength={6}
            />

            <Input
              label="Confirm Password"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
              minLength={6}
            />

            <Button type="submit" loading={loading} className="w-full">
              Reset Password
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-blue-600 hover:text-blue-700">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
