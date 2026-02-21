import api from './api'

export type ApiNotification = {
  id: string
  chamaId: string | null
  type: string
  title: string
  message: string
  actionUrl: string | null
  isRead: boolean
  createdAt: string
}

export async function fetchNotifications(params?: { unread?: boolean; limit?: number }): Promise<ApiNotification[]> {
  const q = new URLSearchParams()
  if (params?.unread) q.set('unread', 'true')
  if (params?.limit) q.set('limit', String(params.limit))
  const res = await api.get<{ success: boolean; data: ApiNotification[] }>(
    `/api/notifications${q.toString() ? `?${q.toString()}` : ''}`
  )
  return res.data.data ?? []
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/api/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/api/notifications/read-all')
}
