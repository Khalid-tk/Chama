import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useChamaStore } from '../../store/chamaStore'
import type { Role } from '../../store/authStore'

type RoleRouteProps = {
  allowedRoles: Role[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { chamaId } = useParams<{ chamaId: string }>()
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const memberships = useAuthStore((s) => s.memberships)
  const { activeChama } = useChamaStore()

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  if (!chamaId) {
    return <Navigate to="/select-chama" replace />
  }

  if (!activeChama || activeChama.chamaId !== chamaId) {
    const membershipForChama = memberships?.find((m) => m.chamaId === chamaId)
    if (!membershipForChama) {
      return <Navigate to="/select-chama" replace />
    }
    const role = membershipForChama.role
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />
    }
    return <Outlet />
  }

  const role = activeChama.role

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
