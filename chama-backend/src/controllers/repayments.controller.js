import prisma from '../prisma.js'
import { paginateResponse } from '../utils/format.js'

/** Admin/treasurer records a repayment on behalf of a member (e.g. cash/bank received). */
export async function recordRepayment(req, res, next) {
  try {
    const { chamaId, loanId } = req.params
    const { amount, method, reference, paidAt } = req.body

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { repayments: true },
    })

    if (!loan || loan.chamaId !== chamaId) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const repayment = await tx.repayment.create({
        data: {
          chamaId,
          loanId,
          userId: loan.userId,
          amount,
          method: method || 'CASH',
          reference: reference || null,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      })

      await tx.transaction.create({
        data: {
          chamaId,
          userId: loan.userId,
          type: 'REPAYMENT',
          direction: 'IN',
          amount,
          description: `Repayment (${method}) for loan`,
          ref: reference,
        },
      })

      const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0) + amount
      let newStatus = loan.status
      if (totalPaid >= loan.totalDue) {
        newStatus = 'PAID'
      } else if (loan.dueDate && new Date() > new Date(loan.dueDate) && totalPaid < loan.totalDue) {
        newStatus = 'LATE'
      } else {
        newStatus = 'ACTIVE'
      }

      await tx.loan.update({
        where: { id: loanId },
        data: { status: newStatus },
      })

      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'CREATE',
          entity: 'REPAYMENT',
          entityId: repayment.id,
          meta: { amount, method, loanId, recordedFor: loan.userId },
        },
      })

      return repayment
    })

    res.status(201).json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function createRepayment(req, res, next) {
  try {
    const { chamaId, loanId } = req.params
    const { amount, method, reference, paidAt } = req.body

    // Verify loan belongs to user and chama
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        repayments: true,
      },
    })

    if (!loan || loan.chamaId !== chamaId || loan.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      })
    }

    if (loan.status !== 'ACTIVE' && loan.status !== 'LATE') {
      return res.status(400).json({
        success: false,
        message: 'Only ACTIVE or LATE loans can be repaid',
      })
    }

    const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0)
    const outstandingBalance = loan.totalDue - totalPaid
    if (outstandingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This loan is already fully repaid',
      })
    }
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      })
    }
    if (amount > outstandingBalance) {
      return res.status(400).json({
        success: false,
        message: `Amount cannot exceed outstanding balance (KES ${outstandingBalance.toLocaleString()})`,
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create repayment
      const repayment = await tx.repayment.create({
        data: {
          chamaId,
          loanId,
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
          type: 'REPAYMENT',
          direction: 'IN',
          amount,
          description: `Repayment for loan ${loanId}`,
          ref: reference,
        },
      })

      // Calculate total paid
      const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0) + amount

      // Update loan status
      let newStatus = loan.status
      if (totalPaid >= loan.totalDue) {
        newStatus = 'PAID'
      } else if (loan.dueDate && new Date() > new Date(loan.dueDate) && totalPaid < loan.totalDue) {
        newStatus = 'LATE'
      } else if (loan.status === 'PENDING' || loan.status === 'REJECTED') {
        // Don't change status if pending/rejected
      } else {
        newStatus = 'ACTIVE'
      }

      await tx.loan.update({
        where: { id: loanId },
        data: { status: newStatus },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'CREATE',
          entity: 'REPAYMENT',
          entityId: repayment.id,
          meta: { amount, method, loanId },
        },
      })

      return repayment
    })

    res.status(201).json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMyRepayments(req, res, next) {
  try {
    const { chamaId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const where = {
      chamaId,
      userId: req.user.id,
    }

    if (req.query.loanId) {
      where.loanId = req.query.loanId
    }

    const [repayments, total] = await Promise.all([
      prisma.repayment.findMany({
        where,
        include: {
          loan: {
            select: {
              id: true,
              principal: true,
              totalDue: true,
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.repayment.count({ where }),
    ])

    res.json({
      success: true,
      data: paginateResponse(repayments, page, limit, total),
    })
  } catch (error) {
    next(error)
  }
}

export async function getRepayments(req, res, next) {
  try {
    const { chamaId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const where = {
      chamaId,
    }

    if (req.query.userId) {
      where.userId = req.query.userId
    }
    if (req.query.loanId) {
      where.loanId = req.query.loanId
    }

    const [repayments, total] = await Promise.all([
      prisma.repayment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          loan: {
            select: {
              id: true,
              principal: true,
              totalDue: true,
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.repayment.count({ where }),
    ])

    res.json({
      success: true,
      data: paginateResponse(repayments, page, limit, total),
    })
  } catch (error) {
    next(error)
  }
}
