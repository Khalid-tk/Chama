import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle, Users } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/ui/Button'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useChamaStore } from '../store/chamaStore'

export function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [inviteData, setInviteData] = useState<{
    email: string
    chamaName: string
    role: string
    expiresAt: string
  } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [success, setSuccess] = useState(false)

  const isAuthed = useAuthStore((s) => s.isAuthed)
  const user = useAuthStore((s) => s.user)
  const refreshMemberships = useAuthStore((s) => s.refreshMemberships)
  const setActiveChama = useChamaStore((s) => s.setActiveChama)

  useEffect(() => {
    if (!token) {
      setError('Invalid invite token')
      setLoading(false)
      return
    }

    // Fetch invite preview
    api
      .get('/api/invites/preview', { params: { token } })
      .then((res) => {
        setInviteData(res.data.data)
        setError('')
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || 'Invalid or expired invite token')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  const handleAccept = async () => {
    if (!token) return

    if (!isAuthed) {
      // Redirect to login with invite email prefill
      navigate(`/login?invite=${token}&email=${inviteData?.email || ''}`)
      return
    }

    setAccepting(true)
    setError('')

    try {
      const res = await api.post('/api/invites/accept', { token })
      const { chamaId, role } = res.data.data

      // Refresh memberships
      await refreshMemberships()

      // Set active chama (map ChamaMembership to ChamaContext)
      const memberships = useAuthStore.getState().memberships
      const membership = memberships.find((m) => m.chamaId === chamaId)
      if (membership) {
        setActiveChama({
          chamaId: membership.chamaId,
          chamaName: membership.chama?.name ?? '',
          chamaCode: membership.chama?.chamaCode ?? '',
          role: membership.role,
          joinMode: membership.chama?.joinMode,
        })
      }

      setSuccess(true)

      // Redirect to appropriate dashboard
      setTimeout(() => {
        if (['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR'].includes(role)) {
          navigate(`/admin/${chamaId}/dashboard`)
        } else {
          navigate(`/member/${chamaId}/dashboard`)
        }
      }, 1500)
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Not logged in - redirect to login
        navigate(`/login?invite=${token}&email=${inviteData?.email || ''}`)
      } else {
        setError(err.response?.data?.message || 'Failed to accept invite. Please try again.')
      }
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB]">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading invite...</p>
        </div>
      </div>
    )
  }

  if (error && !inviteData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-8 flex justify-center">
            <BrandLogo size="lg" showWordmark variant="dark" />
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Invalid Invite</span>
            </div>
            <p className="text-sm">{error}</p>
          </div>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-blue-600 hover:text-blue-700">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const emailMatches = isAuthed && user?.email === inviteData?.email

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 flex justify-center">
          <BrandLogo size="lg" showWordmark variant="dark" />
        </div>

        {success ? (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900">Invite Accepted!</h1>
            <p className="text-slate-600">Redirecting to dashboard...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-slate-900">You've been invited!</h1>
              <p className="text-slate-600">Join a chama and start managing your finances together.</p>
            </div>

            <div className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Email:</span>
                <span className="font-medium text-slate-900">{inviteData?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Chama:</span>
                <span className="font-medium text-slate-900">{inviteData?.chamaName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Role:</span>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  {inviteData?.role}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {!isAuthed ? (
              <div className="space-y-3">
                <p className="text-center text-sm text-slate-600">
                  Please login or signup to accept this invite.
                </p>
                <Button
                  onClick={() => navigate(`/login?invite=${token}&email=${inviteData?.email || ''}`)}
                  className="w-full"
                >
                  Login / Signup
                </Button>
                <p className="text-center text-xs text-slate-500">
                  The invite is for: <strong>{inviteData?.email}</strong>
                </p>
              </div>
            ) : !emailMatches ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  <p>
                    This invite is for <strong>{inviteData?.email}</strong>, but you're logged in
                    as <strong>{user?.email}</strong>.
                  </p>
                </div>
                <Button onClick={() => navigate('/login')} variant="secondary" className="w-full">
                  Switch Account
                </Button>
              </div>
            ) : (
              <Button onClick={handleAccept} loading={accepting} className="w-full">
                Accept Invitation
              </Button>
            )}

            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="text-blue-600 hover:text-blue-700">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
