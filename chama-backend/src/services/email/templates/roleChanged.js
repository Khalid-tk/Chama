import { baseTemplate, FRONTEND_URL } from './baseTemplate.js'

export function roleChanged({ chamaName, newRole }) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">Role updated</h2>
    <p style="margin: 0;">Your role in <strong>${chamaName}</strong> has been changed to <strong>${newRole}</strong>.</p>
    <p style="margin: 12px 0 0;">You can now access features available to your new role.</p>
  `
  return baseTemplate({
    title: `Role updated – ${chamaName}`,
    content,
    ctaLabel: 'Open chama',
    ctaUrl: FRONTEND_URL,
  })
}
