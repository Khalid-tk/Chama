import nodemailer from 'nodemailer'
import { config } from '../config/env.js'

/**
 * Email service using nodemailer
 * In development without SMTP, logs to console
 */
let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const smtpConfig = config.email

  if (smtpConfig.host && smtpConfig.port && smtpConfig.user && smtpConfig.pass) {
    // Use real SMTP
    transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    })
  } else {
    // Development mode: use Ethereal or console
    transporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    })
  }

  return transporter
}

/**
 * Send email (or log in dev mode)
 */
export async function sendEmail({ to, subject, html, text }) {
  if (process.env.EMAIL_ENABLED === 'false') {
    console.log('📧 Email skipped (DEMO MODE)', { to, subject })
    return { skipped: true }
  }

  const smtpConfig = config.email

  // If SMTP not configured, log to console
  if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.pass) {
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL (SMTP not configured - logging to console)')
    console.log('='.repeat(60))
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`\n${text || html}`)
    console.log('='.repeat(60) + '\n')
    return { messageId: 'console-log', preview: text || html }
  }

  try {
    const transporter = getTransporter()
    const info = await transporter.sendMail({
      from: smtpConfig.from || smtpConfig.user,
      to,
      subject,
      html,
      text,
    })
    return info
  } catch (error) {
    console.error('Email send error:', error)
    // In dev, still log even if send fails
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 EMAIL (send failed, logging):')
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`\n${text || html}\n`)
    }
    throw error
  }
}

/**
 * Send invite email
 */
export async function sendInviteEmail({ to, chamaName, inviteLink, role }) {
  const subject = `Invitation to join ${chamaName}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">You've been invited!</h2>
      <p>You have been invited to join <strong>${chamaName}</strong> as a <strong>${role}</strong>.</p>
      <p>Click the link below to accept the invitation:</p>
      <p style="margin: 20px 0;">
        <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Accept Invitation
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This invitation will expire in 7 days. If you didn't request this invitation, you can safely ignore this email.
      </p>
    </div>
  `
  const text = `You've been invited to join ${chamaName} as a ${role}.\n\nAccept here: ${inviteLink}\n\nThis invitation expires in 7 days.`

  return sendEmail({ to, subject, html, text })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ to, resetLink }) {
  const subject = 'Reset your password'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <p style="margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `
  const text = `You requested to reset your password.\n\nReset here: ${resetLink}\n\nThis link expires in 1 hour.`

  return sendEmail({ to, subject, html, text })
}

/**
 * Notify user their join request was approved
 */
export async function sendJoinRequestApproved({ to, chamaName, frontendUrl }) {
  const subject = `You've been approved to join ${chamaName}`
  const link = frontendUrl ? `${frontendUrl.replace(/\/$/, '')}/select-chama` : ''
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Join request approved</h2>
      <p>Your request to join <strong>${chamaName}</strong> has been approved. You can now access the chama.</p>
      ${link ? `<p><a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Open My Chamas</a></p>` : ''}
    </div>
  `
  const text = `Your request to join ${chamaName} has been approved. You can now access the chama.${link ? ` Open: ${link}` : ''}`
  return sendEmail({ to, subject, html, text })
}

/**
 * Notify user their join request was rejected
 */
export async function sendJoinRequestRejected({ to, chamaName, frontendUrl }) {
  const subject = `Update on your request to join ${chamaName}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Join request update</h2>
      <p>Your request to join <strong>${chamaName}</strong> was not approved at this time.</p>
    </div>
  `
  const text = `Your request to join ${chamaName} was not approved at this time.`
  return sendEmail({ to, subject, html, text })
}
