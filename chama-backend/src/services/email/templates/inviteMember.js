import { baseTemplate, FRONTEND_URL } from './baseTemplate.js'

export function inviteMember({ chamaName, inviteLink, role }) {
  const content =
    '<h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">You\'ve been invited</h2>' +
    '<p style="margin: 0;">You have been invited to join <strong>' +
    chamaName +
    '</strong> as <strong>' +
    role +
    '</strong>.</p>' +
    '<p style="margin: 12px 0 0;">Accept the invitation to get started. This link expires in 7 days.</p>'
  return baseTemplate({
    title: 'Invitation to join ' + chamaName,
    content,
    ctaLabel: 'Accept invitation',
    ctaUrl: inviteLink || FRONTEND_URL + '/invites',
  })
}
