import express from 'express'
import {
  register,
  login,
  googleLogin,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = express.Router()

const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
  }),
})

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
})

const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1),
  }),
})

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
})

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6),
  }),
})

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
  }),
})

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/google', validate(googleLoginSchema), googleLogin)
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), resetPassword)
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword)
router.get('/me', authenticate, getMe)

export default router
