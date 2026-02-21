import express from 'express'
import { createUser } from '../controllers/adminUsers.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireGlobalRole, requireMembership, requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = express.Router()

const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['MEMBER', 'ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']).optional(),
    chamaId: z.string().uuid().optional(),
  }),
})

// SUPER_ADMIN can create any user
router.post(
  '/super/users',
  authenticate,
  requireGlobalRole(['SUPER_ADMIN']),
  validate(createUserSchema),
  createUser
)

// Chama ADMIN can create user + add to their chama
router.post(
  '/chamas/:chamaId/users',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'CHAIR']),
  validate(createUserSchema),
  createUser
)

export default router
