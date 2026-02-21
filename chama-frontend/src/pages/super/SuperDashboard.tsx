import { useEffect, useState } from 'react'
import { Users, Building2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import api from '../../lib/api'

export function SuperDashboard() {
  const [stats, setStats] = useState({
    totalChamas: 0,
    totalUsers: 0,
    totalMemberships: 0,
    superAdmins: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [chamasRes, usersRes] = await Promise.all([
        api.get('/super/chamas'),
        api.get('/super/users'),
      ])

      const chamas = chamasRes.data.data || []
      const users = usersRes.data.data || []

      let totalMemberships = 0
      chamas.forEach((chama: any) => {
        totalMemberships += chama.memberCount || 0
      })

      setStats({
        totalChamas: chamas.length,
        totalUsers: users.length,
        totalMemberships,
        superAdmins: users.filter((u: any) => u.globalRole === 'SUPER_ADMIN').length,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading platform stats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Platform Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of all chamas and users</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Chamas"
          value={stats.totalChamas}
          icon={Building2}
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
        />
        <StatCard
          label="Total Memberships"
          value={stats.totalMemberships}
          icon={Users}
        />
        <StatCard
          label="Super Admins"
          value={stats.superAdmins}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Platform Overview</h2>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Use the navigation menu to manage chamas, users, and view platform audit logs.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
