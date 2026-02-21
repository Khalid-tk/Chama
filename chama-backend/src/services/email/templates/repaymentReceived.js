import { baseTemplate, FRONTEND_URL } from './baseTemplate.js'

export function repaymentReceived(opts) {
  const chamaName = opts.chamaName || ''
  const chamaId = opts.chamaId || ''
  const amount = opts.amount || 0
  const currency = opts.currency || 'KES'
  const content =
    '<h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">Repayment received</h2>' +
    '<p style="margin: 0;">We received your repayment of <strong>' + currency + ' ' + Number(amount).toLocaleString() + '</strong> for <strong>' + chamaName + '</strong>.</p>'
  const ctaUrl = chamaId ? (FRONTEND_URL || '') + '/chama/' + chamaId + '/repayments' : (FRONTEND_URL || '')
  return baseTemplate({
    title: 'Repayment received',
    content,
    ctaLabel: 'View repayments',
    ctaUrl,
  })
}
