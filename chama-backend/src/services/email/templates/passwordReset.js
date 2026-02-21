import { baseTemplate } from './baseTemplate.js'

export function passwordReset({ resetLink }) {
  const content =
    '<h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">Password reset</h2>' +
    '<p style="margin: 0;">You requested to reset your password. Use the button below to set a new password. This link expires in 1 hour.</p>'
  return baseTemplate({
    title: 'Reset your password',
    content,
    ctaLabel: 'Reset password',
    ctaUrl: resetLink,
  })
}
