import bcrypt from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'
import prisma from '../prisma.js'
import { generateToken } from '../utils/jwt.js'
import { config } from '../config/env.js'

export async function register(req, res, next) {
  try {
    const { fullName, email, phone, password } = req.body

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

    // Check if this is the first user (make SUPER_ADMIN)
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        authProvider: 'LOCAL',
        globalRole: isFirstUser ? 'SUPER_ADMIN' : 'USER',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        authProvider: true,
        globalRole: true,
        createdAt: true,
      },
    })

    // Generate token
    const token = generateToken({
      sub: user.id,
      email: user.email,
    })

    // Get memberships (empty for new user)
    const memberships = []

    res.status(201).json({
      success: true,
      data: {
        token,
        user,
        memberships,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Check if user has password (not Google-only account)
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google login. Please sign in with Google.',
      })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Generate token
    const token = generateToken({
      sub: user.id,
      email: user.email,
    })

    // Get memberships
    const memberships = await prisma.membership.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        chama: {
          select: {
            id: true,
            name: true,
            chamaCode: true,
            joinMode: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          authProvider: user.authProvider,
          globalRole: user.globalRole,
          avatarUrl: user.avatarUrl ?? undefined,
        },
        memberships: memberships.map((m) => ({
          chamaId: m.chamaId,
          role: m.role,
          joinedAt: m.joinedAt,
          chama: m.chama,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'idToken is required',
      })
    }

    if (!config.google.clientId) {
      return res.status(500).json({
        success: false,
        message: 'Google authentication not configured',
      })
    }

    // Verify Google token
    const client = new OAuth2Client(config.google.clientId)
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      })
    }

    const { sub: googleId, email, name, picture } = payload

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    })

    // Check if this is the first user (make SUPER_ADMIN)
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          fullName: name || email?.split('@')[0] || 'User',
          email: email || '',
          googleId,
          authProvider: 'GOOGLE',
          passwordHash: null,
          globalRole: isFirstUser ? 'SUPER_ADMIN' : 'USER',
        },
      })
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          authProvider: 'GOOGLE',
        },
      })
    }

    // Generate token
    const token = generateToken({
      sub: user.id,
      email: user.email,
    })

    // Get memberships
    const memberships = await prisma.membership.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        chama: {
          select: {
            id: true,
            name: true,
            chamaCode: true,
            joinMode: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          authProvider: user.authProvider,
          globalRole: user.globalRole,
          avatarUrl: user.avatarUrl ?? undefined,
        },
        memberships: memberships.map((m) => ({
          chamaId: m.chamaId,
          role: m.role,
          joinedAt: m.joinedAt,
          chama: m.chama,
        })),
      },
    })
  } catch (error) {
    console.error('Google login error:', error)
    next(error)
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        authProvider: true,
        globalRole: true,
        avatarUrl: true,
        createdAt: true,
        memberships: {
          where: { isActive: true },
          select: {
            chamaId: true,
            role: true,
            joinedAt: true,
            chama: {
              select: {
                id: true,
                name: true,
                chamaCode: true,
                description: true,
                joinMode: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body

    // Always return success (don't leak user existence)
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (user) {
      // Generate reset token
      const crypto = await import('crypto')
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = await bcrypt.hash(rawToken, 10)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Create reset token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      })

      const resetLink = `${config.frontendUrl}/reset-password?token=${rawToken}`
      try {
        const { passwordReset } = await import('../services/email/templates/passwordReset.js')
        const { enqueueEmail } = await import('../services/email/emailQueue.js')
        const html = passwordReset({ resetLink })
        await enqueueEmail({
          to: email,
          subject: 'Reset your password',
          html,
        })
      } catch (emailError) {
        console.error('Enqueue password reset email error:', emailError)
        console.log(`\n🔗 Password Reset Link: ${resetLink}\n`)
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          chamaId: '00000000-0000-0000-0000-000000000000', // Platform-level
          actorId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          entity: 'USER',
          entityId: user.id,
        },
      })
    }

    // Always return success
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error) {
    next(error)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      })
    }

    // Find valid reset token
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    })

    // Find matching token
    let validToken = null
    for (const rt of resetTokens) {
      const isValid = await bcrypt.compare(token, rt.tokenHash)
      if (isValid) {
        validToken = rt
        break
      }
    }

    if (!validToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      })
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: validToken.userId },
      data: { passwordHash },
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: validToken.id },
      data: { usedAt: new Date() },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        chamaId: '00000000-0000-0000-0000-000000000000', // Platform-level
        actorId: validToken.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        entity: 'USER',
        entityId: validToken.userId,
      },
    })

    res.json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Change password for authenticated user (current password + new password)
 */
export async function changePassword(req, res, next) {
  try {
    const userId = req.user.id
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for accounts that use Google sign-in only',
      })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    res.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    next(error)
  }
}
