import prisma from '../prisma.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')
const uploadsDir = path.join(projectRoot, 'uploads', 'avatars')

function getAvatarUrl(filename) {
  const base = config.publicBaseUrl.replace(/\/$/, '')
  return `${base}/uploads/avatars/${filename}`
}

export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Use multipart/form-data with field "avatar".',
      })
    }
    const userId = req.user.id
    const filename = req.file.filename
    const avatarUrl = getAvatarUrl(filename)
    const previous = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, avatarKey: true },
    })
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl, avatarKey: filename },
    })
    if (previous?.avatarKey) {
      const oldPath = path.join(uploadsDir, previous.avatarKey)
      try {
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      } catch (_) {}
    }
    res.json({ success: true, data: { avatarUrl } })
  } catch (error) {
    next(error)
  }
}

export async function deleteAvatar(req, res, next) {
  try {
    const userId = req.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    })
    if (user?.avatarKey) {
      const filePath = path.join(uploadsDir, user.avatarKey)
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      } catch (_) {}
    }
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null, avatarKey: null },
    })
    res.json({ success: true, data: { avatarUrl: null } })
  } catch (error) {
    next(error)
  }
}
