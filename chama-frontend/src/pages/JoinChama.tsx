import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut, Building2, Users, Lock, Unlock, ArrowLeft } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useAuthStore } from '../store/authStore'
import api, { chamaRoute } from '../lib/api'

type SearchChama = {
  id: string
  name: string
  description: string | null
  chamaCode: string
  joinMode: string
  isPublic: boolean
  memberCount: number
  createdAt: string
}

type MyJoinRequest = {
  id: string
  chamaId: string
  status: string
  createdAt: string
  updatedAt: string
  chama: { id: string; name: string; chamaCode: string }
}

export function JoinChama() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [tab, setTab] = useState<'explore' | 'my-requests'>('explore')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchChama[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [myRequests, setMyRequests] = useState<MyJoinRequest[]>([])
  const [myRequestsLoading, setMyRequestsLoading] = useState(false)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [requestStatusByChama, setRequestStatusByChama] = useState<Record<string, string>>({})

  const runSearch = async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim()
    setSearchLoading(true)
    try {
      const res = await api.get('/chamas/search', { params: { q: q || undefined } })
      setSearchResults(res.data.data?.data ?? [])
    } catch (e) {
      console.error(e)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Load all available chamas when opening Explore tab so new users see them without searching
  useEffect(() => {
    if (tab === 'explore') {
      runSearch('')
    }
  }, [tab])

  useEffect(() => {
    if (tab !== 'explore') return
    if (query.trim().length >= 2) {
      const t = setTimeout(() => runSearch(), 300)
      return () => clearTimeout(t)
    }
    if (!query.trim()) runSearch('')
  }, [query])

  useEffect(() => {
    if (tab === 'my-requests') {
      loadMyRequests()
    }
  }, [tab])

  const loadMyRequests = async () => {
    setMyRequestsLoading(true)
    try {
      const res = await api.get('/chamas/my/join-requests')
      setMyRequests(res.data.data ?? [])
    } catch (e) {
      console.error(e)
      setMyRequests([])
    } finally {
      setMyRequestsLoading(false)
    }
  }

  const fetchMyStatusForChama = async (chamaId: string) => {
    try {
      const res = await api.get(chamaRoute(chamaId, '/my/join-request'))
      const req = res.data.data
      if (req) setRequestStatusByChama((prev) => ({ ...prev, [chamaId]: req.status }))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    searchResults.forEach((c) => fetchMyStatusForChama(c.id))
  }, [searchResults])

  const handleRequestJoin = async (chamaId: string) => {
    setRequestingId(chamaId)
    try {
      await api.post(chamaRoute(chamaId, '/join-requests'))
      setRequestStatusByChama((prev) => ({ ...prev, [chamaId]: 'PENDING' }))
      if (tab === 'my-requests') loadMyRequests()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Request failed'
      alert(msg)
    } finally {
      setRequestingId(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <BrandLogo size="md" showWordmark variant="dark" />
            <div className="flex items-center gap-4">
              <Button variant="secondary" size="sm" onClick={() => navigate('/select-chama')} className="gap-2">
                <ArrowLeft size={18} />
                Back to My Chamas
              </Button>
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
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-800">Explore & Join Chamas</h1>
          <p className="mt-2 text-slate-600">
            All available chamas are listed below. Search to filter, then request to join. Admins will approve your request.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          {(['explore', 'my-requests'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === t ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t === 'explore' ? 'Explore Chamas' : 'My Join Requests'}
            </button>
          ))}
        </div>

        {tab === 'explore' && (
          <>
            <div className="mb-6 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by chama name or code..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => runSearch()} loading={searchLoading}>
                Search
              </Button>
            </div>

            {searchLoading && (
              <div className="py-8 text-center text-slate-500">Loading chamas...</div>
            )}
            {!searchLoading && searchResults.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-slate-600">
                    {query.trim() ? 'No chamas found. Try a different search.' : 'No chamas available yet.'}
                  </p>
                </CardContent>
              </Card>
            )}
            {!searchLoading && searchResults.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {searchResults.map((chama) => {
                  const status = requestStatusByChama[chama.id]
                  const isPending = status === 'PENDING'
                  const isApproved = status === 'APPROVED'
                  const isRejected = status === 'REJECTED'
                  return (
                    <Card key={chama.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">{chama.name}</h3>
                            <p className="text-sm text-slate-500">Code: {chama.chamaCode}</p>
                          </div>
                          {status && (
                            <Badge
                              variant={
                                isApproved ? 'success' : isRejected ? 'danger' : 'warning'
                              }
                            >
                              {status}
                            </Badge>
                          )}
                        </div>
                        {chama.description && (
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">{chama.description}</p>
                        )}
                        <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            {chama.joinMode === 'OPEN' ? (
                              <Unlock size={14} />
                            ) : (
                              <Lock size={14} />
                            )}
                            {chama.joinMode === 'OPEN' ? 'Open' : 'Approval'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {chama.memberCount} members
                          </div>
                        </div>
                        {isApproved ? (
                          <Button className="w-full" onClick={() => navigate('/select-chama')}>
                            Go to My Chamas
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            disabled={isPending || requestingId === chama.id}
                            loading={requestingId === chama.id}
                            onClick={() => handleRequestJoin(chama.id)}
                          >
                            {isPending ? 'Pending approval' : 'Request to Join'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'my-requests' && (
          <Card>
            <CardContent className="p-6">
              {myRequestsLoading ? (
                <div className="py-8 text-center text-slate-500">Loading...</div>
              ) : myRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-slate-600">You have no join requests yet.</p>
                  <Button variant="secondary" className="mt-4" onClick={() => setTab('explore')}>
                    Explore Chamas
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{r.chama.name}</p>
                        <p className="text-sm text-slate-500">Code: {r.chama.chamaCode}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Requested {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
