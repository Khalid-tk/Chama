import express from 'express'
import authRoutes from './auth.routes.js'
import chamaRoutes from './chama.routes.js'
import contributionsRoutes from './contributions.routes.js'
import loansRoutes from './loans.routes.js'
import repaymentsRoutes from './repayments.routes.js'
import mpesaRoutes from './mpesa.routes.js'
import analyticsRoutes from './analytics.routes.js'
import invitesRoutes from './invites.routes.js'
import notificationsRoutes from './notifications.routes.js'
import superAdminRoutes from './superAdmin.routes.js'
import adminUsersRoutes from './adminUsers.routes.js'
import usersRoutes from './users.routes.js'
import { getTransport, sendMail } from '../utils/mailer.js'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ ok: true, message: 'Chama API' })
})

router.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

router.get('/health/email', (req, res) => {
  const transport = getTransport()
  res.json({
    ok: true,
    emailConfigured: !!transport,
    timestamp: new Date().toISOString(),
  })
})

router.post('/test-email', async (req, res) => {
  const to = req.body?.to
  if (!to || typeof to !== 'string') {
    return res.status(400).json({ success: false, message: 'Body must include { "to": "someone@example.com" }' })
  }
  const result = await sendMail({
    to: to.trim(),
    subject: 'Chama test email',
    text: 'This is a test email from the Chama API.',
    html: '<p>This is a test email from the Chama API.</p>',
  })
  if (result.sent) {
    return res.json({ success: true, message: 'Test email sent (or logged to console if SMTP not configured)' })
  }
  return res.status(500).json({ success: false, message: 'Failed to send test email', error: result.error })
})

router.use('/auth', authRoutes)
router.use('/chamas', chamaRoutes)
router.use('/chamas', contributionsRoutes)
router.use('/chamas', loansRoutes)
router.use('/chamas', repaymentsRoutes)
router.use('/mpesa', mpesaRoutes)
router.use('/chamas', analyticsRoutes)
router.use('/invites', invitesRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/super', superAdminRoutes)
router.use('/users', usersRoutes)
router.use('/', adminUsersRoutes)

export default router
