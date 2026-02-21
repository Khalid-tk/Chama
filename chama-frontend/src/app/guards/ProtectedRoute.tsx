import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function ProtectedRoute() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const token = useAuthStore((s) => s.token)

  if (!isAuthed || !token) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
