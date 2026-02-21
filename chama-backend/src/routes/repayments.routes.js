import express from 'express'
import {
  createRepayment,
  recordRepayment,
  getMyRepayments,
  getRepayments,
} from '../controllers/repayments.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireMembership, requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = express.Router()

const createRepaymentSchema = z.object({
  body: z.object({
    amount: z.number().int().positive(),
    method: z.string().min(1),
    reference: z.string().optional(),
    paidAt: z.string().datetime().optional(),
  }),
})

// Member routes (member records their own repayment - e.g. cash/bank)
router.post(
  '/:chamaId/loans/:loanId/repayments',
  authenticate,
  requireMembership(),
  validate(createRepaymentSchema),
  createRepayment
)
// Admin/treasurer records repayment on behalf of member
router.post(
  '/:chamaId/loans/:loanId/repayments/record',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR']),
  validate(createRepaymentSchema),
  recordRepayment
)
router.get(
  '/:chamaId/my/repayments',
  authenticate,
  requireMembership(),
  getMyRepayments
)

// Admin routes
router.get(
  '/:chamaId/repayments',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']),
  getRepayments
)

export default router
