import { useEffect, useState } from 'react'
import { Building2, Users, Calendar } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatDateShort } from '../../lib/format'
import api from '../../lib/api'

type Chama = {
  id: string
  name: string
  chamaCode: string
  joinMode: string
  isPublic: boolean
  memberCount: number
  createdAt: string
}

export function SuperChamas() {
  const [chamas, setChamas] = useState<Chama[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChamas()
  }, [])

  const loadChamas = async () => {
    try {
      const response = await api.get('/super/chamas')
      setChamas(response.data.data || [])
    } catch (error) {
      console.error('Failed to load chamas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading chamas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">All Chamas</h1>
        <p className="text-sm text-slate-500">Manage and view all chamas in the platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chamas.length === 0 ? (
          <div className="col-span-full rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
            No chamas found
          </div>
        ) : (
          chamas.map((chama) => (
            <Card key={chama.id}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{chama.name}</h3>
                      <p className="text-sm text-slate-500">Code: {chama.chamaCode}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4" />
                    <span>{chama.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDateShort(chama.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={chama.joinMode === 'OPEN' ? 'success' : 'warning'}>
                      {chama.joinMode}
                    </Badge>
                    {chama.isPublic && <Badge variant="neutral">Public</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
