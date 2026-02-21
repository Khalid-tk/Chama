import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Plus, Mail, UserPlus, CreditCard, Wallet, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
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

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Members</h1>
          <p className="text-sm text-slate-500">Manage Chama members and invites</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <Plus size={18} />
          Invite Member
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('members')
            setCurrentPage(1)
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'members'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('invites')
            setCurrentPage(1)
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'invites'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Invites ({invites.length})
        </button>
      </div>

      {activeTab === 'members' ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 max-w-xs">
              <Input
                placeholder="Search members..."
                icon={<Search size={18} />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <Card>
            <CardContent className="overflow-hidden p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
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
                                  className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
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
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                      <div className="text-sm text-slate-600">
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
            <h2 className="font-semibold text-slate-800">Invites ({invites.length})</h2>
          </CardHeader>
          <CardContent className="overflow-hidden p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : invites.length === 0 ? (
              <TableEmpty colSpan={5}>No invites found</TableEmpty>
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
      {viewMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Member details</h2>
              <button
                onClick={() => setViewMember(null)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <p><span className="font-medium text-slate-600">Name:</span> {viewMember.user.fullName}</p>
              <p><span className="font-medium text-slate-600">Email:</span> {viewMember.user.email}</p>
              <p><span className="font-medium text-slate-600">Phone:</span> {viewMember.user.phone || '—'}</p>
              <p><span className="font-medium text-slate-600">Role:</span> {viewMember.role}</p>
              <p><span className="font-medium text-slate-600">Joined:</span> {formatDateShort(viewMember.joinedAt)}</p>
              <p><span className="font-medium text-slate-600">Status:</span>{' '}
                <Badge variant={viewMember.isActive ? 'success' : 'danger'}>{viewMember.isActive ? 'Active' : 'Inactive'}</Badge>
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => {
                  if (chamaId) navigate(`/admin/${chamaId}/loans?userId=${viewMember.userId}`)
                  setViewMember(null)
                }}
              >
                <CreditCard size={18} />
                View loans
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => {
                  if (chamaId) navigate(`/admin/${chamaId}/contributions?userId=${viewMember.userId}`)
                  setViewMember(null)
                }}
              >
                <Wallet size={18} />
                View contributions
              </Button>
              <Button variant="ghost" onClick={() => setViewMember(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">Invite Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label="Email"
                type="email"
                icon={<Mail size={18} />}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="member@example.com"
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                    setInviteRole('MEMBER')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={inviteLoading} className="flex-1">
                  <UserPlus size={18} />
                  Send Invite
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
