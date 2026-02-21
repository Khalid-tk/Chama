import { baseTemplate, FRONTEND_URL } from './baseTemplate.js'
export function loanApproved(opts) {
  const chamaName = opts.chamaName || ''
  const amount = opts.amount || 0
  const currency = opts.currency || 'KES'
  const content = '<h2 style="margin: 0 0 16px;">Loan approved</h2><p>Your loan in ' + chamaName + ' has been approved. Amount: ' + currency + ' ' + Number(amount).toLocaleString() + '.</p>'
  return baseTemplate({ title: 'Loan approved', content, ctaLabel: 'View loan', ctaUrl: (FRONTEND_URL || '') + '/chama/loans' })
}
