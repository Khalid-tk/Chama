import bcrypt from 'bcrypt'
import prisma from '../prisma.js'

/**
 * Create user (admin panel)
 * Can be called by:
 * - SUPER_ADMIN: create any user
 * - Chama ADMIN: create user + add to their chama
 */
export async function createUser(req, res, next) {
  try {
    const { fullName, email, phone, password, role, chamaId } = req.body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      })
    }

    // Hash password
    const passwordHash = password ? await bcrypt.hash(password, 10) : null

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        authProvider: 'LOCAL',
        globalRole: 'USER',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    })

    // If chamaId provided, create membership
    let membership = null
    if (chamaId) {
      // Verify chama exists
      const chama = await prisma.chama.findUnique({
        where: { id: chamaId },
      })

      if (!chama) {
        return res.status(404).json({
          success: false,
          message: 'Chama not found',
        })
      }

      // Create membership
      membership = await prisma.membership.create({
        data: {
          userId: user.id,
          chamaId,
          role: role || 'MEMBER',
          isActive: true,
        },
        include: {
          chama: {
            select: {
              id: true,
              name: true,
              chamaCode: true,
            },
          },
        },
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'USER_CREATED_BY_ADMIN',
          entity: 'USER',
          entityId: user.id,
          meta: {
            email: user.email,
            role: membership.role,
          },
        },
      })
    } else {
      // Platform-level audit log for SUPER_ADMIN
      await prisma.auditLog.create({
        data: {
          chamaId: '00000000-0000-0000-0000-000000000000',
          actorId: req.user.id,
          action: 'USER_CREATED_BY_ADMIN',
          entity: 'USER',
          entityId: user.id,
          meta: {
            email: user.email,
          },
        },
      })
    }

    res.status(201).json({
      success: true,
      data: {
        user,
        membership: membership
          ? {
              chamaId: membership.chamaId,
              role: membership.role,
              chama: membership.chama,
            }
          : null,
      },
      message: 'User created successfully',
    })
  } catch (error) {
    next(error)
  }
}
