import { baseTemplate, FRONTEND_URL } from './baseTemplate.js'
export function joinRequestApproved(opts) {
  const chamaName = opts.chamaName || 'the chama'
  const base = (FRONTEND_URL || '').replace(/\/$/, '')
  const content = '<h2 style="margin: 0 0 16px;">Join request approved</h2><p>Your request to join <strong>' + chamaName + '</strong> has been approved.</p>'
  return baseTemplate({ title: 'Approved: ' + chamaName, content, ctaLabel: 'Open My Chamas', ctaUrl: base + '/select-chama' })
}
