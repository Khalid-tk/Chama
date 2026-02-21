import 'dotenv/config'
import app from './app.js'
import { config } from './config/env.js'
import prisma from './prisma.js'
import { processEmailQueue } from './services/email/emailQueue.js'
import { verifyMailer } from './utils/mailer.js'

const PORT = config.port

let queueWorkerRunning = false
async function runEmailQueueWorker() {
  if (queueWorkerRunning) return
  queueWorkerRunning = true
  try {
    const result = await processEmailQueue({ limit: 20 })
    if (result.processed > 0) {
      console.log(`📧 Email queue: processed ${result.processed}, sent ${result.sent}, failed ${result.failed}`)
    }
  } catch (e) {
    console.error('Email queue worker error:', e)
  } finally {
    queueWorkerRunning = false
  }
}

async function startServer() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected')

    await verifyMailer()

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
      setInterval(runEmailQueueWorker, 30 * 1000)
      console.log('📧 Email queue worker: every 30s (for production, run a separate worker process)')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

startServer()
