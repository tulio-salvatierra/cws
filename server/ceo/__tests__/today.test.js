import { describe, expect, it } from 'vitest'
import { buildCeoToday, CEO_ACTION_LIMIT } from '../today.js'

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
})
