import prisma from '../prisma.js'
import crypto from 'crypto'

/**
 * Generate unique chama code (8 characters, alphanumeric)
 */
function generateChamaCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
}

/**
 * Generate join code (6 characters, alphanumeric)
 */
function generateJoinCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6)
}

export async function createChama(req, res, next) {
  try {
    const {
      name,
      description,
      joinMode = 'OPEN',
      isPublic = false,
      contributionAmount,
      cycleDay,
      loanInterestRate,
      penaltyRate,
    } = req.body

    // Generate unique chamaCode
    let chamaCode = generateChamaCode()
    let exists = await prisma.chama.findUnique({ where: { chamaCode } })
    while (exists) {
      chamaCode = generateChamaCode()
      exists = await prisma.chama.findUnique({ where: { chamaCode } })
    }

    // Generate joinCode
    const joinCode = generateJoinCode()

    // Create chama and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create chama
      const chama = await tx.chama.create({
        data: {
          name,
          description,
          chamaCode,
          joinCode,
          joinMode,
          isPublic,
          contributionAmount,
          cycleDay,
          loanInterestRate,
          penaltyRate,
        },
      })

      // Create membership for creator as ADMIN
      await tx.membership.create({
        data: {
          userId: req.user.id,
          chamaId: chama.id,
          role: 'ADMIN',
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          chamaId: chama.id,
          actorId: req.user.id,
          action: 'CREATE',
          entity: 'CHAMA',
          entityId: chama.id,
          meta: {
            name,
            chamaCode,
            joinMode,
          },
        },
      })

      return chama
    })

    // Return chama with joinCode (only visible to creator/admin)
    res.status(201).json({
      success: true,
      data: {
        ...result,
        joinCode, // Include joinCode for admin/creator
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getMyChamas(req, res, next) {
  try {
    const memberships = await prisma.membership.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      include: {
        chama: {
          select: {
            id: true,
            name: true,
            description: true,
            chamaCode: true,
            joinMode: true,
            isPublic: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    res.json({
      success: true,
      data: memberships.map((m) => ({
        chamaId: m.chamaId,
        role: m.role,
        joinedAt: m.joinedAt,
        chama: m.chama,
      })),
    })
  } catch (error) {
    next(error)
  }
}

export async function searchChamas(req, res, next) {
  try {
    const query = (req.query.q || '').trim()
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // When no query (or short): return all joinable chamas so new users can see and request to join
    const listAll = !query || query.length < 2
    const where = listAll
      ? { chamaCode: { not: 'PLATFORM' } }
      : (() => {
          const exactCode = query.toUpperCase()
          return {
            OR: [
              {
                chamaCode: { not: 'PLATFORM' },
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { chamaCode: { contains: exactCode, mode: 'insensitive' } },
                ],
              },
              { chamaCode: exactCode },
            ],
          }
        })()

    const [chamas, total] = await Promise.all([
      prisma.chama.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          chamaCode: true,
          joinMode: true,
          isPublic: true,
          createdAt: true,
          _count: {
            select: {
              memberships: {
                where: { isActive: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.chama.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        data: chamas.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          chamaCode: c.chamaCode,
          joinMode: c.joinMode,
          isPublic: c.isPublic,
          memberCount: c._count.memberships,
          createdAt: c.createdAt,
        })),
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

export async function joinChama(req, res, next) {
  try {
    const { chamaCode, joinCode } = req.body

    if (!chamaCode) {
      return res.status(400).json({
        success: false,
        message: 'chamaCode is required',
      })
    }

    // Find chama
    const chama = await prisma.chama.findUnique({
      where: { chamaCode },
    })

    if (!chama) {
      return res.status(404).json({
        success: false,
        message: 'Chama not found',
      })
    }

    // Check if already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId: req.user.id,
          chamaId: chama.id,
        },
      },
    })

    if (existingMembership && existingMembership.isActive) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this chama',
      })
    }

    // Handle join based on joinMode
    if (chama.joinMode === 'OPEN') {
      // Verify joinCode if chama has one
      if (chama.joinCode && joinCode !== chama.joinCode) {
        return res.status(403).json({
          success: false,
          message: 'Invalid join code',
        })
      }

      // Create membership immediately
      const membership = await prisma.$transaction(async (tx) => {
        // Reactivate if exists
        if (existingMembership) {
          const mem = await tx.membership.update({
            where: { id: existingMembership.id },
            data: { isActive: true },
          })

          await tx.auditLog.create({
            data: {
              chamaId: chama.id,
              actorId: req.user.id,
              action: 'REJOIN',
              entity: 'MEMBERSHIP',
              entityId: mem.id,
            },
          })

          return mem
        }

        // Create new membership
        const mem = await tx.membership.create({
          data: {
            userId: req.user.id,
            chamaId: chama.id,
            role: 'MEMBER',
          },
        })

        await tx.auditLog.create({
          data: {
            chamaId: chama.id,
            actorId: req.user.id,
            action: 'JOIN',
            entity: 'MEMBERSHIP',
            entityId: mem.id,
          },
        })

        return mem
      })

      res.status(201).json({
        success: true,
        data: {
          membership,
          chama: {
            id: chama.id,
            name: chama.name,
            chamaCode: chama.chamaCode,
          },
        },
      })
    } else if (chama.joinMode === 'APPROVAL') {
      // Create join request
      const joinRequest = await prisma.$transaction(async (tx) => {
        // Check if request already exists
        const existingRequest = await tx.joinRequest.findUnique({
          where: {
            chamaId_userId: {
              chamaId: chama.id,
              userId: req.user.id,
            },
          },
        })

        if (existingRequest) {
          if (existingRequest.status === 'PENDING') {
            return res.status(409).json({
              success: false,
              message: 'Join request already pending',
            })
          }
          // If rejected, create new request
          if (existingRequest.status === 'REJECTED') {
            const req = await tx.joinRequest.update({
              where: { id: existingRequest.id },
              data: { status: 'PENDING' },
            })

            await tx.auditLog.create({
              data: {
                chamaId: chama.id,
                actorId: req.user.id,
                action: 'REQUEST_JOIN',
                entity: 'JOIN_REQUEST',
                entityId: req.id,
              },
            })

            return req
          }
        }

        const req = await tx.joinRequest.create({
          data: {
            chamaId: chama.id,
            userId: req.user.id,
            status: 'PENDING',
          },
        })

        await tx.auditLog.create({
          data: {
            chamaId: chama.id,
            actorId: req.user.id,
            action: 'REQUEST_JOIN',
            entity: 'JOIN_REQUEST',
            entityId: req.id,
          },
        })

        return req
      })

      res.status(201).json({
        success: true,
        data: {
          joinRequest,
          message: 'Join request submitted. Waiting for approval.',
        },
      })
    }
  } catch (error) {
    next(error)
  }
}

export async function getChama(req, res, next) {
  try {
    const chama = await prisma.chama.findUnique({
      where: { id: req.params.chamaId },
      include: {
        memberships: {
          where: { userId: req.user.id, isActive: true },
          select: {
            role: true,
            joinedAt: true,
          },
        },
      },
    })

    if (!chama) {
      return res.status(404).json({
        success: false,
        message: 'Chama not found',
      })
    }

    const membership = chama.memberships[0]
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chama',
      })
    }

    // Get summary counts
    const [memberCount, contributionCount, loanCount] = await Promise.all([
      prisma.membership.count({
        where: { chamaId: chama.id, isActive: true },
      }),
      prisma.contribution.count({
        where: { chamaId: chama.id },
      }),
      prisma.loan.count({
        where: { chamaId: chama.id },
      }),
    ])

    res.json({
      success: true,
      data: {
        id: chama.id,
        name: chama.name,
        description: chama.description,
        chamaCode: chama.chamaCode,
        joinMode: chama.joinMode,
        isPublic: chama.isPublic,
        contributionAmount: chama.contributionAmount,
        cycleDay: chama.cycleDay,
        loanInterestRate: chama.loanInterestRate,
        penaltyRate: chama.penaltyRate,
        userRole: membership.role,
        joinedAt: membership.joinedAt,
        summary: {
          memberCount,
          contributionCount,
          loanCount,
        },
        // Include joinCode only if user is ADMIN
        ...(membership.role === 'ADMIN' || membership.role === 'CHAIR'
          ? { joinCode: chama.joinCode }
          : {}),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getMembers(req, res, next) {
  try {
    const members = await prisma.membership.findMany({
      where: {
        chamaId: req.params.chamaId,
        isActive: true,
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
        joinedAt: 'asc',
      },
    })

    res.json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    })
  } catch (error) {
    next(error)
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    const { chamaId, userId } = req.params
    const { role } = req.body

    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    })

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found',
      })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const mem = await tx.membership.update({
        where: { id: membership.id },
        data: { role },
      })

      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'UPDATE_ROLE',
          entity: 'MEMBERSHIP',
          entityId: mem.id,
          meta: { oldRole: membership.role, newRole: role },
        },
      })

      return mem
    })

    try {
      const chama = await prisma.chama.findUnique({ where: { id: chamaId }, select: { name: true } })
      const memberUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
      const chamaName = chama?.name || 'Chama'
      if (memberUser?.email) {
        const { roleChanged } = await import('../services/email/templates/roleChanged.js')
        const { enqueueEmail } = await import('../services/email/emailQueue.js')
        const html = roleChanged({ chamaName, newRole: role })
        await enqueueEmail({
          to: memberUser.email,
          subject: `Role updated – ${chamaName}`,
          html,
        })
      }
      const { createNotification } = await import('../services/notification.service.js')
      await createNotification({
        userId,
        chamaId,
        type: 'ROLE_CHANGED',
        title: 'Role updated',
        message: `Your role in ${chamaName} has been changed to ${role}.`,
        actionUrl: '/select-chama',
      })
    } catch (e) {
      console.error('Role change email/notification error:', e)
    }

    res.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateChamaSettings(req, res, next) {
  try {
    const { chamaId } = req.params
    const { contributionAmount, cycleDay, loanInterestRate, penaltyRate, joinCode } = req.body

    const updateData = {}
    if (contributionAmount !== undefined) updateData.contributionAmount = contributionAmount
    if (cycleDay !== undefined) updateData.cycleDay = cycleDay
    if (loanInterestRate !== undefined) updateData.loanInterestRate = loanInterestRate
    if (penaltyRate !== undefined) updateData.penaltyRate = penaltyRate
    if (joinCode !== undefined) updateData.joinCode = joinCode

    const updated = await prisma.$transaction(async (tx) => {
      const chama = await tx.chama.update({
        where: { id: chamaId },
        data: updateData,
      })

      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'UPDATE_SETTINGS',
          entity: 'CHAMA',
          entityId: chamaId,
          meta: updateData,
        },
      })

      return chama
    })

    res.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get audit logs for a chama (admin/treasurer/chair/auditor)
 */
export async function getChamaAuditLogs(req, res, next) {
  try {
    const { chamaId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    const skip = (page - 1) * limit
    const entityFilter = req.query.entity
    const actionFilter = req.query.action

    const where = { chamaId }
    if (entityFilter) where.entity = entityFilter
    if (actionFilter) where.action = { contains: actionFilter, mode: 'insensitive' }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

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
