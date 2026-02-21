/**
 * Generate admin insights from data
 */

import { formatKES } from '../lib/format'

export type Insight = {
  type: 'positive' | 'negative' | 'neutral'
  message: string
}

export function generateAdminInsights(data: {
  contributions: Array<{ date: string; amount: number }>
  loans: Array<{ status: string; date: string; amount: number }>
  mpesaPayments: Array<{ status: string; date: string }>
  members: Array<{ joined: string }>
}): Insight[] {
  const insights: Insight[] = []

  // 1. Contribution trend analysis
  const contributionsByMonth = data.contributions.reduce((acc, c) => {
    const month = new Date(c.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (!acc[month]) acc[month] = { count: 0, amount: 0 }
    acc[month].count++
    acc[month].amount += c.amount
    return acc
  }, {} as Record<string, { count: number; amount: number }>)

  const months = Object.keys(contributionsByMonth).sort()
  if (months.length >= 2) {
    const recent = contributionsByMonth[months[months.length - 1]]
    const previous = contributionsByMonth[months[months.length - 2]]
    const change = ((recent.amount - previous.amount) / previous.amount) * 100
    if (change > 0) {
      insights.push({
        type: 'positive',
        message: `Contributions increased by ${Math.abs(change).toFixed(1)}% compared to last month (${formatKES(recent.amount)} vs ${formatKES(previous.amount)})`,
      })
    } else if (change < 0) {
      insights.push({
        type: 'negative',
        message: `Contributions decreased by ${Math.abs(change).toFixed(1)}% compared to last month (${formatKES(recent.amount)} vs ${formatKES(previous.amount)})`,
      })
    }
  }

  // 2. Late repayments analysis
  const activeLoans = data.loans.filter(l => l.status === 'Active')
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  const lateLoans = activeLoans.filter(l => {
    const loanDate = new Date(l.date)
    return loanDate < threeMonthsAgo
  })

  if (lateLoans.length > 0) {
    insights.push({
      type: 'negative',
      message: `${lateLoans.length} loan${lateLoans.length > 1 ? 's are' : ' is'} overdue (older than 3 months). Total outstanding: ${formatKES(lateLoans.reduce((sum, l) => sum + l.amount, 0))}`,
    })
  }

  // 3. Mpesa success rate
  const totalPayments = data.mpesaPayments.length
  if (totalPayments > 0) {
    const successful = data.mpesaPayments.filter(p => p.status === 'success').length
    const successRate = (successful / totalPayments) * 100

    // Check recent trend (last 5 payments)
    const recentPayments = data.mpesaPayments.slice(-5)
    const recentSuccess = recentPayments.filter(p => p.status === 'success').length
    const recentRate = (recentSuccess / recentPayments.length) * 100

    if (recentRate < 80 && recentRate < successRate) {
      insights.push({
        type: 'negative',
        message: `Mpesa success rate dropped to ${recentRate.toFixed(0)}% in recent payments (overall: ${successRate.toFixed(0)}%). Investigate payment failures.`,
      })
    } else if (successRate >= 95) {
      insights.push({
        type: 'positive',
        message: `Excellent Mpesa success rate: ${successRate.toFixed(0)}% (${successful}/${totalPayments} successful)`,
      })
    }
  }

  // 4. Member growth
  const membersByMonth = data.members.reduce((acc, m) => {
    const month = new Date(m.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const memberMonths = Object.keys(membersByMonth).sort()
  if (memberMonths.length >= 2) {
    const recent = memberMonths.slice(-3)
    const earlier = memberMonths.slice(0, Math.max(1, memberMonths.length - 3))
    const recentAvg = recent.reduce((sum, m) => sum + (membersByMonth[m] || 0), 0) / recent.length
    const earlierAvg = earlier.reduce((sum, m) => sum + (membersByMonth[m] || 0), 0) / earlier.length

    if (recentAvg > earlierAvg * 1.1) {
      insights.push({
        type: 'positive',
        message: `Membership is growing: ${recentAvg.toFixed(1)} new members/month recently vs ${earlierAvg.toFixed(1)} earlier`,
      })
    } else if (recentAvg < earlierAvg * 0.9) {
      insights.push({
        type: 'negative',
        message: `Membership growth slowing: ${recentAvg.toFixed(1)} new members/month recently vs ${earlierAvg.toFixed(1)} earlier`,
      })
    }
  }

  // 5. Loan portfolio health
  const totalLoans = data.loans.length
  if (totalLoans > 0) {
    const repaid = data.loans.filter(l => l.status === 'Repaid').length
    const repaymentRate = (repaid / totalLoans) * 100

    if (repaymentRate < 60) {
      insights.push({
        type: 'negative',
        message: `Low loan repayment rate: ${repaymentRate.toFixed(0)}% (${repaid}/${totalLoans} repaid). Review loan policies.`,
      })
    } else if (repaymentRate >= 80) {
      insights.push({
        type: 'positive',
        message: `Strong loan repayment rate: ${repaymentRate.toFixed(0)}% (${repaid}/${totalLoans} repaid)`,
      })
    }
  }

  return insights.slice(0, 5) // Return top 5 insights
}
