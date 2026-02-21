import express from 'express'
import {
  getAdminAnalyticsData,
  getMemberAnalyticsData,
} from '../controllers/analytics.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireMembership, requireRole } from '../middleware/rbac.js'

const router = express.Router()

// Admin analytics
router.get(
  '/:chamaId/analytics/admin',
  authenticate,
  requireMembership(),
  requireRole(['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']),
  getAdminAnalyticsData
)

// Member analytics
router.get(
  '/:chamaId/analytics/member',
  authenticate,
  requireMembership(),
  getMemberAnalyticsData
)

export default router
