/**
 * Generate member insights from personal data
 */

import { formatKES, formatDateShort } from '../lib/format'

export type Insight = {
  type: 'positive' | 'negative' | 'neutral'
  message: string
}

export function generateMemberInsights(data: {
  contributions: Array<{ date: string; amount: number }>
  loans: Array<{ status: string; date: string; amount: number }>
  transactions: Array<{ date: string; amount: number; type: string }>
  mpesaPayments?: Array<{ status: string; date: string; amount: number }>
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
    const change = previous.amount > 0 ? ((recent.amount - previous.amount) / previous.amount) * 100 : 0
    
    if (change > 0) {
      insights.push({
        type: 'positive',
        message: `You contributed ${formatKES(recent.amount)} this month (up ${Math.abs(change).toFixed(1)}% vs last month)`,
      })
    } else if (change < 0) {
      insights.push({
        type: 'negative',
        message: `You contributed ${formatKES(recent.amount)} this month (down ${Math.abs(change).toFixed(1)}% vs last month)`,
      })
    } else if (recent.amount > 0) {
      insights.push({
        type: 'neutral',
        message: `You contributed ${formatKES(recent.amount)} this month`,
      })
    }
  }

  // 2. Contribution streak
  if (months.length > 0) {
    // Count consecutive months with contributions
    let streak = 0
    const sortedMonths = months.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    for (const month of sortedMonths) {
      if (contributionsByMonth[month].count > 0) {
        streak++
      } else {
        break
      }
    }
    if (streak >= 3) {
      insights.push({
        type: 'positive',
        message: `Your contribution streak is ${streak} month${streak > 1 ? 's' : ''}`,
      })
    }
  }

  // 3. Next repayment due
  const activeLoan = data.loans.find(l => l.status === 'Active')
  if (activeLoan) {
    const loanDate = new Date(activeLoan.date)
    const nextDue = new Date(loanDate)
    nextDue.setMonth(nextDue.getMonth() + 1) // Simplified: next month
    const daysUntilDue = Math.ceil((nextDue.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue > 0 && daysUntilDue <= 7) {
      insights.push({
        type: 'negative',
        message: `Next repayment due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''} (${formatDateShort(nextDue.toISOString().split('T')[0])})`,
      })
    } else if (daysUntilDue > 7) {
      insights.push({
        type: 'neutral',
        message: `Next repayment due on ${formatDateShort(nextDue.toISOString().split('T')[0])}`,
      })
    }
  }

  // 4. Mpesa success rate
  if (data.mpesaPayments && data.mpesaPayments.length > 0) {
    const successful = data.mpesaPayments.filter(p => p.status === 'success').length
    const successRate = (successful / data.mpesaPayments.length) * 100
    
    if (successRate >= 90) {
      insights.push({
        type: 'positive',
        message: `Mpesa success rate is ${successRate.toFixed(0)}% (${successful}/${data.mpesaPayments.length} successful)`,
      })
    } else if (successRate < 70) {
      insights.push({
        type: 'negative',
        message: `Mpesa success rate is ${successRate.toFixed(0)}%. Consider checking payment method.`,
      })
    }
  }

  // 5. Loan repayment progress
  if (activeLoan) {
    // Simplified: assume 50% paid if active
    const progress = 50 // This would come from actual repayment data
    if (progress >= 75) {
      insights.push({
        type: 'positive',
        message: `Loan repayment progress: ${progress}% complete`,
      })
    } else if (progress < 25) {
      insights.push({
        type: 'negative',
        message: `Loan repayment progress: ${progress}% complete. Keep up with payments.`,
      })
    }
  }

  return insights.slice(0, 5) // Return top 5 insights
}
