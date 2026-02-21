import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LogOut, Building2, Users, Lock, Unlock, Shield, RefreshCw } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useAuthStore } from '../store/authStore'
import { useChamaStore } from '../store/chamaStore'
import api from '../lib/api'
import type { ChamaMembership } from '../store/authStore'

export function SelectChama() {
  const navigate = useNavigate()
  const { user, logout, refreshMemberships } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const { setActiveChama, clearActiveChama } = useChamaStore()
  const [loading, setLoading] = useState(true)
  const [myChamas, setMyChamas] = useState<ChamaMembership[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  useEffect(() => {
    loadMyChamas()
  }, [])

  const loadMyChamas = async () => {
    try {
      const response = await api.get('/chamas/my')
      setMyChamas(response.data.data)
    } catch (error) {
      console.error('Failed to load chamas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshMemberships()
      await loadMyChamas()
    } finally {
      setRefreshing(false)
    }
  }

  const handleEnterChama = (membership: ChamaMembership) => {
    setActiveChama({
      chamaId: membership.chamaId,
      chamaName: membership.chama.name,
      chamaCode: membership.chama.chamaCode,
      role: membership.role,
      joinMode: membership.chama.joinMode,
    })

    // Navigate based on role
    if (['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR'].includes(membership.role)) {
      navigate(`/admin/${membership.chamaId}/dashboard`)
    } else {
      navigate(`/member/${membership.chamaId}/dashboard`)
    }
  }

  const handleLogout = () => {
    logout()
    clearActiveChama()
    navigate('/login')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'CHAIR':
        return 'bg-blue-100 text-blue-700'
      case 'TREASURER':
        return 'bg-emerald-100 text-emerald-700'
      case 'AUDITOR':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <BrandLogo size="md" showWordmark variant="dark" />
            <div className="flex items-center gap-4">
              {user?.globalRole === 'SUPER_ADMIN' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/super')}
                  className="gap-2"
                >
                  <Shield size={18} />
                  Platform Admin
                </Button>
              )}
              <span className="text-sm text-slate-600">{user?.fullName}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-800">Select Chama</h1>
          <p className="mt-2 text-slate-600">
            Choose a chama to access or create/join a new one
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={18} />
            Create Chama
          </Button>
          <Button variant="secondary" onClick={() => setShowJoin(true)}>
            <Search size={18} />
            Join with code
          </Button>
          <Button variant="secondary" onClick={() => navigate('/join-chama')}>
            <Building2 size={18} />
            Explore chamas
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh} loading={refreshing} className="gap-2">
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {/* My Chamas List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : myChamas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                No chamas yet
              </h3>
              <p className="mb-4 text-slate-600">
                Create your first chama, explore and request to join one, or join with a code
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={() => navigate('/join-chama')} className="gap-2">
                  <Search size={18} />
                  Explore and request to join a chama
                </Button>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus size={18} />
                  Create a chama
                </Button>
                <Button variant="ghost" onClick={() => setShowJoin(true)} className="gap-2">
                  <Search size={18} />
                  Join with code
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myChamas.map((membership) => (
              <Card key={membership.chamaId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {membership.chama.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Code: {membership.chama.chamaCode}
                      </p>
                    </div>
                    <Badge className={getRoleBadgeColor(membership.role)}>
                      {membership.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      {membership.chama.joinMode === 'OPEN' ? (
                        <Unlock size={14} />
                      ) : (
                        <Lock size={14} />
                      )}
                      {membership.chama.joinMode === 'OPEN' ? 'Open' : 'Approval'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      Member
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleEnterChama(membership)}
                  >
                    Enter Chama
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Chama Modal */}
      {showCreate && (
        <CreateChamaModal
          onClose={() => {
            setShowCreate(false)
            loadMyChamas()
          }}
        />
      )}

      {/* Join Chama Modal */}
      {showJoin && (
        <JoinChamaModal
          onClose={() => {
            setShowJoin(false)
            loadMyChamas()
          }}
        />
      )}
    </div>
  )
}

function CreateChamaModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joinMode, setJoinMode] = useState<'OPEN' | 'APPROVAL'>('OPEN')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdChama, setCreatedChama] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/chamas', {
        name,
        description,
        joinMode,
        isPublic,
      })
      setCreatedChama(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create chama')
    } finally {
      setLoading(false)
    }
  }

  if (createdChama) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">
              Chama Created Successfully!
            </h2>
            <div className="mb-4 space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-600">Chama Code:</span>
                <div className="mt-1 rounded-lg bg-slate-100 p-2 font-mono text-lg font-bold text-slate-800">
                  {createdChama.chamaCode}
                </div>
              </div>
              {createdChama.joinCode && (
                <div>
                  <span className="text-sm font-medium text-slate-600">Join Code:</span>
                  <div className="mt-1 rounded-lg bg-blue-50 p-2 font-mono text-lg font-bold text-blue-700">
                    {createdChama.joinCode}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Share this code with members to join
                  </p>
                </div>
              )}
            </div>
            <Button className="w-full" onClick={onClose}>
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">Create Chama</h2>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Chama Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Join Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="OPEN"
                    checked={joinMode === 'OPEN'}
                    onChange={(e) => setJoinMode(e.target.value as 'OPEN')}
                    disabled={loading}
                  />
                  <span className="text-sm">Open (with code)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="APPROVAL"
                    checked={joinMode === 'APPROVAL'}
                    onChange={(e) => setJoinMode(e.target.value as 'APPROVAL')}
                    disabled={loading}
                  />
                  <span className="text-sm">Approval Required</span>
                </label>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={loading}
              />
              <span className="text-sm text-slate-700">Make chama public (searchable)</span>
            </label>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" loading={loading}>
                Create
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function JoinChamaModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { refreshMemberships } = useAuthStore()
  const { setActiveChama } = useChamaStore()
  const [chamaCode, setChamaCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/chamas/join', {
        chamaCode: chamaCode.toUpperCase(),
        joinCode: joinCode || undefined,
      })

      if (response.data.data.joinRequest) {
        // Join request submitted (APPROVAL mode)
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        // Joined successfully (OPEN mode)
        const { membership, chama } = response.data.data
        
        // Refresh memberships to get updated list
        await refreshMemberships()
        
        // Set active chama and navigate to dashboard
        setActiveChama({
          chamaId: membership.chamaId,
          chamaName: chama.name,
          chamaCode: chama.chamaCode,
          role: membership.role,
        })
        
        // Navigate to appropriate dashboard
        if (['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR'].includes(membership.role)) {
          navigate(`/admin/${membership.chamaId}/dashboard`)
        } else {
          navigate(`/member/${membership.chamaId}/dashboard`)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join chama')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="mb-2 text-xl font-semibold text-slate-800">
              Request Submitted
            </h2>
            <p className="text-slate-600">
              Your join request has been submitted. Waiting for approval.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">Join Chama</h2>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Chama Code"
              placeholder="Enter chama code"
              value={chamaCode}
              onChange={(e) => setChamaCode(e.target.value.toUpperCase())}
              required
              disabled={loading}
            />
            <Input
              label="Join Code (if required)"
              placeholder="Enter join code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" loading={loading}>
                Join
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
