import prisma from '../prisma.js'

export async function createNotification(opts) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      chamaId: opts.chamaId || null,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      actionUrl: opts.actionUrl || null,
    },
  })
}

export async function getChamaAdminUserIds(chamaId) {
  const members = await prisma.membership.findMany({
    where: { chamaId, isActive: true, role: { in: ['CHAIR', 'TREASURER', 'ADMIN'] } },
    select: { userId: true },
  })
  return [...new Set(members.map((m) => m.userId))]
}
