import nodemailer from 'nodemailer'

const host = (process.env.SMTP_HOST || '').trim()
const port = parseInt(process.env.SMTP_PORT || '587', 10)
const user = (process.env.SMTP_USER || '').trim()
const pass = (process.env.SMTP_PASS || '').trim()
const from = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim()
const secure = process.env.SMTP_SECURE === 'true'

let transporter = null

function getTransport() {
  if (transporter !== null) return transporter
  if (!host || !user || !pass) return null
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: port === 587,
    auth: { user, pass },
  })
  return transporter
}

/**
 * Verify SMTP connection (e.g. on startup).
 * @returns {Promise<boolean>} true if verified, false if not configured or verification failed.
 */
export async function verifyMailer() {
  const transport = getTransport()
  if (!transport) {
    console.log('📧 Mailer: not configured (SMTP_HOST/USER/PASS missing); emails will be logged to console.')
    return false
  }
  try {
    await transport.verify()
    console.log('📧 Mailer: SMTP connection verified.')
    return true
  } catch (err) {
    const msg = err.message || 'Unknown error'
    if (msg.includes('password') || msg.includes('auth') || msg.includes('credentials')) {
      console.error('📧 Mailer: SMTP verification failed (auth/credentials). Check SMTP_USER and SMTP_PASS.')
    } else {
      console.error('📧 Mailer: SMTP verification failed:', msg)
    }
    return false
  }
}

/**
 * Send an email. Uses SMTP when configured; otherwise logs to console (no throw).
 * @param {{ to: string, subject: string, text?: string, html?: string }} options
 * @returns {{ sent: boolean, messageId?: string, error?: string }}
 */
export async function sendMail({ to, subject, text, html }) {
  const transport = getTransport()
  const fromAddress = from || user || 'noreply@localhost'

  if (!transport) {
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL (SMTP not configured – logging to console)')
    console.log('='.repeat(60))
    console.log('To:', to)
    console.log('Subject:', subject)
    const body = (text || html || '').substring(0, 500)
    if (body) console.log('Body:', body)
    console.log('='.repeat(60) + '\n')
    return { sent: true, messageId: 'console' }
  }

  try {
    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''),
      html: html || undefined,
    })
    return { sent: true, messageId: info.messageId }
  } catch (err) {
    const msg = err.message || 'Unknown error'
    if (msg.includes('password') || msg.includes('auth') || msg.includes('credentials')) {
      console.error('📧 Mailer: send failed (auth/credentials). Check SMTP settings.')
    } else {
      console.error('📧 Mailer: send failed:', msg)
    }
    return { sent: false, error: msg }
  }
}

export { getTransport }
