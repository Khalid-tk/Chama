import { useEffect, useState } from 'react'
import { Users, Mail, Phone, Shield, Calendar } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatDateShort } from '../../lib/format'
import api from '../../lib/api'

type User = {
  id: string
  fullName: string
  email: string
  phone?: string
  globalRole: string
  authProvider: string
  memberCount: number
  createdAt: string
}

export function SuperUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await api.get('/super/users')
      setUsers(response.data.data || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSuperAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'SUPER_ADMIN' ? 'USER' : 'SUPER_ADMIN'
    try {
      await api.patch(`/super/users/${userId}/global-role`, { globalRole: newRole })
      loadUsers()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update role')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">All Users</h1>
        <p className="text-sm text-slate-500">Manage users and their global roles</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.length === 0 ? (
          <div className="col-span-full rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{user.fullName}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Shield className="h-4 w-4" />
                    <span>{user.memberCount} memberships</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDateShort(user.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant={user.globalRole === 'SUPER_ADMIN' ? 'success' : 'info'}>
                      {user.globalRole}
                    </Badge>
                    <Badge variant="outline">{user.authProvider}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleToggleSuperAdmin(user.id, user.globalRole)}
                    className="mt-2 w-full"
                  >
                    {user.globalRole === 'SUPER_ADMIN' ? 'Remove Super Admin' : 'Make Super Admin'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
