import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')
const uploadsDir = path.join(projectRoot, 'uploads', 'avatars')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, req.user.id + '-' + Date.now() + ext)
  },
})

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG and WebP allowed'), false)
    }
    cb(null, true)
  },
}).single('avatar')
