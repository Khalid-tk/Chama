import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/notificationsApi'
import type { ApiNotification } from '../lib/notificationsApi'
import { useAuthStore } from '../store/authStore'
import { formatDateShort } from '../lib/format'

function formatTimeAgo(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (sec < 60) return 'Just now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`
  return formatDateShort(date)
}

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

export function Notifications() {
  const navigate = useNavigate()
  const { memberships } = useAuthStore()
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications({
        limit: 100,
        unread: filter === 'unread' ? true : undefined,
      })
      setNotifications(data)
    } catch (e) {
      console.error('Fetch notifications error:', e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch (e) {
      console.error('Mark read error:', e)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (e) {
      console.error('Mark all read error:', e)
    }
  }

  const handleClick = (n: ApiNotification) => {
    if (!n.isRead) handleMarkRead(n.id)
    const path = resolveActionUrl(n.actionUrl, memberships)
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-warm-bg p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="text-brown" size={24} />
              <h1 className="text-xl font-semibold text-ink-900">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="danger">{unreadCount > 99 ? '99+' : unreadCount}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-ink-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="text-ink-300 mb-2" size={48} />
                <p className="text-ink-500">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-ink-200">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => e.key === 'Enter' && handleClick(n)}
                    className={`p-4 hover:bg-warm-bg transition-colors cursor-pointer ${
                      !n.isRead ? 'bg-brown-light/50' : ''
                    }`}
                  >
                    <p className="font-medium text-ink-900">{n.title}</p>
                    <p className="text-sm text-ink-700 mt-1">{n.message}</p>
                    <p className="text-xs text-ink-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
