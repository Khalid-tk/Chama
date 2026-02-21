import { baseTemplate, FRONTEND_URL } from './baseTemplate.js'

export function joinRequestRejected({ chamaName }) {
  const content =
    '<h2 style="margin: 0 0 16px; color: #1e293b;">Join request update</h2>' +
    '<p>Your request to join <strong>' + chamaName + '</strong> was not approved at this time.</p>'
  return baseTemplate({ title: 'Update: ' + chamaName, content, ctaLabel: 'Back to Chama', ctaUrl: FRONTEND_URL })
}
