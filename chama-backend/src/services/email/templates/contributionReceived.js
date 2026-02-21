import { baseTemplate, FRONTEND_URL } from './baseTemplate.js'

export function contributionReceived({ chamaName, chamaId, amount, currency }) {
  const c = currency || 'KES'
  const content =
    '<h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">Contribution received</h2>' +
    '<p style="margin: 0;">Your contribution of <strong>' +
    c +
    ' ' +
    Number(amount).toLocaleString() +
    '</strong> to <strong>' +
    chamaName +
    '</strong> has been received.</p>' +
    '<p style="margin: 12px 0 0;">Thank you for contributing to the chama.</p>'
  const ctaUrl = chamaId ? FRONTEND_URL + '/chama/' + chamaId + '/contributions' : FRONTEND_URL
  return baseTemplate({
    title: 'Contribution received – ' + chamaName,
    content,
    ctaLabel: 'View contributions',
    ctaUrl,
  })
}
