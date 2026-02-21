import prisma from '../../prisma.js'
import { sendMail } from './emailTransport.js'

const MAX_ATTEMPTS = 5

/**
 * Enqueue an email. Does not send immediately.
 * @param {{ to: string, subject: string, html: string, sendAfter?: Date }} opts
 * @returns {Promise<{ id: string }>}
 */
export async function enqueueEmail({ to, subject, html, sendAfter }) {
  const job = await prisma.emailJob.create({
    data: {
      to,
      subject,
      html,
      status: 'PENDING',
      attempts: 0,
      sendAfter: sendAfter || new Date(),
    },
  })
  return { id: job.id }
}

/**
 * Process pending jobs: select PENDING where sendAfter <= now and attempts < 5,
 * send via transport, update status (SENT/FAILED) and apply exponential backoff on failure.
 * @param {{ limit?: number }} opts
 * @returns {Promise<{ processed: number, sent: number, failed: number }>}
 */
export async function processEmailQueue({ limit = 20 } = {}) {
  const now = new Date()
  const jobs = await prisma.emailJob.findMany({
    where: {
      status: 'PENDING',
      attempts: { lt: MAX_ATTEMPTS },
      sendAfter: { lte: now },
    },
    orderBy: { sendAfter: 'asc' },
    take: limit,
  })

  let sent = 0
  let failed = 0

  for (const job of jobs) {
    const result = await sendMail({
      to: job.to,
      subject: job.subject,
      html: job.html,
    })

    if (result.sent) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          attempts: job.attempts + 1,
          lastError: null,
          updatedAt: new Date(),
        },
      })
      sent++
    } else {
      const nextAttempt = job.attempts + 1
      const newStatus = nextAttempt >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING'
      const backoffMinutes = Math.pow(2, nextAttempt)
      const sendAfter = new Date(now.getTime() + backoffMinutes * 60 * 1000)

      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: newStatus,
          attempts: nextAttempt,
          lastError: result.error || 'Unknown error',
          sendAfter,
          updatedAt: new Date(),
        },
      })
      failed++
    }
  }

  return { processed: jobs.length, sent, failed }
}
