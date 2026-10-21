import { describe, expect, it, vi } from 'vitest'
import { evaluateDecisionReview } from '../decision-review.js'
const now = new Date('2026-10-21T05:00:00Z')
const base = {
  id: 'decision-a', workspace_id: 'workspace-a', title: 'Synthetic decision', decision: 'Synthetic terms',
  status: 'active', review_by: '2026-10-21', revisit_condition: 'Owner observes checkpoint',
  activated_at: '2026-10-01T12:00:00Z', activated_by: 'owner-a', updated_at: '2026-10-20T12:00:00Z',
  condition_observed_at: null, condition_observed_by: null,
}
const evaluate = (changes = {}, date = now) => evaluateDecisionReview({ decision: { ...base, ...changes }, workspaceId: 'workspace-a', now: date })
const fixtures = [
  ['active due today', {}, 'do', []],
  ['active overdue', { review_by: '2026-10-20' }, 'do', []],
  ['active future', { review_by: '2026-12-31' }, 'hold', []],
  ['observed condition before date', { review_by: '2026-12-31', condition_observed_at: '2026-10-20T12:00:00Z', condition_observed_by: 'owner-a' }, 'do', []],
  ['proposed complete', { status: 'proposed' }, 'hold', []],
  ['proposed missing review terms', { status: 'proposed', review_by: null, revisit_condition: null }, 'needs_data', ['review_by', 'revisit_condition']],
  ['superseded', { status: 'superseded', review_by: null, revisit_condition: null }, 'skip', []],
  ['rejected', { status: 'rejected' }, 'skip', []],
  ['unknown status', { status: 'approved' }, 'needs_data', ['status']],
  ['invalid calendar date', { review_by: '2026-02-30' }, 'needs_data', ['review_by']],
  ['empty condition', { revisit_condition: '  ' }, 'needs_data', ['revisit_condition']],
  ['missing activation evidence', { activated_at: null, activated_by: null }, 'needs_data', ['activated_by', 'activated_at']],
  ['missing observation actor', { condition_observed_at: '2026-10-20T12:00:00Z' }, 'needs_data', ['condition_observation']],
  ['future observation', { condition_observed_at: '2026-10-22T12:00:00Z', condition_observed_by: 'owner-a' }, 'needs_data', ['condition_observation']],
  ['unparseable observation', { condition_observed_at: 'yesterday', condition_observed_by: 'owner-a' }, 'needs_data', ['condition_observation']],
  ['blank decision', { decision: '' }, 'needs_data', ['decision']],
]
describe('decision_review verdict regression fixtures', () => {
  it.each(fixtures)('%s', (_name, changes, verdict, missing) => {
    const result = evaluate(changes)
    expect(result.verdict).toBe(verdict)
    expect(result.missing_data).toEqual(missing)
    expect(result).toMatchObject({ evaluator: 'decision_review', policy_version: 'decision-review-v1', subject: { type: 'business_decision', id: base.id, workspace_id: base.workspace_id }, money_at_stake: null, time_zone: 'America/Chicago', evaluated_at: now.toISOString(), business_date: '2026-10-21' })
    expect(result.next_action).toBeTruthy()
    expect(result.why.length).toBeGreaterThan(0)
    for (const item of result.why) {
      expect(item.claim).toBeTruthy()
      expect(item.source).toMatchObject({ table: 'business_decisions', id: base.id, workspace_id: base.workspace_id, updated_at: base.updated_at })
      for (const [field, value] of Object.entries(item.source.fields)) expect(value).toEqual(({ ...base, ...changes })[field] ?? null)
    }
  })
  it('uses Chicago midnight and handles the DST clock change', () => {
    expect(evaluate({}, new Date('2026-10-21T04:59:59Z')).verdict).toBe('hold')
    expect(evaluate({}, new Date('2026-10-21T05:00:00Z')).verdict).toBe('do')
    expect(evaluate({ review_by: '2026-11-02' }, new Date('2026-11-02T05:59:59Z')).verdict).toBe('hold')
    expect(evaluate({ review_by: '2026-11-02' }, new Date('2026-11-02T06:00:00Z')).verdict).toBe('do')
  })
  it('cites both triggers when both fire', () => {
    const result = evaluate({ condition_observed_at: '2026-10-20T12:00:00Z', condition_observed_by: 'owner-a' })
    expect(result.why).toHaveLength(3)
    expect(result.why[1].source.fields.review_by).toBe(base.review_by)
    expect(result.why[2].source.fields.condition_observed_by).toBe('owner-a')
  })
  it('rejects absent or cross-workspace sources', () => {
    expect(() => evaluateDecisionReview({ decision: base, workspaceId: 'other', now })).toThrow(/workspace-scoped/)
    expect(() => evaluateDecisionReview({ decision: null, workspaceId: 'workspace-a', now })).toThrow(/workspace-scoped/)
  })
  it('is repeatable and never writes, activates, or calls a provider', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    try {
      const decision = Object.freeze({ ...base, status: 'proposed' })
      const input = { decision, workspaceId: 'workspace-a', now }
      expect(evaluateDecisionReview(input)).toEqual(evaluateDecisionReview(input))
      expect(decision.status).toBe('proposed')
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally { fetchSpy.mockRestore() }
  })
})
