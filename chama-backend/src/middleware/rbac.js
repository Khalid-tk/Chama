import prisma from '../prisma.js'

/**
 * Middleware to require global role (SUPER_ADMIN)
 */
export function requireGlobalRole(allowedRoles = ['SUPER_ADMIN']) {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { globalRole: true },
      })

      if (!user || !allowedRoles.includes(user.globalRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.',
        })
      }

      next()
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking global role',
        error: error.message,
      })
    }
  }
}

/**
 * Middleware to require membership in a chama
 * Checks if user is a member of the chama specified in route params
 */
export function requireMembership(chamaIdParamName = 'chamaId') {
  return async (req, res, next) => {
    try {
      const chamaId = req.params[chamaIdParamName]

      if (!chamaId) {
        return res.status(400).json({
          success: false,
          message: 'Chama ID is required',
        })
      }

      const membership = await prisma.membership.findUnique({
        where: {
          userId_chamaId: {
            userId: req.user.id,
            chamaId,
          },
        },
        include: {
          chama: true,
        },
      })

      if (!membership || !membership.isActive) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this chama',
        })
      }

      req.membership = {
        chamaId: membership.chamaId,
        role: membership.role,
        chama: membership.chama,
      }

      next()
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking membership',
        error: error.message,
      })
    }
  }
}

/**
 * Middleware to require specific roles
 * Must be used after requireMembership
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(500).json({
        success: false,
        message: 'Membership check required before role check',
      })
    }

    if (!allowedRoles.includes(req.membership.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      })
    }

    next()
  }
}
