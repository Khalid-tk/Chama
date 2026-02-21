import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function SuperAdminRoute() {
  const user = useAuthStore((s) => s.user)

  if (!user || user.globalRole !== 'SUPER_ADMIN') {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
