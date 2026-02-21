import express from 'express'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notifications.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticate)

router.get('/', getNotifications)
router.patch('/read-all', markAllNotificationsRead)
router.patch('/:id/read', markNotificationRead)

export default router
