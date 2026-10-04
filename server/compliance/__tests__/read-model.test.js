import { describe, expect, it } from 'vitest'
import { buildComplianceReadModel, complianceState } from '../read-model.js'

const workspaceId = 'workspace-a'

function requirement(overrides = {}) {
  return {
    id: 'requirement-a', workspace_id: workspaceId, title: 'Illinois annual report', category: 'filing', authority_name: 'Illinois Secretary of State', source_url: 'https://www.ilsos.gov/', jurisdiction: 'Illinois', description: 'Annual business filing.', applicability_status: 'needs_verification', verified_by_owner_at: null, verified_by_owner_id: null, verified_source_at: null, recurrence_type: 'annual', recurrence_interval: null, last_completed_at: null, next_due_date: null, status: 'active', notes: null, created_at: '2026-09-01T10:00:00.000Z', updated_at: '2026-09-01T10:00:00.000Z', ...overrides,
  }
}

function completion(overrides = {}) {
  return {
    id: 'completion-a', workspace_id: workspaceId, compliance_requirement_id: 'requirement-a', completed_at: '2026-09-10', notes: 'Owner confirmed completion.', created_at: '2026-09-10T12:00:00.000Z', ...overrides,
  }
}

function model(values = {}) {
  return buildComplianceReadModel({ workspaceId, now: new Date('2026-09-13T12:00:00.000Z'), ...values })
}

describe('Compliance deterministic read model', () => {
  it('keeps a possible requirement unverified and never presents it as a filing obligation', () => {
    const result = model({ requirements: [requirement()] })
    expect(result.summary).toMatchObject({ verified_requirements: 0, needs_verification: 1, approaching: 0, due: 0, overdue: 0 })
    expect(result.summary.attention_message).toBe('1 requirement needs owner verification.')
    expect(result.requirements[0]).toMatchObject({ compliance_state: 'unverified' })
    expect(result.ceo_projection[0]).toMatchObject({ compliance_state: 'compliance_needs_verification', human_reason: expect.stringMatching(/^Verify whether /) })
    expect(result.ceo_projection[0].human_reason).not.toMatch(/file/i)
  })

  it('derives OK, approaching, due, and overdue only from an owner-verified applicable requirement', () => {
    const verified = { applicability_status: 'applies', verified_by_owner_at: '2026-09-01T10:00:00.000Z', verified_by_owner_id: 'owner-a', verified_source_at: '2026-09-01T10:00:00.000Z' }
    expect(complianceState({ requirement: requirement({ ...verified, next_due_date: '2026-11-01' }), today: '2026-09-13' })).toBe('ok')
    expect(complianceState({ requirement: requirement({ ...verified, next_due_date: '2026-10-13' }), today: '2026-09-13' })).toBe('approaching')
    expect(complianceState({ requirement: requirement({ ...verified, next_due_date: '2026-09-13' }), today: '2026-09-13' })).toBe('due')
    expect(complianceState({ requirement: requirement({ ...verified, next_due_date: '2026-09-12' }), today: '2026-09-13' })).toBe('overdue')
  })

  it('never derives a deadline state for a requirement that is not applicable', () => {
    const result = model({ requirements: [requirement({ applicability_status: 'not_applicable', verified_by_owner_at: '2026-09-01T10:00:00.000Z', verified_by_owner_id: 'owner-a', next_due_date: '2026-09-01' })] })
    expect(result.requirements[0].compliance_state).toBe('not_applicable')
    expect(result.summary).toMatchObject({ needs_verification: 0, overdue: 0 })
    expect(result.ceo_projection).toEqual([])
  })

  it('keeps a verified requirement with no known deadline distinct from a reassuring all-clear', () => {
    const result = model({ requirements: [requirement({ applicability_status: 'applies', verified_by_owner_at: '2026-09-01T10:00:00.000Z', verified_by_owner_id: 'owner-a' })] })
    expect(result.requirements[0]).toMatchObject({ compliance_state: 'ok', human_reason: expect.stringContaining('No next due date') })
    expect(result.summary.attention_message).toBe('No verified Compliance deadlines currently require attention.')
  })

  it('does not invent a next deadline for custom recurrence', () => {
    const result = model({ requirements: [requirement({ applicability_status: 'applies', verified_by_owner_at: '2026-09-01T10:00:00.000Z', verified_by_owner_id: 'owner-a', recurrence_type: 'custom', recurrence_interval: 7, last_completed_at: '2026-09-10', next_due_date: null })] })
    expect(result.requirements[0]).toMatchObject({ compliance_state: 'ok', next_due_date: null })
    expect(result.ceo_projection).toEqual([])
  })

  it('preserves append-only completion history while reading the current requirement deterministically', () => {
    const verified = { applicability_status: 'applies', verified_by_owner_at: '2026-09-01T10:00:00.000Z', verified_by_owner_id: 'owner-a', last_completed_at: '2026-09-10', next_due_date: '2027-09-10' }
    const result = model({ requirements: [requirement(verified)], completions: [completion(), completion({ id: 'completion-older', completed_at: '2025-09-10', created_at: '2025-09-10T12:00:00.000Z' })] })
    expect(result.requirements[0].completions).toHaveLength(2)
    expect(result.recent_completions.map((item) => item.id)).toEqual(['completion-a', 'completion-older'])
    expect(result.requirements[0].compliance_state).toBe('ok')
  })

  it('exposes only actionable verified deadlines and unresolved verification to the CEO projection', () => {
    const verified = { applicability_status: 'applies', verified_by_owner_at: '2026-09-01T10:00:00.000Z', verified_by_owner_id: 'owner-a' }
    const result = model({ requirements: [
      requirement({ id: 'overdue', ...verified, next_due_date: '2026-09-12' }),
      requirement({ id: 'due', ...verified, next_due_date: '2026-09-13' }),
      requirement({ id: 'approaching', ...verified, next_due_date: '2026-09-20' }),
      requirement({ id: 'ok', ...verified, next_due_date: '2026-11-01' }),
      requirement({ id: 'unverified' }),
    ] })
    expect(result.ceo_projection.map((item) => item.compliance_state)).toEqual(['compliance_overdue', 'compliance_due', 'compliance_approaching', 'compliance_needs_verification'])
  })

  it('filters cross-workspace requirements and completions and remains deterministic', () => {
    const values = { requirements: [requirement(), requirement({ id: 'foreign', workspace_id: 'workspace-b' })], completions: [completion(), completion({ id: 'foreign-completion', workspace_id: 'workspace-b' })] }
    expect(model(values)).toEqual(model(values))
    expect(model(values).requirements).toHaveLength(1)
    expect(model(values).recent_completions).toHaveLength(1)
  })
})
