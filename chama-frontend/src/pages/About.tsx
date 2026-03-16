import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useChamaStore } from '../store/chamaStore'

export function About() {
  const navigate = useNavigate()
  const { activeChama } = useChamaStore()

  const goToDashboard = () => {
    if (activeChama) {
      const base = ['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR'].includes(activeChama.role) ? 'admin' : 'member'
      navigate(`/${base}/${activeChama.chamaId}/dashboard`)
    } else {
      navigate('/select-chama')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Help / About</h1>
          <p className="text-sm text-ink-500">About this app</p>
        </div>
        <Button variant="secondary" size="sm" onClick={goToDashboard} className="gap-2">
          <ArrowLeft size={18} />
          Back to dashboard
        </Button>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="text-ink-700">
            Chama is a group savings and loans management app. Create or join a chama, track contributions,
            request and manage loans, and use M-Pesa for payments.
          </p>
          <p className="text-sm text-ink-500">
            Use the sidebar to switch between chamas. Profile and Settings are available from your avatar in the header.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
