import { evaluateDecisionReview } from '../laya/decision-review.js'
import { chicagoDate } from '../sales/queue.js'

// Dates are derived in the business timezone. Free-text conditions are assessed
// by the owner, never interpreted as code or guessed by an AI.
export function buildDecisionReviews({ decisions = [], workspaceId, now = new Date() }) {
  const today = chicagoDate(now)
  const items = decisions.filter(row => row.workspace_id === workspaceId).map(row => {
    const evaluation = evaluateDecisionReview({ decision: row, workspaceId, now })
    const reasons = evaluation.verdict === 'do'
      ? evaluation.why.slice(1).map(item => item.claim) : []
    return { ...row, evaluation, review_due: evaluation.verdict === 'do', review_reasons: reasons }
  }).sort((a, b) => Number(b.review_due) - Number(a.review_due)
    || (a.review_by || '9999').localeCompare(b.review_by || '9999') || a.id.localeCompare(b.id))
  return { available: true, today, items, due_count: items.filter(row => row.review_due).length }
}
