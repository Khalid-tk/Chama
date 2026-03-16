import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { useChamaStore } from '../store/chamaStore'

export function Unauthorized() {
  const navigate = useNavigate()
  const { activeChama } = useChamaStore()

  const handleGoToDashboard = () => {
    if (activeChama) {
      // Navigate to appropriate dashboard based on role
      if (['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR'].includes(activeChama.role)) {
        navigate(`/admin/${activeChama.chamaId}/dashboard`)
      } else {
        navigate(`/member/${activeChama.chamaId}/dashboard`)
      }
    } else {
      navigate('/select-chama')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-ink-900">Unauthorized Access</h1>
          <p className="mb-6 text-ink-500">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate(-1)} variant="secondary">
              Go Back
            </Button>
            <Button onClick={handleGoToDashboard}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
