import express from 'express'
import { uploadAvatar as uploadAvatarCtrl, deleteAvatar } from '../controllers/users.controller.js'
import { authenticate } from '../middleware/auth.js'
import { uploadAvatar as multerUpload } from '../middleware/upload.js'

const router = express.Router()

router.post('/me/avatar', authenticate, (req, res, next) => {
  multerUpload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Max 2MB.' })
      }
      return res.status(400).json({ success: false, message: err.message || 'Invalid file' })
    }
    next()
  })
}, uploadAvatarCtrl)

router.delete('/me/avatar', authenticate, deleteAvatar)

export default router
