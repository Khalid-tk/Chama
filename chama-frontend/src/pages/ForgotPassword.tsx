import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import api from '../lib/api'
import { AuthShell } from '../components/auth/AuthShell'

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
    <AuthShell
      title="Reset password"
      subtitle="Enter your email and we will send you a secure reset link."
    >

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Email sent!</span>
          </div>
          <p className="text-sm">
            If an account exists with this email, a password reset link has been sent.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email"
            type="email"
            icon={<Mail className="h-4 w-4" />}
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
        <Link to="/login" className="text-brown hover:text-brown-dark">
          Back to Login
        </Link>
      </div>
    </AuthShell>
  )
}
