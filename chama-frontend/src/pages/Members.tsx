import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Mail, CreditCard, Wallet } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, ModalBody, ModalFooter } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { FilterBar, FilterSelect } from '../components/ui/FilterBar'
import {
  TableShell,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../components/ui/TableShell'
import { formatDateShort } from '../lib/format'
import { useToast } from '../hooks/useToast'
import api, { chamaRoute } from '../lib/api'

type Member = {
  id: string
  userId: string
  role: string
  joinedAt: string
  isActive: boolean
  user: {
    id: string
    fullName: string
    email: string
    phone?: string
  }
}

type Invite = {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  createdAt: string
  invitedBy: {
    fullName: string
  }
}

const ITEMS_PER_PAGE = 10
const ROLES = ['MEMBER', 'ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR'] as const

export function Members() {
  const { chamaId } = useParams<{ chamaId: string }>()
  const { showToast, ToastContainer } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members')
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('MEMBER')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [viewMember, setViewMember] = useState<Member | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (chamaId) {
      loadData()
    }
  }, [chamaId, activeTab])

  const loadData = async () => {
    if (!chamaId) return
    setLoading(true)
    try {
      if (activeTab === 'members') {
        const response = await api.get(chamaRoute(chamaId, '/members'))
        setMembers(response.data.data || [])
      } else {
        const response = await api.get(chamaRoute(chamaId!, '/invites'))
        setInvites(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chamaId) return
    setInviteLoading(true)
    try {
      await api.post(chamaRoute(chamaId, '/invites'), {
        email: inviteEmail,
        role: inviteRole,
      })
      showToast('Invite sent', 'success')
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('MEMBER')
      loadData()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to send invite', 'error')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!chamaId) return
    try {
      await api.patch(chamaRoute(chamaId, `/members/${userId}/role`), {
        role: newRole,
      })
      showToast('Role updated', 'success')
      loadData()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update role', 'error')
    }
  }

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.user.email.toLowerCase().includes(search.toLowerCase()) ||
        m.user.phone?.includes(search)
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' && m.isActive) || (statusFilter === 'inactive' && !m.isActive)
      return matchesSearch && matchesStatus
    })
  }, [members, search, statusFilter])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredMembers, currentPage])

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE)
  const memberStats = useMemo(() => {
    const active = members.filter((m) => m.isActive).length
    const inactive = members.length - active
    const admins = members.filter((m) => ['ADMIN', 'CHAIR', 'TREASURER', 'AUDITOR'].includes(m.role)).length
    return { total: members.length, active, inactive, admins }
  }, [members])

  return (
    <div className="space-y-6">
      <ToastContainer />

      <PageHeader
        title="Members"
        description="Manage chama members and pending invites."
        actions={
          <Button size="sm" onClick={() => setShowInviteModal(true)}>
            <Plus size={14} /> Invite member
          </Button>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: memberStats.total },
          { label: 'Active', value: memberStats.active },
          { label: 'Leadership', value: memberStats.admins },
          { label: 'Inactive', value: memberStats.inactive },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-ink-300 bg-warm-card px-4 py-4" style={{ boxShadow: 'var(--shadow-xs)' }}>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-ink-300">
        {(['members', 'invites'] as const).map(tab => (
          <button key={tab} type="button"
            onClick={() => { setActiveTab(tab); setCurrentPage(1) }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
              activeTab === tab
                ? 'border-b-2 border-brown text-brown-dark'
                : 'text-ink-500 hover:text-ink-700'
            }`}>
            {tab === 'members' ? `Members (${members.length})` : `Invites (${invites.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'members' ? (
        <>
          <FilterBar
            search={{ value: search, onChange: v => { setSearch(v); setCurrentPage(1) }, placeholder: 'Search members…' }}
            filters={
              <FilterSelect value={statusFilter} onChange={e => { setStatusFilter((e.target as HTMLSelectElement).value); setCurrentPage(1) }}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </FilterSelect>
            }
          />

          <Card>
            <CardContent className="overflow-hidden p-0">
              {loading ? (
                <div className="p-8 text-center text-ink-500">Loading...</div>
              ) : (
                <>
                  <div className="max-h-[600px] overflow-auto">
                    <TableShell>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginated.length === 0 ? (
                          <TableEmpty colSpan={7} message="No members found." />
                        ) : (
                          paginated.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">{m.user.fullName}</TableCell>
                              <TableCell>{m.user.email}</TableCell>
                              <TableCell>{m.user.phone || '-'}</TableCell>
                              <TableCell>
                                <select
                                  value={m.role}
                                  onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                                  className="rounded border border-ink-300 bg-warm-card px-2 py-1 text-sm text-ink-700 focus:border-brown focus:outline-none"
                                >
                                  {ROLES.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell>{formatDateShort(m.joinedAt)}</TableCell>
                              <TableCell>
                                <Badge variant={m.isActive ? 'success' : 'danger'}>
                                  {m.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setViewMember(m)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </TableShell>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-ink-200 px-6 py-4">
                      <div className="text-sm text-ink-700">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of{' '}
                        {filteredMembers.length} members
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-ink-900">Invites ({invites.length})</h2>
          </CardHeader>
          <CardContent className="overflow-hidden p-0">
            {loading ? (
              <div className="p-8 text-center text-ink-500">Loading...</div>
            ) : invites.length === 0 ? (
              <TableEmpty colSpan={5} message="No invites found" />
            ) : (
              <div className="overflow-x-auto">
                <TableShell>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>
                          <Badge variant="neutral">{invite.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invite.status === 'ACCEPTED'
                                ? 'success'
                                : invite.status === 'EXPIRED' || invite.status === 'CANCELLED'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{invite.invitedBy.fullName}</TableCell>
                        <TableCell>{formatDateShort(invite.expiresAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableShell>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Member Modal */}
      <Modal open={!!viewMember} onClose={() => setViewMember(null)} title="Member details">
        {viewMember && (
          <>
            <ModalBody className="space-y-3">
              {[
                { label: 'Name',   value: viewMember.user.fullName },
                { label: 'Email',  value: viewMember.user.email },
                { label: 'Phone',  value: viewMember.user.phone || '—' },
                { label: 'Role',   value: viewMember.role },
                { label: 'Joined', value: formatDateShort(viewMember.joinedAt) },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs font-medium text-ink-500 uppercase tracking-wide">{row.label}</span>
                  <span className="text-sm text-ink-900">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-medium text-ink-500 uppercase tracking-wide">Status</span>
                <Badge variant={viewMember.isActive ? 'success' : 'danger'}>{viewMember.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" size="sm" onClick={() => { if (chamaId) navigate(`/admin/${chamaId}/contributions?userId=${viewMember.userId}`); setViewMember(null) }}>
                <Wallet size={14} /> Contributions
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { if (chamaId) navigate(`/admin/${chamaId}/loans?userId=${viewMember.userId}`); setViewMember(null) }}>
                <CreditCard size={14} /> Loans
              </Button>
              <Button size="sm" onClick={() => setViewMember(null)}>Close</Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Invite Modal */}
      <Modal open={showInviteModal} onClose={() => { setShowInviteModal(false); setInviteEmail(''); setInviteRole('MEMBER') }}
        title="Invite member" description="Send an email invite to join this chama.">
        <form onSubmit={handleInvite}>
          <ModalBody className="space-y-4">
            <Input label="Email address" type="email" placeholder="member@example.com" icon={<Mail size={14} />}
              value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="h-9 w-full rounded-md border border-ink-300 bg-warm-card px-3 text-sm text-ink-700 focus:border-brown focus:outline-none focus:ring-1 focus:ring-brown/20 transition-colors">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" size="sm" onClick={() => { setShowInviteModal(false); setInviteEmail(''); setInviteRole('MEMBER') }}>Cancel</Button>
            <Button type="submit" size="sm" loading={inviteLoading}>Send invite</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
