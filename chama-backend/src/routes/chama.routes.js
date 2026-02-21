import express from 'express'
import {
  createChama,
  getMyChamas,
  searchChamas,
  getChama,
  joinChama,
  getMembers,
  updateMemberRole,
  updateChamaSettings,
  getChamaAuditLogs,
} from '../controllers/chama.controller.js'
import {
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  createJoinRequest,
  getMyJoinRequest,
  getMyJoinRequests,
} from '../controllers/joinRequests.controller.js'
import { createInvite, getInvites } from '../controllers/invites.controller.js'
import { broadcastChamaNotification } from '../controllers/notifications.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireMembership, requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = express.Router()

const createChamaSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    joinMode: z.enum(['OPEN', 'APPROVAL']).optional(),
    isPublic: z.boolean().optional(),
    contributionAmount: z.number().int().positive().optional(),
    cycleDay: z.number().int().min(1).max(31).optional(),
    loanInterestRate: z.number().min(0).max(100).optional(),
    penaltyRate: z.number().min(0).max(100).optional(),
  }),
})

const joinChamaSchema = z.object({
  body: z.object({
    chamaCode: z.string().min(1),
    joinCode: z.string().optional(),
  }),
})

const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['MEMBER', 'ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']),
  }),
})

const updateSettingsSchema = z.object({
  body: z.object({
    contributionAmount: z.number().int().positive().optional(),
    cycleDay: z.number().int().min(1).max(31).optional(),
    loanInterestRate: z.number().min(0).max(100).optional(),
    penaltyRate: z.number().min(0).max(100).optional(),
  }),
})

const createInviteSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(['MEMBER', 'ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']).optional(),
  }),
})

// Public routes (auth required)
router.post('/', authenticate, validate(createChamaSchema), createChama)
router.get('/my', authenticate, getMyChamas)
router.get('/my/join-requests', authenticate, getMyJoinRequests)
router.get('/search', authenticate, searchChamas)
router.post('/join', authenticate, validate(joinChamaSchema), joinChama)

// Join requests (auth only; no membership required)
router.post('/:chamaId/join-requests', authenticate, createJoinRequest)
router.get('/:chamaId/my/join-request', authenticate, getMyJoinRequest)

// Membership required routes
router.get('/:chamaId/context', authenticate, requireMembership(), getChama)

// Admin routes
router.get(
  '/:chamaId/members',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR']),
  getMembers
)
router.patch(
  '/:chamaId/members/:userId/role',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'CHAIR']),
  validate(updateRoleSchema),
  updateMemberRole
)
router.patch(
  '/:chamaId/settings',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'CHAIR']),
  validate(updateSettingsSchema),
  updateChamaSettings
)

// Invite routes (admin)
router.post(
  '/:chamaId/invites',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'CHAIR']),
  validate(createInviteSchema),
  createInvite
)
router.get(
  '/:chamaId/invites',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'CHAIR', 'TREASURER']),
  getInvites
)

// Join request routes (admin: ADMIN, CHAIR only)
router.get(
  '/:chamaId/join-requests',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'CHAIR']),
  getJoinRequests
)
router.patch(
  '/:chamaId/join-requests/:requestId/approve',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'CHAIR']),
  approveJoinRequest
)
router.patch(
  '/:chamaId/join-requests/:requestId/reject',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'CHAIR']),
  rejectJoinRequest
)

// Audit log (admin/treasurer/chair/auditor)
router.get(
  '/:chamaId/audit-log',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']),
  getChamaAuditLogs
)

// Broadcast notification to all chama members (admin/chair)
router.post(
  '/:chamaId/notifications/broadcast',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'CHAIR']),
  broadcastChamaNotification
)

export default router
