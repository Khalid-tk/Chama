import { useEffect } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useChamaStore } from '../../store/chamaStore'

/**
 * Guard that ensures user has selected a chama and route param matches.
 * If URL has chamaId and user has membership for it, syncs active chama from URL.
 */
export function ChamaRoute() {
  const { chamaId } = useParams<{ chamaId: string }>()
  const { activeChamaId, setActiveChama } = useChamaStore()
  const { memberships } = useAuthStore()

  useEffect(() => {
    if (!chamaId || !memberships?.length) return
    if (activeChamaId === chamaId) return
    const membership = memberships.find((m) => m.chamaId === chamaId)
    if (membership) {
      setActiveChama({
        chamaId: membership.chamaId,
        chamaName: membership.chama.name,
        chamaCode: membership.chama.chamaCode,
        role: membership.role,
        joinMode: membership.chama.joinMode,
      })
    }
  }, [chamaId, memberships, activeChamaId, setActiveChama])

  if (!chamaId) {
    return <Navigate to="/select-chama" replace />
  }

  const membership = memberships?.find((m) => m.chamaId === chamaId)
  if (!membership) {
    return <Navigate to="/select-chama" replace />
  }

  return <Outlet />
}
