import { describe, expect, it } from 'vitest'
import { buildDecisionReviews } from '../reviews.js'
const base = { id: 'a', workspace_id: 'w', status: 'active', review_by: '2026-10-21', revisit_condition: 'Owner-observed change' }
const build = (decisions, now = '2026-10-21T05:00:00Z') => buildDecisionReviews({ decisions, workspaceId: 'w', now: new Date(now) })
describe('business decision reviews', () => {
  it('uses the Chicago date boundary inclusively without mutating state', () => {
    const row = Object.freeze({ ...base })
    expect(build([row], '2026-10-21T04:59:59Z').due_count).toBe(0)
    expect(build([row]).due_count).toBe(1)
    expect(row.status).toBe('active')
  })
  it('shows owner-observed conditions before the review date', () => {
    expect(build([{ ...base, review_by: '2026-12-31', condition_observed_at: '2026-10-20T12:00:00Z' }]).items[0].review_reasons).toEqual(['You recorded that the revisit condition occurred.'])
  })
  it('never treats proposals or closed decisions as binding and excludes other workspaces', () => {
    expect(build(['proposed', 'rejected', 'superseded'].map(status => ({ ...base, status }))).due_count).toBe(0)
    expect(build([{ ...base, workspace_id: 'other' }]).items).toEqual([])
  })
  it('does not guess whether free-text conditions occurred', () => {
    expect(build([{ ...base, review_by: '2027-01-01', revisit_condition: 'Revenue falls' }]).due_count).toBe(0)
  })
  it('puts due reviews first with stable date and identity ordering', () => {
    expect(build([{ ...base, id: 'b' }, { ...base, id: 'c', review_by: '2026-10-20' }, { ...base, status: 'proposed' }]).items.map(r => r.id)).toEqual(['c', 'b', 'a'])
  })
})
