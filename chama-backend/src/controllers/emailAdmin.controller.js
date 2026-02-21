import prisma from '../prisma.js'
import { processEmailQueue } from '../services/email/emailQueue.js'

export async function flushEmailQueue(req, res, next) {
  try {
    const result = await processEmailQueue({ limit: 50 })
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export async function getEmailJobs(req, res, next) {
  try {
    const status = req.query.status || undefined
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const jobs = await prisma.emailJob.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    res.json({ success: true, data: jobs })
  } catch (error) {
    next(error)
  }
}

export async function retryEmailJob(req, res, next) {
  try {
    const { id } = req.params
    const job = await prisma.emailJob.findUnique({ where: { id } })
    if (!job) {
      return res.status(404).json({ success: false, message: 'Email job not found' })
    }
    if (job.status !== 'FAILED') {
      return res.status(400).json({
        success: false,
        message: 'Only FAILED jobs can be retried. Reset status to PENDING and set sendAfter to now.',
      })
    }
    await prisma.emailJob.update({
      where: { id },
      data: { status: 'PENDING', attempts: 0, lastError: null, sendAfter: new Date() },
    })
    res.json({ success: true, data: { id, status: 'PENDING' }, message: 'Job queued for retry' })
  } catch (error) {
    next(error)
  }
}
