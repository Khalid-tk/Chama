import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { NotificationsCenter } from './NotificationsCenter'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/notificationsApi'
import type { ApiNotification } from '../../lib/notificationsApi'
import { useAuthStore } from '../../store/authStore'

function resolveActionUrl(actionUrl: string | null, memberships: { chamaId: string; role: string }[]): string {
  if (!actionUrl) return '/select-chama'
  if (actionUrl.startsWith('/select-chama') || actionUrl.startsWith('/join-chama')) return actionUrl
  const match = actionUrl.match(/^\/chama\/([^/]+)(?:\/(.*))?$/)
  if (!match) return actionUrl
  const [, chamaId, suffix] = match
  const m = memberships.find((x) => x.chamaId === chamaId)
  const base = m && ['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR'].includes(m.role) ? '/admin' : '/member'
  return suffix ? `${base}/${chamaId}/${suffix}` : `${base}/${chamaId}/dashboard`
}

export function NotificationBell() {
  const navigate = useNavigate()
  const { memberships } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications({ limit: 50 })
      setNotifications(data)
    } catch (e) {
      console.error('Fetch notifications error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch (e) {
      console.error('Mark read error:', e)
    }
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (e) {
      console.error('Mark all read error:', e)
    }
  }, [])

  const handleNavigate = useCallback(
    (actionUrl: string) => {
      const path = resolveActionUrl(actionUrl, memberships)
      navigate(path)
    },
    [navigate, memberships]
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-ink-500 hover:bg-warm-deep hover:text-ink-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <Badge
            variant="danger"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>
      <NotificationsCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        onRefresh={load}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onNavigate={handleNavigate}
      />
    </>
  )
}
