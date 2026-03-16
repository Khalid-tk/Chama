import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LogOut, Building2, Lock, Unlock, Shield, RefreshCw, ChevronRight } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal, ModalBody, ModalFooter } from '../components/ui/Modal'
import { useAuthStore } from '../store/authStore'
import { useChamaStore } from '../store/chamaStore'
import api from '../lib/api'
import type { ChamaMembership } from '../store/authStore'

type BadgeVariant = 'blue' | 'success' | 'purple' | 'neutral'

function roleBadge(role: string): BadgeVariant {
  if (role === 'ADMIN' || role === 'CHAIR') return 'blue'
  if (role === 'TREASURER') return 'success'
  if (role === 'AUDITOR') return 'purple'
  return 'neutral'
}

export function SelectChama() {
  const navigate = useNavigate()
  const { user, logout, refreshMemberships } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const { setActiveChama, clearActiveChama } = useChamaStore()
  const [loading, setLoading] = useState(true)
  const [myChamas, setMyChamas] = useState<ChamaMembership[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin]     = useState(false)

  useEffect(() => { loadMyChamas() }, [])

  const loadMyChamas = async () => {
    try {
      const res = await api.get('/chamas/my')
      setMyChamas(res.data.data)
    } catch { /* silent */ } finally { setLoading(false) }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try { await refreshMemberships(); await loadMyChamas() } finally { setRefreshing(false) }
  }

  const handleEnterChama = (m: ChamaMembership) => {
    setActiveChama({ chamaId: m.chamaId, chamaName: m.chama.name, chamaCode: m.chama.chamaCode, role: m.role, joinMode: m.chama.joinMode })
    navigate(['ADMIN','TREASURER','CHAIR','AUDITOR'].includes(m.role)
      ? `/admin/${m.chamaId}/dashboard`
      : `/member/${m.chamaId}/dashboard`)
  }

  const handleLogout = () => { logout(); clearActiveChama(); navigate('/login') }

  return (
    <div className="min-h-screen bg-warm-bg">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 border-b border-ink-300 bg-warm-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <BrandLogo size="sm" showWordmark />
          <div className="flex items-center gap-2">
            {user?.globalRole === 'SUPER_ADMIN' && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/super')}>
                <Shield size={14} />
                <span className="hidden sm:inline">Platform</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-ink-900">
            {user?.fullName ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Select a chama'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Choose a chama to open, or create a new one.
          </p>
        </div>

        {/* Primary actions */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create chama
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowJoin(true)}>
            <Search size={14} /> Join with code
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/join-chama')}>
            <Building2 size={14} /> Explore chamas
          </Button>
          <button type="button" onClick={handleRefresh} disabled={refreshing}
            className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-ink-500 hover:bg-warm-deep disabled:opacity-50 transition-colors">
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Chama list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-blue-600" />
          </div>
        ) : myChamas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-300 bg-warm-card px-6 py-14 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-ink-300" />
            <h3 className="mb-1 text-sm font-semibold text-ink-700">No chamas yet</h3>
            <p className="mb-5 text-sm text-ink-500 max-w-xs mx-auto">
              Create your first group, search for an existing one, or join with a code.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Create</Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/join-chama')}><Search size={14} /> Explore</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowJoin(true)}>Join with code</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myChamas.map((m) => (
              <button key={m.chamaId} type="button" onClick={() => handleEnterChama(m)}
                className="group flex flex-col rounded-lg border border-ink-300 bg-warm-card px-5 py-4 text-left transition-colors hover:border-ink-300 hover:bg-warm-bg"
                style={{ boxShadow: 'var(--shadow-xs)' }}>
                {/* Name + role */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{m.chama.name}</p>
                    <p className="mt-0.5 text-xs text-ink-400 font-mono">{m.chama.chamaCode}</p>
                  </div>
                  <Badge variant={roleBadge(m.role)} className="shrink-0">{m.role}</Badge>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-ink-500">
                  {m.chama.joinMode === 'OPEN' ? <Unlock size={12} /> : <Lock size={12} />}
                  <span>{m.chama.joinMode === 'OPEN' ? 'Open' : 'Approval required'}</span>
                  <span className="ml-auto flex items-center gap-1 text-brown opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Open <ChevronRight size={12} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create chama modal */}
      {showCreate && (
        <CreateChamaModal onClose={() => { setShowCreate(false); loadMyChamas() }} />
      )}

      {/* Join chama modal */}
      {showJoin && (
        <JoinChamaModal onClose={() => { setShowJoin(false); loadMyChamas() }} />
      )}
    </div>
  )
}

/* ── Create Chama Modal ─────────────────────────────────────── */
function CreateChamaModal({ onClose }: { onClose: () => void }) {
  const [name, setName]           = useState('')
  const [description, setDescription] = useState('')
  const [joinMode, setJoinMode]   = useState<'OPEN' | 'APPROVAL'>('OPEN')
  const [isPublic, setIsPublic]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [created, setCreated]     = useState<{ chamaCode: string; joinCode?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.post('/chamas', { name, description, joinMode, isPublic })
      setCreated(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create chama')
    } finally { setLoading(false) }
  }

  if (created) {
    return (
      <Modal open title="Chama created" onClose={onClose}>
        <ModalBody className="space-y-4">
          <p className="text-sm text-ink-700">Your chama is ready. Share the codes below with your members.</p>
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-ink-500">Chama code</p>
              <div className="rounded-md border border-ink-300 bg-warm-bg px-3 py-2.5 font-mono text-base font-bold text-ink-900 select-all">
                {created.chamaCode}
              </div>
            </div>
            {created.joinCode && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-500">Join code</p>
                <div className="rounded-md border border-blue-100 bg-brown-light px-3 py-2.5 font-mono text-base font-bold text-brown-dark select-all">
                  {created.joinCode}
                </div>
                <p className="mt-1 text-xs text-ink-400">Share this code with invited members.</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={onClose}>Continue</Button>
        </ModalFooter>
      </Modal>
    )
  }

  return (
    <Modal open title="Create chama" description="Set up your savings group." onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} required disabled={loading} placeholder="e.g. Nairobi 40s Club" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Description <span className="text-ink-400 font-normal">(optional)</span></label>
            <textarea className="w-full rounded-md border border-ink-300 bg-warm-card px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brown focus:outline-none focus:ring-1 focus:ring-brown/20 transition-colors resize-none"
              value={description} onChange={e => setDescription(e.target.value)} rows={3} disabled={loading} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink-700">Membership</p>
            <div className="flex gap-4">
              {(['OPEN','APPROVAL'] as const).map(mode => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={mode} checked={joinMode === mode} onChange={() => setJoinMode(mode)} disabled={loading} className="text-brown" />
                  <span className="text-sm text-ink-700">{mode === 'OPEN' ? 'Open (with code)' : 'Approval required'}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} disabled={loading} className="text-brown rounded" />
            <span className="text-sm text-ink-700">Make publicly searchable</span>
          </label>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={loading}>Create chama</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

/* ── Join Chama Modal ───────────────────────────────────────── */
function JoinChamaModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { refreshMemberships } = useAuthStore()
  const { setActiveChama } = useChamaStore()
  const [chamaCode, setChamaCode] = useState('')
  const [joinCode, setJoinCode]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.post('/chamas/join', { chamaCode: chamaCode.toUpperCase(), joinCode: joinCode || undefined })
      if (res.data.data.joinRequest) {
        setSuccess(true)
        setTimeout(onClose, 2500)
      } else {
        const { membership, chama } = res.data.data
        await refreshMemberships()
        setActiveChama({ chamaId: membership.chamaId, chamaName: chama.name, chamaCode: chama.chamaCode, role: membership.role })
        navigate(['ADMIN','TREASURER','CHAIR','AUDITOR'].includes(membership.role)
          ? `/admin/${membership.chamaId}/dashboard`
          : `/member/${membership.chamaId}/dashboard`)
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to join chama')
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <Modal open title="Request submitted" onClose={onClose}>
        <ModalBody>
          <p className="text-sm text-ink-700">Your join request has been submitted and is pending admin approval.</p>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={onClose}>Done</Button>
        </ModalFooter>
      </Modal>
    )
  }

  return (
    <Modal open title="Join chama" description="Enter the codes shared by the chama admin." onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
          <Input label="Chama code" placeholder="e.g. CH-XXXX" value={chamaCode} onChange={e => setChamaCode(e.target.value.toUpperCase())} required disabled={loading} />
          <Input label="Join code" placeholder="Required if the chama is not open" hint="Leave blank for open chamas." value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} disabled={loading} />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={loading}>Join</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
