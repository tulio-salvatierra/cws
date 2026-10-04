import { describe, expect, it } from 'vitest'
import { buildCeoToday, CEO_ACTION_LIMIT } from '../today.js'
import { buildAccountingReadModel } from '../../accounting/read-model.js'
import { buildComplianceReadModel } from '../../compliance/read-model.js'

const wednesday = new Date('2026-09-09T18:00:00.000Z')
const friday = new Date('2026-09-11T18:00:00.000Z')

function lead(overrides = {}) {
  return {
    id: 'lead-a',
    name: 'A Business',
    company: 'A Co',
    email: 'a@example.com',
    phone: null,
    status: 'contacted',
    sales_classification: 'prospect',
    response_state: 'no_response',
    created_at: '2026-09-01T15:00:00.000Z',
    ...overrides,
  }
}

function fullyPostedAttempt(slotKey, id = slotKey) {
  return {
    id,
    marketing_slot_key: slotKey,
    asset_id: 'website-launch',
    asset_path: '/images/en-launch.png',
    destination: 'multi:cicero-web-studio',
    provider_status: 'posted',
    created_at: '2026-09-08T15:00:00.000Z',
    updated_at: '2026-09-08T15:00:00.000Z',
    destination_results: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'].map((platform) => ({ platform, provider_status: 'posted' })),
  }
}

function operationsProject(overrides = {}) {
  return {
    project_id: 'operations-a',
    project_name: 'Northside Website',
    status: 'setup',
    delivery_state: 'waiting_on_cws',
    blocker_count: 1,
    oldest_blocker_since: '2026-09-01T15:00:00.000Z',
    human_reason: 'Waiting on CWS: Brand assets.',
    ...overrides,
  }
}

function operationsActions(result) {
  return result.all_actions.filter((item) => item.source_type === 'operations_delivery')
}

function accountingProjection(overrides = {}) {
  return {
    id: 'financial_obligation:obligation-a',
    financial_obligation_id: 'obligation-a',
    client_name: 'Carolina Skin Centre',
    project_name: null,
    amount_outstanding_cents: 7000,
    currency: 'USD',
    due_date: '2026-09-10',
    source_timestamp: '2026-09-01T15:00:00.000Z',
    financial_state: 'payment_overdue',
    human_reason: 'Carolina Skin Centre has an overdue payment for Monthly subscription due 2026-09-10.',
    ...overrides,
  }
}

function accountingActions(result) {
  return result.all_actions.filter((item) => item.source_type === 'accounting_financial')
}

function complianceProjection(overrides = {}) {
  return {
    requirement_id: 'compliance-a',
    title: 'Illinois annual report',
    compliance_state: 'compliance_overdue',
    next_due_date: '2026-09-10',
    authority_name: 'Illinois Secretary of State',
    human_reason: 'Owner-verified requirement was due 2026-09-10.',
    source_timestamp: '2026-09-01T15:00:00.000Z',
    ...overrides,
  }
}

function complianceActions(result) {
  return result.all_actions.filter((item) => item.source_type === 'compliance_requirement')
}

