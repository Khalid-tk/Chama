import { useState } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { formatKES } from '../../lib/format'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

export type AIEvaluation = {
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendation: string
  reasons: string[]
  metrics: {
    contributionConsistencyPct: number
    missedContributionsCount: number
    existingActiveLoanBalance: number
    overdueLoansFlag: boolean
    debtToContributionRatio: number
    averageMonthlyContribution: number
    mpesaFailureRatePct: number
    monthsContributed: number
    expectedMonths: number
  }
  aiExplanation: string | null
}

type AILoanAssessmentProps = {
  chamaId: string
  loanId: string
  onEvaluationLoaded?: (evaluation: AIEvaluation) => void
  compact?: boolean
}

export function AILoanAssessment({ chamaId, loanId, onEvaluationLoaded, compact = false }: AILoanAssessmentProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null)
  const [expanded, setExpanded] = useState(true)

  const runAssessment = async () => {
    setLoading(true)
    setError(null)
    try {
      const { default: api, chamaRoute } = await import('../../lib/api')
      const res = await api.get(chamaRoute(chamaId, `/loans/${loanId}/ai-evaluation`))
      const data = res.data?.data
      if (data) {
        setEvaluation(data)
        onEvaluationLoaded?.(data)
      } else {
        setError('Invalid response')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to run AI assessment')
    } finally {
      setLoading(false)
    }
  }

  const riskBadgeClass =
    evaluation?.riskLevel === 'LOW'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : evaluation?.riskLevel === 'MEDIUM'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : evaluation?.riskLevel === 'HIGH'
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-warm-deep text-ink-700'

  if (compact && !evaluation) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={runAssessment}
        disabled={loading}
        loading={loading}
        className="gap-1"
      >
        <Sparkles size={14} />
        Run AI Assessment
      </Button>
    )
  }

  return (
    <Card className="border-ink-300">
      <div
        className="flex cursor-pointer items-center justify-between border-b border-ink-200 px-4 py-3"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brown" />
          <span className="font-semibold text-ink-900">AI Loan Assessment</span>
          {evaluation && (
            <Badge className={riskBadgeClass}>
              {evaluation.riskLevel} risk
            </Badge>
          )}
        </div>
        {!evaluation ? (
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); runAssessment() }} disabled={loading} loading={loading}>
            Run AI Assessment
          </Button>
        ) : (
          <button type="button" className="p-1 text-ink-500">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>
      {expanded && (
        <CardContent className="space-y-4 p-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {evaluation && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-ink-500">Risk score</p>
                  <p className="text-2xl font-bold text-ink-900">{evaluation.riskScore}/100</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-ink-500">Recommendation</p>
                  <p className="font-semibold text-ink-900">{evaluation.recommendation}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-ink-500">Key metrics</p>
                <ul className="space-y-1 text-sm text-ink-700">
                  <li>Contribution consistency: <strong>{evaluation.metrics.contributionConsistencyPct}%</strong> ({evaluation.metrics.monthsContributed}/{evaluation.metrics.expectedMonths} months)</li>
                  <li>Missed contributions (6m): <strong>{evaluation.metrics.missedContributionsCount}</strong></li>
                  <li>Existing active loan balance: <strong>{formatKES(evaluation.metrics.existingActiveLoanBalance)}</strong></li>
                  <li>Overdue loans: <strong>{evaluation.metrics.overdueLoansFlag ? 'Yes' : 'No'}</strong></li>
                  <li>Debt-to-contribution ratio: <strong>{evaluation.metrics.debtToContributionRatio.toFixed(1)}x</strong></li>
                  <li>M-Pesa failure rate (30d): <strong>{evaluation.metrics.mpesaFailureRatePct}%</strong></li>
                </ul>
              </div>
              {evaluation.reasons.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-ink-500">Risk factors</p>
                  <ul className="list-inside list-disc space-y-0.5 text-sm text-ink-700">
                    {evaluation.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {evaluation.aiExplanation && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-ink-500">AI explanation</p>
                  <p className="text-sm text-ink-700">{evaluation.aiExplanation}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
