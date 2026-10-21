import { chicagoDate } from '../sales/queue.js'

export const DECISION_REVIEW_POLICY = 'decision-review-v1'
const statuses = new Set(['proposed', 'active', 'superseded', 'rejected'])
const hasText = value => typeof value === 'string' && value.trim().length > 0
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
const validTimestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value))

// AUTO only: no clients, network, persistence, or status transitions. Every
// claim carries the exact source fields used by the rule plus the source row.
export function evaluateDecisionReview({ decision, workspaceId, now = new Date() }) {
  if (!decision?.id || !workspaceId || decision.workspace_id !== workspaceId) {
    throw new Error('A workspace-scoped decision source is required.')
  }
  const today = chicagoDate(now)
  const why = []
  const missing = []
  const addClaim = (claim, fields) => why.push({ claim, source: {
    table: 'business_decisions', id: decision.id, workspace_id: workspaceId,
    updated_at: decision.updated_at ?? null,
    fields: Object.fromEntries(fields.map(field => [field, decision[field] ?? null])),
  } })
  const status = decision.status
  if (!statuses.has(status)) missing.push('status')
  else addClaim(`Decision status is ${status}.`, ['status'])

  const closed = status === 'superseded' || status === 'rejected'
  if (!closed) {
    if (!hasText(decision.title)) missing.push('title')
    if (!hasText(decision.decision)) missing.push('decision')
    if (!validDate(decision.review_by)) missing.push('review_by')
    if (!hasText(decision.revisit_condition)) missing.push('revisit_condition')
    if (status === 'active') {
      if (!hasText(decision.activated_by)) missing.push('activated_by')
      if (!validTimestamp(decision.activated_at) || Date.parse(decision.activated_at) > new Date(now).getTime()) missing.push('activated_at')
    }
    const hasObservation = decision.condition_observed_at != null || decision.condition_observed_by != null
    if (hasObservation && (!validTimestamp(decision.condition_observed_at)
      || Date.parse(decision.condition_observed_at) > new Date(now).getTime()
      || !hasText(decision.condition_observed_by) || status !== 'active')) missing.push('condition_observation')
  }

  let verdict = 'needs_data'
  let nextAction = 'Complete or correct the decision’s review details; only the owner may activate it.'
  if (missing.length) {
    const fields = [...new Set(missing.flatMap(field => field === 'condition_observation'
      ? ['condition_observed_at', 'condition_observed_by', 'status'] : [field]))]
    addClaim(`Required decision data is missing or invalid: ${missing.join(', ')}.`, fields)
  } else if (closed) {
    verdict = 'skip'
    nextAction = 'No binding review is needed for this closed decision.'
  } else if (status === 'proposed') {
    verdict = 'hold'
    nextAction = 'Owner review of this proposal is pending. It is not binding.'
  } else {
    if (decision.review_by <= today) addClaim(`Review date reached: ${decision.review_by}.`, ['status', 'review_by'])
    if (decision.condition_observed_at) addClaim('You recorded that the revisit condition occurred.', ['status', 'revisit_condition', 'condition_observed_at', 'condition_observed_by'])
    if (decision.review_by <= today || decision.condition_observed_at) {
      verdict = 'do'
      nextAction = 'Review this active decision and decide whether to keep its terms, reschedule its review, or supersede it.'
    } else {
      verdict = 'hold'
      nextAction = 'Keep the active decision in force; review it on its due date or when you observe its revisit condition.'
      addClaim(`Review date is still ahead: ${decision.review_by}; no condition observation is recorded.`, ['review_by', 'condition_observed_at', 'condition_observed_by'])
    }
  }
  return {
    evaluator: 'decision_review', policy_version: DECISION_REVIEW_POLICY,
    subject: { type: 'business_decision', id: decision.id, workspace_id: workspaceId },
    verdict, next_action: nextAction, why,
    assumptions: ['Free-text revisit conditions are assessed by the owner; no recorded observation does not prove the condition is false.'],
    missing_data: missing, money_at_stake: null,
    related_decisions: [{ table: 'business_decisions', id: decision.id, status, binding: status === 'active' }],
    evaluated_at: new Date(now).toISOString(), business_date: today, time_zone: 'America/Chicago',
  }
}