describe('CEO Today prioritizer', () => {
  it('reuses the existing Sales command queue meaning and order', () => {
    const result = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      leads: [
        lead({ id: 'new', created_at: '2026-09-05T15:00:00.000Z' }),
        lead({ id: 'warm', response_state: 'warm' }),
        lead({ id: 'inbound', sales_classification: 'inbound' }),
      ],
    })

    expect(result.actions.map((item) => item.source_type)).toEqual(['sales_command', 'sales_command', 'sales_command'])
    expect(result.actions.map((item) => item.human_action)).toEqual([
      'Prepare email A Co',
      'Prepare email A Co',
      'Prepare initial email A Co',
    ])
  })

  it('gives an overdue promised action urgent treatment ahead of ordinary Sales work', () => {
    const result = buildCeoToday({
      now: wednesday,
      leads: [lead({ id: 'ordinary', company: 'Ordinary Co' }), lead({ id: 'promised', company: 'Promise Co', status: 'won' })],
      promisedActions: [{ id: 'promise-a', lead_id: 'promised', action_text: 'Send recommendations', due_on: '2026-09-08', created_at: '2026-09-01T15:00:00.000Z' }],
      marketingAttempts: [fullyPostedAttempt('2026-09-07:post-a')],
    })

    expect(result.actions[0]).toMatchObject({ priority_tier: 1, human_action: 'Complete Send recommendations for Promise Co' })
    expect(result.actions[1]).toMatchObject({ priority_tier: 2, human_action: 'Prepare initial email Ordinary Co' })
  })

  it('treats the oldest missed Marketing occurrence as urgent without touching provider state', () => {
    const result = buildCeoToday({ now: wednesday })

    expect(result.actions[0]).toMatchObject({
      department: 'MARKETING',
      source_type: 'marketing_missed',
      human_action: 'Resolve missed Marketing post',
      priority_tier: 1,
    })
  })

  it('treats a current Marketing delivery failure as urgent', () => {
    const failed = {
      ...fullyPostedAttempt('2026-09-07:post-a', 'failed-a'),
      provider_status: 'error',
      provider_error: 'Provider delivery failed.',
      destination_results: [{ platform: 'LINKEDIN', provider_status: 'error' }],
    }
    const result = buildCeoToday({ now: wednesday, marketingAttempts: [failed] })

    expect(result.actions[0]).toMatchObject({
      department: 'MARKETING',
      source_type: 'marketing_delivery_failure',
      human_action: 'Review Marketing delivery',
      priority_tier: 1,
    })
  })

  it('keeps a closed all-error Marketing occurrence in history without CEO work', () => {
    const failed = {
      ...fullyPostedAttempt('2026-09-07:post-a', 'failed-a'),
      provider_status: 'error',
      destination_results: [{ platform: 'LINKEDIN', provider_status: 'error' }],
    }
    const result = buildCeoToday({
      now: wednesday,
      marketingAttempts: [failed],
      marketingResolutions: [{ occurrence_slot_key: '2026-09-07:post-a', action: 'skip', target_slot_key: null }],
    })

    expect(result.all_actions).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ source_type: 'marketing_delivery_failure' }),
    ]))
  })

  it('keeps current-day ready Marketing review after GET MONEY Sales actions', () => {
    const result = buildCeoToday({
      now: friday,
      leads: [lead({ company: 'Northside Repair' })],
      marketingAttempts: [fullyPostedAttempt('2026-09-07:post-a')],
    })

    expect(result.actions.map((item) => item.human_action)).toEqual([
      'Prepare initial email Northside Repair',
      'Review Marketing post',
    ])
  })

  it('collapses duplicate Sales entries to the highest CEO-priority action for that lead', () => {
    const result = buildCeoToday({
      now: wednesday,
      leads: [lead({ id: 'duplicate', sales_classification: 'inbound', company: 'Duplicate Co' })],
      promisedActions: [{ id: 'promise-a', lead_id: 'duplicate', action_text: 'Send recommendations', due_on: '2026-09-08', created_at: '2026-09-01T15:00:00.000Z' }],
      marketingAttempts: [fullyPostedAttempt('2026-09-07:post-a')],
    })

    const duplicates = result.actions.filter((item) => item.human_action.includes('Duplicate Co'))
    expect(duplicates).toEqual([expect.objectContaining({ human_action: 'Complete Send recommendations for Duplicate Co', priority_tier: 1 })])
  })

  it('uses source timestamps and stable IDs for deterministic non-Sales ties', () => {
    const first = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      leads: [
        lead({ id: 'lead-b', company: 'B Co', created_at: '2026-09-01T15:00:00.000Z' }),
        lead({ id: 'lead-a', company: 'A Co', created_at: '2026-09-01T15:00:00.000Z' }),
      ],
    })
    const second = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      leads: [
        lead({ id: 'lead-a', company: 'A Co', created_at: '2026-09-01T15:00:00.000Z' }),
        lead({ id: 'lead-b', company: 'B Co', created_at: '2026-09-01T15:00:00.000Z' }),
      ],
    })

    expect(first.actions.map((item) => item.id)).toEqual(second.actions.map((item) => item.id))
  })

  it('caps CEO Today at five actions and ignores unrelated generic task input', () => {
    const leads = Array.from({ length: 6 }, (_, index) => lead({ id: `lead-${index}`, company: `Company ${index}` }))
    const result = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      leads,
      tasks: [{ id: 'generic-task', title: 'Do not surface me' }],
    })

    expect(result.actions).toHaveLength(CEO_ACTION_LIMIT)
    expect(result.actions.some((item) => item.id.includes('generic-task'))).toBe(false)
  })

  it('omits posted Marketing work and supplies the deterministic customer fallback when nothing is actionable', () => {
    const result = buildCeoToday({
      now: friday,
      marketingAttempts: [
        fullyPostedAttempt('2026-09-07:post-a'),
        fullyPostedAttempt('2026-09-07:post-b', 'posted-b'),
      ],
    })

    expect(result.actions).toEqual([expect.objectContaining({
      source_type: 'fallback',
      human_action: 'Find the next customer',
      href: '/admin/sales',
    })])
  })

  it('creates a DELIVER action for CWS-blocked work using its durable Operations reason', () => {
    const result = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      operationsProjects: [operationsProject()],
    })

    expect(operationsActions(result)).toEqual([expect.objectContaining({
      department: 'OPERATIONS',
      business_priority: 'DELIVER',
      human_action: 'Open Northside Website',
      why_now: 'Waiting on CWS: Brand assets.',
      href: '/admin/operations/operations-a',
      cta_label: 'Open project',
    })])
  })

  it('creates a DELIVER action for work that is ready to continue', () => {
    const result = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      operationsProjects: [operationsProject({ delivery_state: 'ready_to_work', blocker_count: 0, oldest_blocker_since: null, human_reason: 'No needed-now readiness blocker remains.' })],
    })

    expect(operationsActions(result)).toEqual([expect.objectContaining({
      human_action: 'Open Northside Website',
      why_now: 'All needed-now inputs are available; work can continue.',
      cta_label: 'Open project',
    })])
  })

  it('creates a DELIVER review only for a client wait with a real blocker', () => {
    const withBlocker = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      operationsProjects: [operationsProject({ delivery_state: 'waiting_on_client', human_reason: 'Waiting on client: Project-specific requirements.' })],
    })
    const withoutBlocker = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      operationsProjects: [operationsProject({ delivery_state: 'waiting_on_client', blocker_count: 0, human_reason: 'Project is manually marked waiting on client.' })],
    })

    expect(operationsActions(withBlocker)).toEqual([expect.objectContaining({
      human_action: 'Review Northside Website',
      why_now: 'Waiting on client: Project-specific requirements.',
      cta_label: 'Review project',
    })])
    expect(operationsActions(withoutBlocker)).toEqual([])
  })

  it('omits completed and paused Operations projects and deduplicates each project', () => {
    const result = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      operationsProjects: [
        operationsProject({ project_id: 'completed', status: 'completed' }),
        operationsProject({ project_id: 'paused', status: 'paused' }),
        operationsProject({ project_id: 'same-project' }),
        operationsProject({ project_id: 'same-project', delivery_state: 'ready_to_work', blocker_count: 0, oldest_blocker_since: null }),
      ],
    })

    expect(operationsActions(result)).toEqual([expect.objectContaining({ id: 'operations:same-project' })])
  })

  it('keeps non-urgent GET MONEY and Marketing work ahead of DELIVER work', () => {
    const result = buildCeoToday({
      now: friday,
      leads: [lead({ company: 'Northside Repair' })],
      marketingAttempts: [fullyPostedAttempt('2026-09-07:post-a')],
      operationsProjects: [operationsProject()],
    })

    expect(result.actions.map((item) => item.department)).toEqual(['SALES', 'MARKETING', 'OPERATIONS'])
  })

  it('keeps urgent work ahead of DELIVER work', () => {
    const result = buildCeoToday({
      now: wednesday,
      operationsProjects: [operationsProject()],
    })

    expect(result.actions[0]).toMatchObject({ priority_tier: 1, department: 'MARKETING' })
    expect(operationsActions(result)[0]).toMatchObject({ priority_tier: 4 })
  })

  it('orders Operations work by state, then oldest blocker timestamp, then stable project id', () => {
    const result = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      operationsProjects: [
        operationsProject({ project_id: 'client', delivery_state: 'waiting_on_client', human_reason: 'Waiting on client: Copy.', oldest_blocker_since: '2026-09-01T15:00:00.000Z' }),
        operationsProject({ project_id: 'ready', delivery_state: 'ready_to_work', blocker_count: 0, oldest_blocker_since: null, human_reason: 'No needed-now readiness blocker remains.' }),
        operationsProject({ project_id: 'cws-late', oldest_blocker_since: '2026-09-03T15:00:00.000Z' }),
        operationsProject({ project_id: 'cws-b', oldest_blocker_since: '2026-09-01T15:00:00.000Z' }),
        operationsProject({ project_id: 'cws-a', oldest_blocker_since: '2026-09-01T15:00:00.000Z' }),
      ],
    })

    expect(operationsActions(result).map((item) => item.id)).toEqual([
      'operations:cws-a',
      'operations:cws-b',
      'operations:cws-late',
      'operations:ready',
      'operations:client',
    ])
  })

  it('keeps the top-five cap deterministic while retaining lower-ranked Operations candidates for inspection', () => {
    const leads = Array.from({ length: 5 }, (_, index) => lead({ id: `lead-${index}`, company: `Company ${index}` }))
    const result = buildCeoToday({
      now: new Date('2026-09-06T18:00:00.000Z'),
      leads,
      operationsProjects: [operationsProject()],
    })

    expect(result.actions).toHaveLength(CEO_ACTION_LIMIT)
    expect(result.actions.every((item) => item.department === 'SALES')).toBe(true)
    expect(operationsActions(result)).toHaveLength(1)
  })

  it('translates an overdue Accounting projection into one urgent CONTROL MONEY card', () => {
    const result = buildCeoToday({
      now: friday,
      accountingProjection: [accountingProjection()],
    })

    expect(accountingActions(result)).toEqual([expect.objectContaining({
      id: 'accounting:financial_obligation:obligation-a',
      department: 'ACCOUNTING',
      business_priority: 'CONTROL MONEY',
      human_action: 'Review overdue payment for Carolina Skin Centre',
      why_now: '$70.00 is overdue since 2026-09-10.',
      href: '/admin/accounting',
      cta_label: 'Review Accounting',
      priority_tier: 1,
    })])
  })

  it('keeps normal CONTROL MONEY after GET MONEY and DELIVER work', () => {
    const result = buildCeoToday({
      now: friday,
      leads: [lead({ company: 'Northside Repair' })],
      operationsProjects: [operationsProject()],
      accountingProjection: [accountingProjection({ financial_state: 'payment_due', due_date: '2026-09-11' })],
    })

    const salesIndex = result.all_actions.findIndex((item) => item.department === 'SALES')
    const operationsIndex = result.all_actions.findIndex((item) => item.department === 'OPERATIONS')
    const accountingIndex = result.all_actions.findIndex((item) => item.department === 'ACCOUNTING')
    expect(salesIndex).toBeLessThan(accountingIndex)
    expect(operationsIndex).toBeLessThan(accountingIndex)
    expect(accountingActions(result)[0]).toMatchObject({ priority_tier: 5, human_action: 'Review Accounting for Carolina Skin Centre' })
  })

  it('orders Accounting projection rows overdue, due, then recurring attention with durable ties', () => {
    const result = buildCeoToday({
      now: friday,
      accountingProjection: [
        accountingProjection({ id: 'recurring_revenue:recurring-a', financial_state: 'recurring_attention', due_date: '2026-09-01', source_timestamp: '2026-09-01T00:00:00.000Z' }),
        accountingProjection({ id: 'financial_obligation:due-equal-late', financial_state: 'payment_due', due_date: '2026-09-12', source_timestamp: '2026-09-04T00:00:00.000Z' }),
        accountingProjection({ id: 'financial_obligation:due-equal-early', financial_state: 'payment_due', due_date: '2026-09-12', source_timestamp: '2026-09-03T00:00:00.000Z' }),
        accountingProjection({ id: 'financial_obligation:due-earlier', financial_state: 'payment_due', due_date: '2026-09-11', source_timestamp: '2026-09-04T00:00:00.000Z' }),
        accountingProjection({ id: 'financial_obligation:overdue', financial_state: 'payment_overdue', due_date: '2026-09-10' }),
      ],
    })

    expect(accountingActions(result).map((item) => item.id)).toEqual([
      'accounting:financial_obligation:overdue',
      'accounting:financial_obligation:due-earlier',
      'accounting:financial_obligation:due-equal-early',
      'accounting:financial_obligation:due-equal-late',
      'accounting:recurring_revenue:recurring-a',
    ])
  })

  it('does not create CONTROL MONEY for healthy, settled, waived, or cancelled financial state', () => {
    const workspaceId = 'workspace-a'
    const accounting = buildAccountingReadModel({
      workspaceId,
      now: friday,
      clients: [{ id: 'client-a', workspace_id: workspaceId, name: 'Carolina Skin Centre' }],
      obligations: [
        { id: 'settled', workspace_id: workspaceId, client_id: 'client-a', description: 'Settled', amount_cents: 7000, status: 'expected', due_date: '2026-09-11', created_at: '2026-09-01T00:00:00.000Z' },
        { id: 'waived', workspace_id: workspaceId, client_id: 'client-a', description: 'Waived', amount_cents: 7000, status: 'waived', due_date: '2026-09-11', created_at: '2026-09-01T00:00:00.000Z' },
        { id: 'cancelled', workspace_id: workspaceId, client_id: 'client-a', description: 'Cancelled', amount_cents: 7000, status: 'cancelled', due_date: '2026-09-11', created_at: '2026-09-01T00:00:00.000Z' },
      ],
      receipts: [{ id: 'receipt-a', workspace_id: workspaceId, financial_obligation_id: 'settled', amount_cents: 7000, received_at: '2026-09-10T00:00:00.000Z' }],
      recurringRevenue: [{ id: 'healthy-recurring', workspace_id: workspaceId, client_id: 'client-a', description: 'Monthly subscription', amount_cents: 7000, cadence: 'monthly', status: 'active', provider: 'square', next_expected_at: '2026-10-04', created_at: '2026-03-13T00:00:00.000Z' }],
    })

    const result = buildCeoToday({ now: friday, accountingProjection: accounting.ceo_projection })
    expect(accounting.ceo_projection).toEqual([])
    expect(accountingActions(result)).toEqual([])
  })

  it('deduplicates repeated projection records and preserves the deterministic top-five cap', () => {
    const result = buildCeoToday({
      now: friday,
      leads: Array.from({ length: 5 }, (_, index) => lead({ id: `lead-${index}`, company: `Company ${index}` })),
      accountingProjection: [
        accountingProjection({ financial_state: 'payment_due', due_date: '2026-09-11' }),
        accountingProjection({ financial_state: 'payment_due', due_date: '2026-09-11' }),
      ],
    })

    expect(accountingActions(result)).toHaveLength(1)
    expect(result.actions).toHaveLength(CEO_ACTION_LIMIT)
    expect(result.actions.some((item) => item.department === 'ACCOUNTING')).toBe(false)
  })

  it('translates each actionable Compliance projection condition once without duplicating C1 deadline logic', () => {
    const result = buildCeoToday({
      now: friday,
      complianceProjection: [
        complianceProjection({ requirement_id: 'overdue', compliance_state: 'compliance_overdue', next_due_date: '2026-09-10' }),
        complianceProjection({ requirement_id: 'due', compliance_state: 'compliance_due', next_due_date: '2026-09-11', human_reason: 'Owner-verified requirement is due today (2026-09-11).' }),
        complianceProjection({ requirement_id: 'approaching', compliance_state: 'compliance_approaching', next_due_date: '2026-09-20', human_reason: 'Owner-verified requirement is due 2026-09-20.' }),
        complianceProjection({ requirement_id: 'unverified', compliance_state: 'compliance_needs_verification', next_due_date: null, human_reason: 'Verify whether Illinois annual report applies. Authority to review: Illinois Secretary of State.' }),
      ],
    })

    expect(complianceActions(result)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'compliance:overdue', department: 'COMPLIANCE', business_priority: 'PROTECT',
        human_action: 'Review Compliance: Illinois annual report', href: '/admin/compliance', cta_label: 'Review Compliance', priority_tier: 1,
      }),
      expect.objectContaining({ id: 'compliance:due', priority_tier: 6 }),
      expect.objectContaining({ id: 'compliance:approaching', priority_tier: 6 }),
      expect.objectContaining({ id: 'compliance:unverified', human_action: 'Verify Illinois annual report', priority_tier: 6 }),
    ]))
  })

  it('keeps Compliance verification wording explicitly uncertain', () => {
    const result = buildCeoToday({
      now: friday,
      complianceProjection: [complianceProjection({
        compliance_state: 'compliance_needs_verification',
        next_due_date: null,
        human_reason: 'Verify whether Illinois annual report applies. Authority to review: Illinois Secretary of State.',
      })],
    })
    const [candidate] = complianceActions(result)

    expect(candidate).toMatchObject({ human_action: 'Verify Illinois annual report' })
    expect(candidate.why_now).toMatch(/^Verify whether /)
    expect(`${candidate.human_action} ${candidate.why_now}`).not.toMatch(/\b(file|must)\b/i)
  })

  it('omits verified OK and owner-reviewed not-applicable Compliance records', () => {
    const workspaceId = 'workspace-a'
    const verified = {
      workspace_id: workspaceId,
      applicability_status: 'applies',
      verified_by_owner_at: '2026-09-01T10:00:00.000Z',
      verified_by_owner_id: 'owner-a',
      status: 'active',
      created_at: '2026-09-01T10:00:00.000Z',
      recurrence_type: 'none',
      title: 'Illinois annual report',
      authority_name: 'Illinois Secretary of State',
    }
    const compliance = buildComplianceReadModel({
      workspaceId,
      now: friday,
      requirements: [
        { ...verified, id: 'ok', next_due_date: null },
        { ...verified, id: 'not-applicable', applicability_status: 'not_applicable', next_due_date: '2026-09-01' },
      ],
    })
    const result = buildCeoToday({ now: friday, complianceProjection: compliance.ceo_projection })

    expect(compliance.ceo_projection).toEqual([])
    expect(complianceActions(result)).toEqual([])
  })

  it('keeps normal PROTECT after GET MONEY, DELIVER, and CONTROL MONEY work', () => {
    const result = buildCeoToday({
      now: friday,
      leads: [lead({ company: 'Northside Repair' })],
      operationsProjects: [operationsProject()],
      accountingProjection: [accountingProjection({ financial_state: 'payment_due', due_date: '2026-09-11' })],
      complianceProjection: [complianceProjection({ compliance_state: 'compliance_due', next_due_date: '2026-09-11' })],
    })
    const salesIndex = result.all_actions.findIndex((item) => item.department === 'SALES')
    const operationsIndex = result.all_actions.findIndex((item) => item.department === 'OPERATIONS')
    const accountingIndex = result.all_actions.findIndex((item) => item.department === 'ACCOUNTING')
    const complianceIndex = result.all_actions.findIndex((item) => item.department === 'COMPLIANCE')

    expect(salesIndex).toBeLessThan(complianceIndex)
    expect(operationsIndex).toBeLessThan(complianceIndex)
    expect(accountingIndex).toBeLessThan(complianceIndex)
  })

  it('orders normal Compliance work due, approaching, then verification with durable ties and retains it below the visible cap', () => {
    const result = buildCeoToday({
      now: friday,
      leads: Array.from({ length: 5 }, (_, index) => lead({ id: `lead-${index}`, company: `Company ${index}` })),
      complianceProjection: [
        complianceProjection({ requirement_id: 'verify', compliance_state: 'compliance_needs_verification', next_due_date: null, source_timestamp: '2026-09-01T00:00:00.000Z' }),
        complianceProjection({ requirement_id: 'approaching-late', compliance_state: 'compliance_approaching', next_due_date: '2026-09-20', source_timestamp: '2026-09-04T00:00:00.000Z' }),
        complianceProjection({ requirement_id: 'approaching-early', compliance_state: 'compliance_approaching', next_due_date: '2026-09-20', source_timestamp: '2026-09-03T00:00:00.000Z' }),
        complianceProjection({ requirement_id: 'due', compliance_state: 'compliance_due', next_due_date: '2026-09-11' }),
      ],
    })

    expect(complianceActions(result).map((item) => item.id)).toEqual([
      'compliance:due',
      'compliance:approaching-early',
      'compliance:approaching-late',
      'compliance:verify',
    ])
    expect(result.actions).toHaveLength(CEO_ACTION_LIMIT)
    expect(result.actions.some((item) => item.department === 'COMPLIANCE')).toBe(false)
  })

  it('deduplicates malformed repeated Compliance projections by requirement and fails closed for unknown states', () => {
    const result = buildCeoToday({
      now: friday,
      complianceProjection: [
        complianceProjection({ requirement_id: 'same', compliance_state: 'compliance_approaching', next_due_date: '2026-09-20' }),
        complianceProjection({ requirement_id: 'same', compliance_state: 'compliance_due', next_due_date: '2026-09-11' }),
        complianceProjection({ requirement_id: 'unknown', compliance_state: 'compliance_ok' }),
      ],
    })

    expect(complianceActions(result)).toEqual([expect.objectContaining({ id: 'compliance:same', priority_tier: 6 })])
  })
})
