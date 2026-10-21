import { chicagoDate } from '../sales/queue.js'

// Dates are derived in the business timezone. Free-text conditions are assessed
// by the owner, never interpreted as code or guessed by an AI.
export function buildDecisionReviews({ decisions = [], workspaceId, now = new Date() }) {
  const today = chicagoDate(now)
  const items = decisions.filter(row => row.workspace_id === workspaceId).map(row => {
    const reasons = []
    if (row.status === 'active') {
      if (row.review_by && row.review_by <= today) reasons.push(`Review date reached: ${row.review_by}.`)
      if (row.condition_observed_at) reasons.push('You recorded that the revisit condition occurred.')
    }
    return { ...row, review_due: reasons.length > 0, review_reasons: reasons }
  }).sort((a, b) => Number(b.review_due) - Number(a.review_due)
    || (a.review_by || '9999').localeCompare(b.review_by || '9999') || a.id.localeCompare(b.id))
  return { available: true, today, items, due_count: items.filter(row => row.review_due).length }
}
