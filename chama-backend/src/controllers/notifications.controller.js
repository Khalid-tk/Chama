import prisma from '../prisma.js'

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    const unreadOnly = req.query.unread === 'true'

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    res.json({
      success: true,
      data: notifications.map((n) => ({
        id: n.id,
        chamaId: n.chamaId,
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    })
  } catch (error) {
    next(error)
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    })
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    res.json({ success: true, data: { id, isRead: true } })
  } catch (error) {
    next(error)
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user.id
    await prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    })
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    next(error)
  }
}

export async function broadcastChamaNotification(req, res, next) {
  try {
    const { chamaId } = req.params
    const { title, message, actionUrl } = req.body || {}

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'title and message are required',
      })
    }

    const members = await prisma.membership.findMany({
      where: { chamaId, isActive: true },
      select: { userId: true },
    })

    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.userId,
        chamaId,
        type: 'BROADCAST',
        title,
        message,
        actionUrl: actionUrl || null,
      })),
    })

    res.json({
      success: true,
      message: `Notification sent to ${members.length} members`,
    })
  } catch (error) {
    next(error)
  }
}
