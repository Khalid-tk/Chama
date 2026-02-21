import prisma from '../prisma.js'

/**
 * Get all chamas (super admin)
 */
export async function getAllChamas(req, res, next) {
  try {
    const chamas = await prisma.chama.findMany({
      include: {
        _count: {
          select: {
            memberships: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: chamas.map((chama) => ({
        id: chama.id,
        name: chama.name,
        chamaCode: chama.chamaCode,
        joinMode: chama.joinMode,
        isPublic: chama.isPublic,
        memberCount: chama._count.memberships,
        createdAt: chama.createdAt,
      })),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all users (super admin)
 */
export async function getAllUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            memberships: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: users.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        globalRole: user.globalRole,
        authProvider: user.authProvider,
        memberCount: user._count.memberships,
        createdAt: user.createdAt,
      })),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update user global role (super admin)
 */
export async function updateUserGlobalRole(req, res, next) {
  try {
    const { userId } = req.params
    const { globalRole } = req.body

    if (!['USER', 'SUPER_ADMIN'].includes(globalRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid global role',
      })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { globalRole },
      select: {
        id: true,
        fullName: true,
        email: true,
        globalRole: true,
      },
    })

    // Audit log (platform-level): use PLATFORM chama if seeded, else first chama
    const platformChama = await prisma.chama.findFirst({
      where: { chamaCode: 'PLATFORM' },
      select: { id: true },
    })
    const fallbackChama = await prisma.chama.findFirst({ select: { id: true } })
    const auditChamaId = platformChama?.id ?? fallbackChama?.id
    if (auditChamaId) {
      await prisma.auditLog.create({
        data: {
          chamaId: auditChamaId,
          actorId: req.user.id,
          action: 'GLOBAL_ROLE_CHANGED',
          entity: 'USER',
          entityId: userId,
          meta: { globalRole },
        },
      })
    }

    res.json({
      success: true,
      data: user,
      message: 'Global role updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get platform audit logs (super admin)
 */
export async function getPlatformAuditLogs(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const skip = (page - 1) * limit

    const logs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        chama: {
          select: {
            id: true,
            name: true,
            chamaCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await prisma.auditLog.count()

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}
