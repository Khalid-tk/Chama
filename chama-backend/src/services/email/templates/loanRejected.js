import { baseTemplate, FRONTEND_URL } from './baseTemplate.js'
export function loanRejected(opts) {
  const chamaName = opts.chamaName || ''
  const amount = opts.amount || 0
  const currency = opts.currency || 'KES'
  const content = '<h2>Loan update</h2><p>Your loan request in ' + chamaName + ' for ' + currency + ' ' + Number(amount).toLocaleString() + ' was not approved.</p>'
  return baseTemplate({ title: 'Loan update', content, ctaLabel: 'View loans', ctaUrl: (FRONTEND_URL || '') + '/chama/loans' })
}
