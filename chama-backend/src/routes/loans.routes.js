import express from 'express'
import {
  requestLoan,
  getMyLoans,
  getLoans,
  approveLoan,
  rejectLoan,
  disburseLoan,
  getLoanAiEvaluation,
} from '../controllers/loans.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireMembership, requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = express.Router()

const requestLoanSchema = z.object({
  body: z.object({
    principal: z.number().int().positive(),
    dueDate: z.string().datetime().optional(),
  }),
})

const approveLoanSchema = z.object({
  body: z.object({
    dueDate: z.string().optional(),
    activateImmediately: z.boolean().optional(),
    method: z.enum(['MPESA', 'CASH', 'BANK', 'OTHER']).optional(),
  }),
})

const disburseLoanSchema = z.object({
  body: z.object({
    dueDate: z.string().optional(),
    method: z.enum(['MPESA', 'CASH', 'BANK', 'OTHER']).optional(),
    phone: z.string().optional(),
  }),
})

// Member routes
router.post(
  '/:chamaId/loans/request',
  authenticate,
  requireMembership(),
  validate(requestLoanSchema),
  requestLoan
)
router.get('/:chamaId/my/loans', authenticate, requireMembership(), getMyLoans)

// Admin routes
router.get(
  '/:chamaId/loans',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']),
  getLoans
)
router.patch(
  '/:chamaId/loans/:loanId/approve',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR']),
  validate(approveLoanSchema),
  approveLoan
)
router.patch(
  '/:chamaId/loans/:loanId/reject',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR']),
  rejectLoan
)
router.post(
  '/:chamaId/loans/:loanId/disburse',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER']),
  validate(disburseLoanSchema),
  disburseLoan
)
router.get(
  '/:chamaId/loans/:loanId/ai-evaluation',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR']),
  getLoanAiEvaluation
)

export default router
