import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import api from '../lib/api'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 flex justify-center">
          <BrandLogo size="lg" showWordmark variant="dark" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">Reset Password</h1>
        <p className="mb-6 text-sm text-slate-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div className="rounded-lg bg-green-50 p-4 text-green-800">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Email sent!</span>
            </div>
            <p className="text-sm">
              If an account exists with this email, a password reset link has been sent. Please
              check your inbox and follow the instructions.
            </p>
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
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />

            <Button type="submit" loading={loading} className="w-full">
              Send Reset Link
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
