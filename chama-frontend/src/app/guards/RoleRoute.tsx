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

  const membershipForChama = memberships?.find((m) => m.chamaId === chamaId)
  const role = activeChama?.chamaId === chamaId ? activeChama.role : membershipForChama?.role

  if (!chamaId || !membershipForChama) {
    return <Navigate to="/select-chama" replace />
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
