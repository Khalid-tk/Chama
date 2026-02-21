import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Bell, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { ApiNotification } from '../../lib/notificationsApi'
import { formatDateShort } from '../../lib/format'

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

type NotificationsCenterProps = {
  isOpen: boolean
  onClose: () => void
  notifications: ApiNotification[]
  unreadCount: number
  loading: boolean
  onRefresh: () => void
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onNavigate?: (actionUrl: string) => void
}

export function NotificationsCenter({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}: NotificationsCenterProps) {
  const navigate = useNavigate()
  useEffect(() => {
    if (isOpen) onRefresh()
  }, [isOpen])

  const getIcon = (type: string) => {
    switch (type) {
      case 'CONTRIBUTION_RECEIVED':
      case 'REPAYMENT_RECEIVED':
      case 'PAYMENT_SUCCESS':
        return <CheckCircle className="text-emerald-600" size={20} />
      case 'LOAN_APPROVED':
      case 'LOAN_DISBURSED':
      case 'JOIN_APPROVED':
        return <CheckCircle className="text-blue-600" size={20} />
      case 'LOAN_REJECTED':
      case 'JOIN_REJECTED':
        return <AlertCircle className="text-amber-600" size={20} />
      case 'INVITE':
      case 'JOIN_REQUEST':
      case 'LOAN_REQUEST':
        return <Bell className="text-blue-600" size={20} />
      default:
        return <Bell className="text-slate-500" size={20} />
    }
  }

  const handleClick = (n: ApiNotification) => {
    if (!n.isRead) onMarkRead(n.id)
    if (n.actionUrl && onNavigate) onNavigate(n.actionUrl)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md shadow-xl">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Bell className="text-blue-600" size={20} />
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="danger" className="ml-2">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="border-b border-slate-100 px-4 py-2 flex items-center justify-between gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose()
                navigate('/notifications')
              }}
            >
              View all
            </Button>
          </div>
          <div className="max-h-[500px] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="text-slate-300 mb-2" size={48} />
                <p className="text-slate-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => e.key === 'Enter' && handleClick(n)}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !n.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm">{n.title}</p>
                        <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
