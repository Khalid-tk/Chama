/**
 * Analytics utilities for computing health scores, risk indicators, and chart data
 */

export type HealthScore = {
  score: number
  label: 'Healthy' | 'Watch' | 'Risk'
  contributors: string[]
}

export type LoanRisk = {
  level: 'Low' | 'Medium' | 'High'
  recommendation: 'Approve' | 'Review' | 'Reject'
  reasons: string[]
}

/**
 * Build monthly series from a list of items with dates
 */
export function buildMonthlySeries<T>(
  items: T[],
  dateField: keyof T,
  valueField: keyof T,
  groupFn?: (item: T) => number
): Array<{ month: string; value: number }> {
  const grouped: Record<string, number> = {}
  
  items.forEach((item) => {
    const dateValue = item[dateField]
    if (!dateValue) return
    
    const date = typeof dateValue === 'string' ? new Date(dateValue) : (dateValue as Date)
    const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    const value = groupFn 
      ? groupFn(item)
      : (typeof item[valueField] === 'number' ? item[valueField] as number : 0)
    
    grouped[month] = (grouped[month] || 0) + value
  })
  
  return Object.entries(grouped)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([month, value]) => ({ month, value }))
}

/**
 * Compute Chama Health Score (0-100)
 */
export function computeHealthScore(data: {
  contributions: Array<{ date: string; amount: number; member: string }>
  loans: Array<{ status: string; amount: number; date: string }>
  members: Array<{ joined: string }>
  transactions?: Array<{ type: string; amount: number }>
}): HealthScore {
  const contributors: string[] = []
  let score = 100

  // 1. Contribution Consistency Score (0-30 points)
  const contributionConsistency = computeContributionConsistency(data.contributions)
  const consistencyScore = Math.round(contributionConsistency * 30)
  score -= (30 - consistencyScore)
  if (consistencyScore < 20) {
    contributors.push(`Low contribution consistency (${Math.round(contributionConsistency * 100)}%)`)
  } else {
    contributors.push(`Good contribution consistency (${Math.round(contributionConsistency * 100)}%)`)
  }

  // 2. Repayment Rate Score (0-25 points)
  const repaymentRate = computeRepaymentRate(data.loans)
  const repaymentScore = Math.round(repaymentRate * 25)
  score -= (25 - repaymentScore)
  if (repaymentRate < 0.7) {
    contributors.push(`Low repayment rate (${Math.round(repaymentRate * 100)}%)`)
  } else {
    contributors.push(`Good repayment rate (${Math.round(repaymentRate * 100)}%)`)
  }

  // 3. Member Growth Score (0-20 points)
  const growthScore = computeMemberGrowthScore(data.members)
  score -= (20 - growthScore)
  if (growthScore < 12) {
    contributors.push('Declining or stagnant membership')
  } else {
    contributors.push('Growing membership')
  }

  // 4. Default Penalty (0-15 points)
  const defaultPenalty = computeDefaultPenalty(data.loans)
  score -= defaultPenalty
  if (defaultPenalty > 5) {
    contributors.push(`High number of overdue loans (${defaultPenalty} points deducted)`)
  }

  // 5. Savings Growth Score (0-10 points)
  const savingsGrowth = computeSavingsGrowth(data.contributions, data.transactions || [])
  const savingsScore = Math.round(savingsGrowth * 10)
  score -= (10 - savingsScore)
  if (savingsGrowth < 0.5) {
    contributors.push('Low savings growth rate')
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score))

  let label: 'Healthy' | 'Watch' | 'Risk'
  if (score >= 75) {
    label = 'Healthy'
  } else if (score >= 50) {
    label = 'Watch'
  } else {
    label = 'Risk'
  }

  return { score, label, contributors }
}

