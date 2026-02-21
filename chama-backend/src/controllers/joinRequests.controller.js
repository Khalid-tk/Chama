import prisma from '../prisma.js'
import { getChamaAdminUserIds, createNotification } from '../services/notification.service.js'
import { enqueueEmail } from '../services/email/emailQueue.js'
import { joinRequestApproved, joinRequestRejected } from '../services/email/templates/index.js'

export async function createJoinRequest(req, res, next) {
  try {
    const { chamaId } = req.params
    const userId = req.user.id

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } })
    if (!chama) {
      return res.status(404).json({ success: false, message: 'Chama not found' })
    }

    const existingMembership = await prisma.membership.findUnique({
      where: { userId_chamaId: { userId, chamaId } },
    })
    if (existingMembership?.isActive) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this chama',
      })
    }

    const existingRequest = await prisma.joinRequest.findUnique({
      where: { chamaId_userId: { chamaId, userId } },
    })
    if (existingRequest?.status === 'PENDING') {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending join request for this chama',
      })
    }

    const joinRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.joinRequest.upsert({
        where: { chamaId_userId: { chamaId, userId } },
        create: { chamaId, userId, status: 'PENDING' },
        update: { status: 'PENDING' },
      })
      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: userId,
          action: 'JOIN_REQUEST_CREATED',
          entity: 'JOIN_REQUEST',
          entityId: created.id,
          meta: { userId },
        },
      })
      return created
    })

    try {
      const adminIds = await getChamaAdminUserIds(chamaId)
      const chama = await prisma.chama.findUnique({ where: { id: chamaId }, select: { name: true } })
      const requester = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } })
      for (const aid of adminIds) {
        if (aid !== userId) {
          await createNotification({
            userId: aid,
            chamaId,
            type: 'JOIN_REQUEST',
            title: 'New join request',
            message: `${requester?.fullName || 'A member'} requested to join ${chama?.name || 'the chama'}.`,
            actionUrl: `/chama/${chamaId}/join-requests`,
          })
        }
      }
    } catch (e) {
      console.error('Notify admins join request error:', e)
    }

    res.status(201).json({
      success: true,
      data: joinRequest,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMyJoinRequest(req, res, next) {
  try {
    const { chamaId } = req.params
    const userId = req.user.id

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { chamaId_userId: { chamaId, userId } },
    })

    res.json({
      success: true,
      data: joinRequest,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMyJoinRequests(req, res, next) {
  try {
    const userId = req.user.id

    const requests = await prisma.joinRequest.findMany({
      where: { userId },
      include: {
        chama: {
          select: { id: true, name: true, chamaCode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: requests.map((r) => ({
        id: r.id,
        chamaId: r.chamaId,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        chama: r.chama,
      })),
    })
  } catch (error) {
    next(error)
  }
}

export async function getJoinRequests(req, res, next) {
  try {
    const { chamaId } = req.params
    const status = req.query.status || 'PENDING'

    const requests = await prisma.joinRequest.findMany({
      where: {
        chamaId,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({
      success: true,
      data: requests.map((r) => ({
        id: r.id,
        chamaId: r.chamaId,
        userId: r.userId,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: r.user,
      })),
    })
  } catch (error) {
    next(error)
  }
}

export async function approveJoinRequest(req, res, next) {
  try {
    const { chamaId, requestId } = req.params

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    })

    if (!joinRequest || joinRequest.chamaId !== chamaId) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found',
      })
    }

    if (joinRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Join request is already ${joinRequest.status}`,
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.joinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      })

      // Check if membership already exists
      const existingMembership = await tx.membership.findUnique({
        where: {
          userId_chamaId: {
            userId: joinRequest.userId,
            chamaId,
          },
        },
      })

      let membership
      if (existingMembership) {
        // Reactivate membership
        membership = await tx.membership.update({
          where: { id: existingMembership.id },
          data: { isActive: true },
        })
      } else {
        // Create new membership
        membership = await tx.membership.create({
          data: {
            userId: joinRequest.userId,
            chamaId,
            role: 'MEMBER',
          },
        })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'JOIN_REQUEST_APPROVED',
          entity: 'JOIN_REQUEST',
          entityId: requestId,
          meta: { userId: joinRequest.userId },
        },
      })

      return { joinRequest: updatedRequest, membership }
    })

    try {
      const user = await prisma.user.findUnique({
        where: { id: joinRequest.userId },
        select: { email: true },
      })
      const chama = await prisma.chama.findUnique({
        where: { id: chamaId },
        select: { name: true },
      })
      const chamaName = chama?.name || 'Chama'
      if (user?.email) {
        const html = joinRequestApproved({ chamaName })
        await enqueueEmail({
          to: user.email,
          subject: `You've been approved to join ${chamaName}`,
          html,
        })
      }
      await createNotification({
        userId: joinRequest.userId,
        chamaId,
        type: 'JOIN_APPROVED',
        title: 'Join request approved',
        message: `Your request to join ${chamaName} has been approved.`,
        actionUrl: '/select-chama',
      })
    } catch (e) {
      console.error('Join request approval email/notification error:', e)
    }

    res.json({
      success: true,
      data: result.joinRequest,
    })
  } catch (error) {
    next(error)
  }
}

export async function rejectJoinRequest(req, res, next) {
  try {
    const { chamaId, requestId } = req.params

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    })

    if (!joinRequest || joinRequest.chamaId !== chamaId) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found',
      })
    }

    if (joinRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Join request is already ${joinRequest.status}`,
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.joinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      })

      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'JOIN_REQUEST_REJECTED',
          entity: 'JOIN_REQUEST',
          entityId: requestId,
          meta: { userId: joinRequest.userId },
        },
      })

      return updatedRequest
    })

    try {
      const user = await prisma.user.findUnique({
        where: { id: joinRequest.userId },
        select: { email: true },
      })
      const chama = await prisma.chama.findUnique({
        where: { id: chamaId },
        select: { name: true },
      })
      const chamaName = chama?.name || 'Chama'
      if (user?.email) {
        const html = joinRequestRejected({ chamaName })
        await enqueueEmail({
          to: user.email,
          subject: `Update on your request to join ${chamaName}`,
          html,
        })
      }
      await createNotification({
        userId: joinRequest.userId,
        chamaId,
        type: 'JOIN_REJECTED',
        title: 'Join request update',
        message: `Your request to join ${chamaName} was not approved at this time.`,
      })
    } catch (e) {
      console.error('Join request rejection email/notification error:', e)
    }

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
