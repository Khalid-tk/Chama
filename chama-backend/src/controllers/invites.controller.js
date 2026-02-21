import bcrypt from 'bcrypt'
import crypto from 'crypto'
import prisma from '../prisma.js'
import { config } from '../config/env.js'
import { enqueueEmail } from '../services/email/emailQueue.js'
import { inviteMember } from '../services/email/templates/inviteMember.js'
import { createNotification } from '../services/notification.service.js'

/**
 * Create invite
 */
export async function createInvite(req, res, next) {
  try {
    const { chamaId } = req.params
    const { email, role = 'MEMBER' } = req.body

    // Check if user already has membership
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: {
            chamaId,
            isActive: true,
          },
        },
      },
    })

    if (existingUser && existingUser.memberships.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this chama',
      })
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        chamaId,
        email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (existingInvite) {
      return res.status(409).json({
        success: false,
        message: 'A pending invite already exists for this email',
      })
    }

    // Generate invite token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = await bcrypt.hash(rawToken, 10)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invite
    const invite = await prisma.invite.create({
      data: {
        chamaId,
        email,
        role,
        tokenHash,
        expiresAt,
        invitedByUserId: req.user.id,
        status: 'PENDING',
      },
      include: {
        chama: {
          select: {
            name: true,
          },
        },
      },
    })

    const inviteLink = `${config.frontendUrl}/accept-invite?token=${rawToken}`
    try {
      const html = inviteMember({ chamaName: invite.chama.name, inviteLink, role })
      await enqueueEmail({
        to: email,
        subject: `Invitation to join ${invite.chama.name}`,
        html,
      })
    } catch (e) {
      console.error('Enqueue invite email error:', e)
      console.log(`\n🔗 Invite Link: ${inviteLink}\n`)
    }
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } })
    if (existingUserByEmail) {
      try {
        await createNotification({
          userId: existingUserByEmail.id,
          chamaId: invite.chamaId,
          type: 'INVITE',
          title: 'You\'ve been invited',
          message: `You've been invited to join ${invite.chama.name}`,
          actionUrl: inviteLink,
        })
      } catch (e) {
        console.error('Create invite notification error:', e)
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        chamaId,
        actorId: req.user.id,
        action: 'INVITE_SENT',
        entity: 'INVITE',
        entityId: invite.id,
        meta: {
          email,
          role,
        },
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        status: invite.status,
      },
      message: 'Invite sent successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get invites for a chama
 */
export async function getInvites(req, res, next) {
  try {
    const { chamaId } = req.params

    const invites = await prisma.invite.findMany({
      where: { chamaId },
      include: {
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: invites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        invitedBy: invite.invitedBy,
      })),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Preview invite (get invite details without accepting)
 */
export async function previewInvite(req, res, next) {
  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      })
    }

    // Find valid invite
    const invites = await prisma.invite.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        chama: {
          select: {
            name: true,
          },
        },
      },
    })

    // Find matching token
    let validInvite = null
    for (const invite of invites) {
      const isValid = await bcrypt.compare(token, invite.tokenHash)
      if (isValid) {
        validInvite = invite
        break
      }
    }

    if (!validInvite) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invite token',
      })
    }

    res.json({
      success: true,
      data: {
        email: validInvite.email,
        chamaName: validInvite.chama.name,
        role: validInvite.role,
        expiresAt: validInvite.expiresAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Accept invite
 */
export async function acceptInvite(req, res, next) {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      })
    }

    // Find valid invite
    const invites = await prisma.invite.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        chama: true,
      },
    })

    // Find matching token
    let validInvite = null
    for (const invite of invites) {
      const isValid = await bcrypt.compare(token, invite.tokenHash)
      if (isValid) {
        validInvite = invite
        break
      }
    }

    if (!validInvite) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invite token',
      })
    }

    // Verify email matches (if user is logged in)
    if (req.user && req.user.email !== validInvite.email) {
      return res.status(403).json({
        success: false,
        message: 'This invite is for a different email address',
      })
    }

    // Check if user exists
    let user = req.user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please login or signup to accept this invite',
        inviteEmail: validInvite.email,
      })
    }

    // Check if already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId: user.id,
          chamaId: validInvite.chamaId,
        },
      },
    })

    if (existingMembership && existingMembership.isActive) {
      // Mark invite as accepted anyway
      await prisma.invite.update({
        where: { id: validInvite.id },
        data: { status: 'ACCEPTED' },
      })

      return res.status(409).json({
        success: false,
        message: 'You are already a member of this chama',
      })
    }

    // Create or reactivate membership
    await prisma.$transaction(async (tx) => {
      if (existingMembership) {
        await tx.membership.update({
          where: { id: existingMembership.id },
          data: {
            role: validInvite.role,
            isActive: true,
          },
        })
      } else {
        await tx.membership.create({
          data: {
            userId: user.id,
            chamaId: validInvite.chamaId,
            role: validInvite.role,
            isActive: true,
          },
        })
      }

      // Mark invite as accepted
      await tx.invite.update({
        where: { id: validInvite.id },
        data: { status: 'ACCEPTED' },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId: validInvite.chamaId,
          actorId: user.id,
          action: 'INVITE_ACCEPTED',
          entity: 'INVITE',
          entityId: validInvite.id,
          meta: {
            email: validInvite.email,
            role: validInvite.role,
          },
        },
      })
    })

    res.json({
      success: true,
      data: {
        chamaId: validInvite.chamaId,
        chamaName: validInvite.chama.name,
        role: validInvite.role,
      },
      message: 'Invite accepted successfully',
    })
  } catch (error) {
    next(error)
  }
}