function computeContributionConsistency(contributions: Array<{ date: string }>): number {
  if (contributions.length === 0) return 0
  
  // Group by month
  const monthlyCounts: Record<string, number> = {}
  contributions.forEach((c) => {
    const month = new Date(c.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1
  })
  
  const months = Object.keys(monthlyCounts).length
  if (months === 0) return 0
  
  // Calculate consistency (variance from average)
  const avg = contributions.length / months
  const variance = Object.values(monthlyCounts).reduce((sum, count) => {
    return sum + Math.pow(count - avg, 2)
  }, 0) / months
  
  // Normalize to 0-1 (lower variance = higher consistency)
  const consistency = Math.max(0, 1 - (variance / (avg * avg)))
  return consistency
}

function computeRepaymentRate(loans: Array<{ status: string }>): number {
  if (loans.length === 0) return 1
  
  const repaid = loans.filter(l => l.status === 'Repaid').length
  const total = loans.length
  
  return repaid / total
}

function computeMemberGrowthScore(members: Array<{ joined: string }>): number {
  if (members.length < 2) return 10 // Neutral score for small groups
  
  // Group by month
  const monthlyJoins: Record<string, number> = {}
  members.forEach((m) => {
    const month = new Date(m.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthlyJoins[month] = (monthlyJoins[month] || 0) + 1
  })
  
  const months = Object.keys(monthlyJoins).sort()
  if (months.length < 2) return 10
  
  // Calculate trend (recent months vs earlier months)
  const recentMonths = months.slice(-3)
  const earlierMonths = months.slice(0, Math.max(1, months.length - 3))
  
  const recentAvg = recentMonths.reduce((sum, m) => sum + (monthlyJoins[m] || 0), 0) / recentMonths.length
  const earlierAvg = earlierMonths.reduce((sum, m) => sum + (monthlyJoins[m] || 0), 0) / earlierMonths.length
  
  if (earlierAvg === 0) return recentAvg > 0 ? 20 : 0
  
  const growthRatio = recentAvg / earlierAvg
  
  // Score: 0-20 based on growth ratio
  if (growthRatio >= 1.1) return 20 // Growing
  if (growthRatio >= 0.9) return 10 // Stable
  return 5 // Declining
}

function computeDefaultPenalty(loans: Array<{ status: string; date: string }>): number {
  // Count overdue loans (simplified: Active loans older than 3 months)
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  
  const overdue = loans.filter(l => {
    if (l.status !== 'Active') return false
    const loanDate = new Date(l.date)
    return loanDate < threeMonthsAgo
  }).length
  
  // Penalty: 1 point per overdue loan, max 15
  return Math.min(15, overdue)
}

function computeSavingsGrowth(
  contributions: Array<{ amount: number; date: string }>,
  transactions: Array<{ type: string; amount: number }>
): number {
  if (contributions.length === 0) return 0
  
  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0)
  const totalDebits = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)
  
  if (totalContributions === 0) return 0
  
  // Growth rate: (contributions - debits) / contributions
  const netSavings = totalContributions - totalDebits
  return Math.max(0, Math.min(1, netSavings / totalContributions))
}

/**
 * Compute loan risk indicator
 */
export function computeLoanRisk(
  memberHistory: {
    contributions: Array<{ date: string; amount: number }>
    loans: Array<{ status: string; amount: number; date: string }>
    transactions?: Array<{ type: string; amount: number; date: string }>
  },
  requestedAmount: number
): LoanRisk {
  const reasons: string[] = []
  let riskScore = 0

  // 1. Missed payments count
  const missedPayments = memberHistory.contributions.length === 0 ? 1 : 0
  if (missedPayments > 0) {
    riskScore += 30
    reasons.push('No contribution history')
  }

  // 2. Contribution consistency
  const consistency = computeContributionConsistency(memberHistory.contributions)
  if (consistency < 0.7) {
    riskScore += 20
    reasons.push('Irregular contribution pattern')
  }

  // 3. Outstanding debt ratio
  const activeLoans = memberHistory.loans.filter(l => l.status === 'Active')
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.amount, 0)
  const totalContributions = memberHistory.contributions.reduce((sum, c) => sum + c.amount, 0)
  
  if (totalContributions > 0) {
    const debtRatio = (totalDebt + requestedAmount) / totalContributions
    if (debtRatio > 0.5) {
      riskScore += 25
      reasons.push(`High debt-to-contribution ratio (${Math.round(debtRatio * 100)}%)`)
    }
  }

  // 4. Repayment history
  const repaymentRate = computeRepaymentRate(memberHistory.loans)
  if (repaymentRate < 0.8 && memberHistory.loans.length > 0) {
    riskScore += 25
    reasons.push(`Poor repayment history (${Math.round(repaymentRate * 100)}% repayment rate)`)
  }

  // Determine risk level
  let level: 'Low' | 'Medium' | 'High'
  let recommendation: 'Approve' | 'Review' | 'Reject'

  if (riskScore < 30) {
    level = 'Low'
    recommendation = 'Approve'
    if (reasons.length === 0) {
      reasons.push('Good member history')
    }
  } else if (riskScore < 60) {
    level = 'Medium'
    recommendation = 'Review'
  } else {
    level = 'High'
    recommendation = 'Reject'
  }

  return { level, recommendation, reasons }
}

/**
 * Compute growth label from trend data
 */
export function computeGrowthLabel(trendData: Array<{ month: string; value: number }>): 'Growing' | 'Stable' | 'Declining' {
  if (trendData.length < 2) return 'Stable'
  
  const recent = trendData.slice(-3)
  const earlier = trendData.slice(0, Math.max(1, trendData.length - 3))
  
  const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length
  const earlierAvg = earlier.reduce((sum, d) => sum + d.value, 0) / earlier.length
  
  if (earlierAvg === 0) return recentAvg > 0 ? 'Growing' : 'Stable'
  
  const ratio = recentAvg / earlierAvg
  
  if (ratio >= 1.1) return 'Growing'
  if (ratio <= 0.9) return 'Declining'
  return 'Stable'
}
