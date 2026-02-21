import express from 'express'
import {
  getAllChamas,
  getAllUsers,
  updateUserGlobalRole,
  getPlatformAuditLogs,
} from '../controllers/superAdmin.controller.js'
import {
  flushEmailQueue,
  getEmailJobs,
  retryEmailJob,
} from '../controllers/emailAdmin.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireGlobalRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = express.Router()

const updateGlobalRoleSchema = z.object({
  body: z.object({
    globalRole: z.enum(['USER', 'SUPER_ADMIN']),
  }),
})

// All routes require SUPER_ADMIN
router.use(authenticate, requireGlobalRole(['SUPER_ADMIN']))

router.get('/chamas', getAllChamas)
router.get('/users', getAllUsers)
router.patch('/users/:userId/global-role', validate(updateGlobalRoleSchema), updateUserGlobalRole)
router.get('/audit', getPlatformAuditLogs)

// Email queue (super admin only)
router.post('/email/flush', flushEmailQueue)
router.get('/email-jobs', getEmailJobs)
router.patch('/email-jobs/:id/retry', retryEmailJob)

export default router
