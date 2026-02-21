import prisma from '../prisma.js'
import { config } from '../config/env.js'

/**
 * Evaluate loan risk for a member in a chama (rule-based, optional OpenAI explanation).
 * Uses OPENAI_API_KEY + AI_MODE=openai only for generating aiExplanation; scoring is always rule-based.
 *
 * @param {{ chamaId: string, userId: string, requestedAmount: number }}
 * @returns {Promise<{ riskScore: number, riskLevel: string, recommendation: string, reasons: string[], metrics: object, aiExplanation: string | null }>}
 */
export async function evaluateLoanRisk({ chamaId, userId, requestedAmount }) {
  const now = new Date()
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    contributions,
    loans,
    repayments,
    mpesaPayments,
  ] = await Promise.all([
    prisma.contribution.findMany({
      where: { chamaId, userId, paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    }),
    prisma.loan.findMany({
      where: { chamaId, userId },
      include: { repayments: { select: { amount: true } } },
    }),
    prisma.repayment.findMany({
      where: { chamaId, userId },
      select: { amount: true, loanId: true, paidAt: true },
    }),
    prisma.mpesaPayment.findMany({
      where: { chamaId, userId, createdAt: { gte: thirtyDaysAgo } },
      select: { status: true },
    }),
  ])

  const n = (v) => (v == null || v === '' ? 0 : Number(v))

  // 1) Contribution consistency: % of last 6 months with at least one contribution
  const monthKeys = new Set()
  contributions.forEach((c) => {
    const d = new Date(c.paidAt)
    monthKeys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  })
  const expectedMonths = 6
  const monthsContributed = monthKeys.size
  const contributionConsistencyPct = expectedMonths > 0 ? Math.min(100, Math.round((monthsContributed / expectedMonths) * 100)) : 0

  // 2) Missed contributions count (months in last 6 with no contribution)
  const missedContributionsCount = Math.max(0, expectedMonths - monthsContributed)

  // 3) Existing active loan balance (ACTIVE + LATE, remaining = totalDue - repaid)
  let existingActiveLoanBalance = 0
  let overdueLoansFlag = false
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'LATE')
  for (const loan of activeLoans) {
    const repaid = loan.repayments.reduce((s, r) => s + n(r.amount), 0)
    const remaining = Math.max(0, n(loan.totalDue) - repaid)
    existingActiveLoanBalance += remaining
    if (loan.dueDate && new Date(loan.dueDate) < now) overdueLoansFlag = true
  }

  // 4) Overdue loans flag (set above)

  // 5) Debt to contribution ratio: remainingLoan / averageMonthlyContribution
  const totalContributedLast6 = contributions.reduce((s, c) => s + n(c.amount), 0)
  const averageMonthlyContribution = monthsContributed > 0 ? totalContributedLast6 / monthsContributed : 0
  const remainingLoan = existingActiveLoanBalance + requestedAmount
  const debtToContributionRatio = averageMonthlyContribution > 0 ? remainingLoan / averageMonthlyContribution : 0

  // 6) Mpesa failure rate (last 30 days)
  const mpesaTotal = mpesaPayments.length
  const mpesaFailed = mpesaPayments.filter((p) => p.status === 'FAILED' || p.status === 'TIMEOUT').length
  const mpesaSuccess = mpesaPayments.filter((p) => p.status === 'SUCCESS').length
  const mpesaFailureRatePct = mpesaTotal > 0 ? Math.round((mpesaFailed / mpesaTotal) * 100) : 0

  const metrics = {
    contributionConsistencyPct,
    missedContributionsCount,
    existingActiveLoanBalance,
    overdueLoansFlag,
    debtToContributionRatio: Math.round(debtToContributionRatio * 100) / 100,
    averageMonthlyContribution: Math.round(averageMonthlyContribution),
    mpesaFailureRatePct,
    monthsContributed,
    expectedMonths,
  }

  // —— Rule-based risk score (0–100, higher = riskier) ——
  let riskScore = 0
  const reasons = []

  if (overdueLoansFlag) {
    riskScore += 40
    reasons.push('Member has overdue loan(s)')
  }
  if (missedContributionsCount > 2) {
    riskScore += 25
    reasons.push(`More than 2 missed contributions in last 6 months (${missedContributionsCount} missed)`)
  }
  if (debtToContributionRatio > 3) {
    riskScore += 20
    reasons.push(`Debt-to-contribution ratio is high (${metrics.debtToContributionRatio.toFixed(1)}x)`)
  }
  if (mpesaFailureRatePct > 20) {
    riskScore += 10
    reasons.push(`M-Pesa failure rate in last 30 days is high (${mpesaFailureRatePct}%)`)
  }
  if (contributionConsistencyPct < 70) {
    riskScore += 5
    reasons.push(`Contribution consistency below 70% (${contributionConsistencyPct}%)`)
  }

  riskScore = Math.min(100, riskScore)

  let riskLevel
  let recommendation
  if (riskScore <= 29) {
    riskLevel = 'LOW'
    recommendation = 'APPROVE'
    if (reasons.length === 0) reasons.push('No significant risk factors identified')
  } else if (riskScore <= 59) {
    riskLevel = 'MEDIUM'
    recommendation = 'REVIEW'
  } else {
    riskLevel = 'HIGH'
    recommendation = 'REJECT'
  }

  let aiExplanation = null
  const useOpenai = config.ai.openaiApiKey && config.ai.mode === 'openai'
  if (useOpenai) {
    try {
      const openaiModule = await import('openai').catch(() => null)
      if (openaiModule?.default) {
        aiExplanation = await generateOpenAIExplanation({
          riskLevel,
          recommendation,
          reasons,
          metrics,
        })
      }
    } catch (err) {
      console.warn('AI Loan Advisor: OpenAI explanation failed', err?.message || err)
    }
  }

  return {
    riskScore,
    riskLevel,
    recommendation,
    reasons,
    metrics,
    aiExplanation,
  }
}

/**
 * Call OpenAI to generate a short explanation for the admin (max ~80 words).
 * Only sends numeric/categorical metrics, no PII.
 */
async function generateOpenAIExplanation({ riskLevel, recommendation, reasons, metrics }) {
  const openai = (await import('openai')).default
  const client = new openai.OpenAI({ apiKey: config.ai.openaiApiKey })
  const model = config.ai.model || 'gpt-4o-mini'

  const summary = [
    `Risk level: ${riskLevel}. Recommendation: ${recommendation}.`,
    `Contribution consistency: ${metrics.contributionConsistencyPct}%. Missed contributions (last 6 months): ${metrics.missedContributionsCount}.`,
    `Existing active loan balance: ${metrics.existingActiveLoanBalance}. Overdue loans: ${metrics.overdueLoansFlag ? 'Yes' : 'No'}.`,
    `Debt-to-contribution ratio: ${metrics.debtToContributionRatio.toFixed(1)}. M-Pesa failure rate (30d): ${metrics.mpesaFailureRatePct}%.`,
    reasons.length ? `Risk factors: ${reasons.join('; ')}.` : '',
  ].join(' ')

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a loan assessment assistant. In 1-2 short sentences (max 80 words), explain to an admin why this loan should or should not be approved. Use only the metrics provided. Be neutral and factual.',
      },
      {
        role: 'user',
        content: summary,
      },
    ],
    max_tokens: 120,
  })

  const text = completion.choices?.[0]?.message?.content?.trim()
  return text || null
}
