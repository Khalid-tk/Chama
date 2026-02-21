import express from 'express'
import {
  createContribution,
  getMyContributions,
  getContributions,
} from '../controllers/contributions.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireMembership, requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = express.Router()

const createContributionSchema = z.object({
  body: z.object({
    amount: z.number().int().positive(),
    method: z.string().min(1),
    reference: z.string().optional(),
    paidAt: z.string().datetime().optional(),
  }),
})

// Member routes
router.post(
  '/:chamaId/contributions',
  authenticate,
  requireMembership(),
  validate(createContributionSchema),
  createContribution
)
router.get(
  '/:chamaId/my/contributions',
  authenticate,
  requireMembership(),
  getMyContributions
)

// Admin routes
router.get(
  '/:chamaId/contributions',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']),
  getContributions
)

export default router
