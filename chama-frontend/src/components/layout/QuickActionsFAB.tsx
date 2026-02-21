import { useNavigate } from 'react-router-dom'
import { Wallet, CreditCard, Smartphone } from 'lucide-react'
import { FAB } from '../ui/FAB'
import { useAuthStore } from '../../store/authStore'
import { useChamaStore } from '../../store/chamaStore'

export function QuickActionsFAB() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { activeChama } = useChamaStore()

  if (!user || !activeChama?.chamaId) return null

  const chamaId = activeChama.chamaId
  const isMember = activeChama.role === 'MEMBER'

  const actions = [
    {
      label: 'Make Contribution',
      icon: <Wallet size={18} />,
      onClick: () => navigate(isMember ? `/member/${chamaId}/contributions` : `/admin/${chamaId}/contributions`),
    },
    {
      label: 'Request Loan',
      icon: <CreditCard size={18} />,
      onClick: () => navigate(isMember ? `/member/${chamaId}/loans` : `/admin/${chamaId}/loans`),
    },
    {
      label: 'Mpesa Payment',
      icon: <Smartphone size={18} />,
      onClick: () => navigate(isMember ? `/member/${chamaId}/mpesa` : `/admin/${chamaId}/mpesa`),
    },
  ]

  return <FAB actions={actions} />
}
