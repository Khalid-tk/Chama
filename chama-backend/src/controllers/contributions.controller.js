import prisma from '../prisma.js'
import { paginateResponse } from '../utils/format.js'

export async function createContribution(req, res, next) {
  try {
    const { chamaId } = req.params
    const { amount, method, reference, paidAt } = req.body

    const result = await prisma.$transaction(async (tx) => {
      // Create contribution
      const contribution = await tx.contribution.create({
        data: {
          chamaId,
          userId: req.user.id,
          amount,
          method,
          reference,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      })

      // Create transaction entry
      await tx.transaction.create({
        data: {
          chamaId,
          userId: req.user.id,
          type: 'CONTRIBUTION',
          direction: 'IN',
          amount,
          description: `Contribution to chama`,
          ref: reference,
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'CREATE',
          entity: 'CONTRIBUTION',
          entityId: contribution.id,
          meta: { amount, method },
        },
      })

      return contribution
    })

    res.status(201).json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMyContributions(req, res, next) {
  try {
    const { chamaId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const where = {
      chamaId,
      userId: req.user.id,
    }

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contribution.count({ where }),
    ])

    res.json({
      success: true,
      data: paginateResponse(contributions, total, page, limit),
    })
  } catch (error) {
    next(error)
  }
}

export async function getContributions(req, res, next) {
  try {
    const { chamaId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const userId = req.query.userId

    const where = {
      chamaId,
      ...(userId && { userId }),
    }

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contribution.count({ where }),
    ])

    res.json({
      success: true,
      data: paginateResponse(contributions, total, page, limit),
    })
  } catch (error) {
    next(error)
  }
}
