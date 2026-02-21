import { baseTemplate, FRONTEND_URL } from './baseTemplate.js'
export function loanDisbursed(opts) {
  const chamaName = opts.chamaName || ''
  const amount = opts.amount || 0
  const currency = opts.currency || 'KES'
  const ref = opts.receiptReference || ''
  let content = '<h2 style="margin: 0 0 16px;">Loan disbursed</h2><p>Your loan from ' + chamaName + ' has been disbursed. Amount: ' + currency + ' ' + Number(amount).toLocaleString() + '.</p>'
  if (ref) content += '<p>Receipt: ' + ref + '</p>'
  return baseTemplate({ title: 'Loan disbursed', content, ctaLabel: 'View loan', ctaUrl: (FRONTEND_URL || '') + '/chama/loans' })
}
