import prisma from '../prisma.js'
import { paginateResponse } from '../utils/format.js'
import { evaluateLoanRisk } from '../services/aiLoanAdvisor.service.js'
import { getChamaAdminUserIds, createNotification } from '../services/notification.service.js'
import { enqueueEmail } from '../services/email/emailQueue.js'
import { loanApproved, loanRejected, loanDisbursed } from '../services/email/templates/index.js'

export async function requestLoan(req, res, next) {
  try {
    const { chamaId } = req.params
    const { principal, dueDate } = req.body

    // Get chama settings for interest rate
    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
    })

    if (!chama) {
      return res.status(404).json({
        success: false,
        message: 'Chama not found',
      })
    }

    // Calculate interest (simple calculation)
    const interestRate = chama.loanInterestRate || 0
    const interest = Math.round((principal * interestRate) / 100)
    const totalDue = principal + interest

    const result = await prisma.$transaction(async (tx) => {
      // Create loan request
      const loan = await tx.loan.create({
        data: {
          chamaId,
          userId: req.user.id,
          principal,
          interest,
          totalDue,
          status: 'PENDING',
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'REQUEST',
          entity: 'LOAN',
          entityId: loan.id,
          meta: { principal, interest, totalDue },
        },
      })

      return loan
    })

    try {
      const adminIds = await getChamaAdminUserIds(chamaId)
      const chama = await prisma.chama.findUnique({ where: { id: chamaId }, select: { name: true } })
      const requester = await prisma.user.findUnique({ where: { id: req.user.id }, select: { fullName: true } })
      for (const aid of adminIds) {
        await createNotification({
          userId: aid,
          chamaId,
          type: 'LOAN_REQUEST',
          title: 'New loan request',
          message: `${requester?.fullName || 'A member'} requested a loan of KES ${principal?.toLocaleString() || 0} in ${chama?.name || 'the chama'}.`,
          actionUrl: `/chama/${chamaId}/loans`,
        })
      }
    } catch (e) {
      console.error('Notify admins loan request error:', e)
    }

    res.status(201).json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMyLoans(req, res, next) {
  try {
    const { chamaId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const status = req.query.status

    const where = {
      chamaId,
      userId: req.user.id,
      ...(status && { status }),
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          repayments: {
            select: {
              id: true,
              amount: true,
              paidAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loan.count({ where }),
    ])

    res.json({
      success: true,
      data: paginateResponse(loans, total, page, limit),
    })
  } catch (error) {
    next(error)
  }
}

export async function getLoans(req, res, next) {
  try {
    const { chamaId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const statusParam = req.query.status
    const userId = req.query.userId
    const statusList = typeof statusParam === 'string' ? statusParam.split(',').map((s) => s.trim()).filter(Boolean) : []
    const where = {
      chamaId,
      ...(statusList.length === 1 && { status: statusList[0] }),
      ...(statusList.length > 1 && { status: { in: statusList } }),
      ...(userId && { userId }),
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          repayments: {
            select: {
              id: true,
              amount: true,
              paidAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loan.count({ where }),
    ])

    res.json({
      success: true,
      data: paginateResponse(loans, total, page, limit),
    })
  } catch (error) {
    next(error)
  }
}

export async function approveLoan(req, res, next) {
  try {
    const { chamaId, loanId } = req.params
    const { dueDate, activateImmediately, method: bodyMethod } = req.body || {}

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    })

    if (!loan || loan.chamaId !== chamaId) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      })
    }

    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
      select: { cycleDay: true },
    })

    // Auto due date: 12 months from approval, cycleDay of month if set
    const approvedAt = new Date()
    let resolvedDueDate = dueDate ? new Date(dueDate) : loan.dueDate
    if (!resolvedDueDate) {
      const d = new Date(approvedAt)
      d.setMonth(d.getMonth() + 12)
      const day = (chama?.cycleDay && chama.cycleDay >= 1 && chama.cycleDay <= 31)
        ? Math.min(chama.cycleDay, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())
        : d.getDate()
      d.setDate(day)
      resolvedDueDate = d
    }

    const result = await prisma.$transaction(async (tx) => {
      const disburseMethod = (bodyMethod || (activateImmediately ? 'CASH' : null))?.toUpperCase() || 'CASH'
      const shouldActivate = activateImmediately && ['CASH', 'BANK', 'OTHER', 'MPESA'].includes(disburseMethod)

      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: shouldActivate ? 'ACTIVE' : 'APPROVED',
          approvedAt,
          dueDate: resolvedDueDate,
        },
      })

      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: shouldActivate ? 'APPROVE_AND_ACTIVATE' : 'APPROVE',
          entity: 'LOAN',
          entityId: loanId,
          meta: shouldActivate ? { method: disburseMethod } : undefined,
        },
      })

      if (shouldActivate) {
        const receiptNo = `DISB-${loanId}-${Date.now()}`
        await tx.transaction.create({
          data: {
            chamaId,
            userId: loan.userId,
            type: 'LOAN_DISBURSE',
            direction: 'OUT',
            amount: loan.principal,
            description: `Loan disbursement (${disburseMethod}) - ${loan.user?.fullName || 'Member'}`,
            ref: receiptNo,
          },
        })
      }

      return updatedLoan
    })

    try {
      const user = await prisma.user.findUnique({
        where: { id: loan.userId },
        select: { email: true },
      })
      const chama = await prisma.chama.findUnique({
        where: { id: chamaId },
        select: { name: true },
      })
      const chamaName = chama?.name || 'Chama'
      if (user?.email) {
        const html = loanApproved({ chamaName, amount: loan.principal, currency: 'KES' })
        await enqueueEmail({
          to: user.email,
          subject: `Loan approved – ${chamaName}`,
          html,
        })
      }
      await createNotification({
        userId: loan.userId,
        chamaId,
        type: 'LOAN_APPROVED',
        title: 'Loan approved',
        message: `Your loan of KES ${loan.principal?.toLocaleString() || 0} in ${chamaName} has been approved.`,
        actionUrl: `/chama/${chamaId}/loans`,
      })
    } catch (e) {
      console.error('Loan approval email/notification error:', e)
    }

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function disburseLoan(req, res, next) {
  try {
    const { chamaId, loanId } = req.params
    const { phone: bodyPhone, dueDate: bodyDueDate, method: bodyMethod } = req.body || {}
    const method = (bodyMethod || 'MPESA').toUpperCase()
    const validMethods = ['MPESA', 'CASH', 'BANK', 'OTHER']
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'method must be one of: MPESA, CASH, BANK, OTHER',
      })
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    })

    if (!loan || loan.chamaId !== chamaId) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      })
    }

    if (loan.status === 'REJECTED' || loan.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Loan must be approved before disbursement',
      })
    }

    const existingMpesaDisburse = await prisma.mpesaPayment.findFirst({
      where: { loanId, purpose: 'LOAN_DISBURSE', status: 'SUCCESS' },
    })
    const existingTxDisburse = await prisma.transaction.findFirst({
      where: { chamaId, type: 'LOAN_DISBURSE', ref: `DISB-${loanId}` },
    })
    if (existingMpesaDisburse || existingTxDisburse) {
      return res.status(400).json({
        success: false,
        message: 'Loan already disbursed',
      })
    }

    const dueDate = bodyDueDate ? new Date(bodyDueDate) : loan.dueDate
    const phone = (bodyPhone || loan.user?.phone || '').toString().trim() || '254700000000'
    const receiptNo =
      method === 'MPESA'
        ? `B2C${Date.now().toString(36).toUpperCase()}`
        : `DISB-${loanId}-${Date.now()}`

    const result = await prisma.$transaction(async (tx) => {
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'ACTIVE',
          approvedAt: loan.approvedAt || new Date(),
          ...(dueDate && { dueDate }),
        },
      })

      if (method === 'MPESA') {
        await tx.mpesaPayment.create({
          data: {
            chamaId,
            userId: loan.userId,
            purpose: 'LOAN_DISBURSE',
            amount: loan.principal,
            phone,
            loanId,
            status: 'SUCCESS',
            mpesaReceiptNo: receiptNo,
            resultCode: '0',
            resultDesc: 'Disbursed (simulated)',
          },
        })
      }

      await tx.transaction.create({
        data: {
          chamaId,
          userId: loan.userId,
          type: 'LOAN_DISBURSE',
          direction: 'OUT',
          amount: loan.principal,
          description: `Loan disbursement (${method}) - ${loan.user?.fullName || 'Member'}`,
          ref: method === 'MPESA' ? receiptNo : `DISB-${loanId}`,
        },
      })

      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'LOAN_DISBURSE',
          entity: 'LOAN',
          entityId: loanId,
          meta: { principal: loan.principal, method, receiptNo, dueDate: dueDate?.toISOString() },
        },
      })

      return updatedLoan
    })

    const disbursementRecord =
      method === 'MPESA'
        ? await prisma.mpesaPayment.findFirst({
            where: { chamaId, loanId, purpose: 'LOAN_DISBURSE' },
            orderBy: { createdAt: 'desc' },
          })
        : { mpesaReceiptNo: receiptNo, purpose: 'LOAN_DISBURSE' }

    try {
      const user = await prisma.user.findUnique({
        where: { id: loan.userId },
        select: { email: true },
      })
      const chama = await prisma.chama.findUnique({
        where: { id: chamaId },
        select: { name: true },
      })
      const chamaName = chama?.name || 'Chama'
      const receiptRef = disbursementRecord?.mpesaReceiptNo || receiptNo
      if (user?.email) {
        const html = loanDisbursed({ chamaName, amount: loan.principal, receiptReference: receiptRef, currency: 'KES' })
        await enqueueEmail({
          to: user.email,
          subject: `Loan disbursed – ${chamaName}`,
          html,
        })
      }
      await createNotification({
        userId: loan.userId,
        chamaId,
        type: 'LOAN_DISBURSED',
        title: 'Loan disbursed',
        message: `Your loan of KES ${loan.principal?.toLocaleString() || 0} from ${chamaName} has been disbursed. Receipt: ${receiptRef}.`,
        actionUrl: `/chama/${chamaId}/loans`,
      })
    } catch (e) {
      console.error('Loan disbursed email/notification error:', e)
    }

    res.json({
      success: true,
      message: 'Loan disbursed successfully',
      data: {
        loan: result,
        disbursement: disbursementRecord,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function rejectLoan(req, res, next) {
  try {
    const { chamaId, loanId } = req.params

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    })

    if (!loan || loan.chamaId !== chamaId) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update loan status
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'REJECTED',
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          actorId: req.user.id,
          action: 'REJECT',
          entity: 'LOAN',
          entityId: loanId,
        },
      })

      return updatedLoan
    })

    try {
      const user = await prisma.user.findUnique({
        where: { id: loan.userId },
        select: { email: true },
      })
      const chama = await prisma.chama.findUnique({
        where: { id: chamaId },
        select: { name: true },
      })
      const chamaName = chama?.name || 'Chama'
      if (user?.email) {
        const html = loanRejected({ chamaName, amount: loan.principal, currency: 'KES' })
        await enqueueEmail({
          to: user.email,
          subject: `Loan update – ${chamaName}`,
          html,
        })
      }
      await createNotification({
        userId: loan.userId,
        chamaId,
        type: 'LOAN_REJECTED',
        title: 'Loan update',
        message: `Your loan request of KES ${loan.principal?.toLocaleString() || 0} in ${chamaName} was not approved.`,
        actionUrl: `/chama/${chamaId}/loans`,
      })
    } catch (e) {
      console.error('Loan rejection email/notification error:', e)
    }

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getLoanAiEvaluation(req, res, next) {
  try {
    const { chamaId, loanId } = req.params

    const loan = await prisma.loan.findFirst({
      where: { id: loanId, chamaId },
      select: { id: true, userId: true, principal: true, status: true },
    })

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      })
    }

    const evaluation = await evaluateLoanRisk({
      chamaId,
      userId: loan.userId,
      requestedAmount: loan.principal,
    })

    res.json({
      success: true,
      data: evaluation,
    })
  } catch (error) {
    next(error)
  }
}
