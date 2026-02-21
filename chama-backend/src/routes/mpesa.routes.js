import express from 'express'
import {
  initiateStkPush,
  handleCallback,
  getMyMpesaPayments,
  getMpesaPayments,
  simulateCallback,
} from '../controllers/mpesa.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireMembership, requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = express.Router()

const stkPushSchema = z.object({
  body: z.object({
    purpose: z.enum(['CONTRIBUTION', 'REPAYMENT']),
    amount: z.number().int().positive(),
    phone: z.string().min(10),
    loanId: z.string().uuid().optional(),
  }),
})

const simulateCallbackSchema = z.object({
  body: z.object({
    checkoutRequestId: z.string().min(1),
    resultCode: z.union([z.number(), z.string()]), // 0 = success, 1 (or other) = failed
    mpesaReceiptNo: z.string().optional(),
    amount: z.number().optional(),
  }),
})

/** Only allow in non-production (for testing without Safaricom callback) */
function devOnly(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found' })
  }
  next()
}

// Public callback (no auth) – Safaricom Daraja calls this
router.post('/callback', handleCallback)

// DEV-only: simulate callback for testing (no auth, so you can trigger from Postman)
router.post(
  '/dev/simulate-callback',
  devOnly,
  validate(simulateCallbackSchema),
  simulateCallback
)

// Member routes
router.post(
  '/:chamaId/stkpush',
  authenticate,
  requireMembership(),
  validate(stkPushSchema),
  initiateStkPush
)
router.get(
  '/:chamaId/my/mpesa',
  authenticate,
  requireMembership(),
  getMyMpesaPayments
)

// Admin routes
router.get(
  '/:chamaId/mpesa',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']),
  getMpesaPayments
)

export default router
