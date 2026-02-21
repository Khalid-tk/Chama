import express from 'express'
import { previewInvite, acceptInvite } from '../controllers/invites.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = express.Router()

const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
})

// Preview invite (public, no auth required)
router.get('/preview', previewInvite)

// Accept invite (auth required)
router.post('/accept', authenticate, validate(acceptInviteSchema), acceptInvite)

export default router
