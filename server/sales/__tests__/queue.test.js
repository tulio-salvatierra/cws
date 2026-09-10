import { describe, expect, it } from 'vitest'
import { buildSalesCommandQueue, deriveFollowUpState } from '../queue.js'

const now = new Date('2026-09-09T18:00:00.000Z') // Wednesday afternoon in Chicago.

function lead(overrides = {}) {
  return {
    id: 'lead-a', name: 'A Business', email: 'a@example.com', company: 'A Co',
    status: 'contacted', sales_classification: 'prospect', response_state: 'no_response',
    phone: null, locality: null, last_contacted_at: null, created_at: '2026-09-01T15:00:00.000Z',
    ...overrides,
  }
}

function send(overrides = {}) {
  return {
    id: 'send-a', lead_id: 'lead-a', send_type: 'intro', status: 'sent',
    sent_at: '2026-09-01T15:00:00.000Z', created_at: '2026-09-01T15:00:00.000Z',
    ...overrides,
  }
}

describe('Sales command queue', () => {
  it('orders inbound, promised, warm, follow-up, and new prospect work deterministically', () => {
    const inbound = lead({ id: 'inbound', sales_classification: 'inbound', created_at: '2026-09-05T15:00:00.000Z' })
    const promised = lead({ id: 'promised', status: 'won' })
    const warm = lead({ id: 'warm', response_state: 'warm' })
    const followUp = lead({ id: 'follow-up' })
    const newProspect = lead({ id: 'new', created_at: '2026-09-08T15:00:00.000Z' })
    const result = buildSalesCommandQueue({
      leads: [newProspect, followUp, warm, promised, inbound],
      promisedActions: [{ id: 'promise-a', lead_id: 'promised', action_text: 'Call Thursday', due_on: '2026-09-09', completed_at: null, created_at: '2026-09-01T15:00:00.000Z' }],
      outreachSends: [send({ lead_id: 'follow-up' }), send({ lead_id: 'promised' }), send({ lead_id: 'warm' })],
      now,
    })

    expect(result.items.map((item) => item.category)).toEqual(['inbound', 'promised', 'warm', 'follow_up', 'new_prospect'])
  })

  it('uses oldest actionable item first inside the same category', () => {
    const result = buildSalesCommandQueue({
      leads: [
        lead({ id: 'later', created_at: '2026-09-08T15:00:00.000Z' }),
        lead({ id: 'earlier', created_at: '2026-09-01T15:00:00.000Z' }),
      ],
      now,
    })

    expect(result.items.map((item) => item.lead.id)).toEqual(['earlier', 'later'])
  })

  it('derives Day 0, Day 4, Day 10, and dormant state from successful history', () => {
    expect(deriveFollowUpState([], '2026-09-09').state).toBe('day_0')
    expect(deriveFollowUpState([send()], '2026-09-05').state).toBe('day_4_due')
    expect(deriveFollowUpState([send(), send({ id: 'follow-a', send_type: 'follow_up', sent_at: '2026-09-05T15:00:00.000Z' })], '2026-09-11').state).toBe('day_10_due')
    expect(deriveFollowUpState([
      send(),
      send({ id: 'follow-a', send_type: 'follow_up', sent_at: '2026-09-05T15:00:00.000Z' }),
      send({ id: 'follow-b', send_type: 'follow_up', sent_at: '2026-09-11T15:00:00.000Z' }),
    ], '2026-09-12').state).toBe('dormant')
  })

  it('does not advance a prospect sequence from a failed email', () => {
    const result = buildSalesCommandQueue({
      leads: [lead()], outreachSends: [send({ status: 'failed' })], now,
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].category).toBe('new_prospect')
  })

  it('does not let an older follow-up advance a newer initial outreach sequence', () => {
    const result = deriveFollowUpState([
      send({ id: 'old-follow-up', send_type: 'follow_up', sent_at: '2026-08-28T15:00:00.000Z' }),
      send({ id: 'current-intro', sent_at: '2026-09-01T15:00:00.000Z' }),
    ], '2026-09-05')

    expect(result).toMatchObject({ state: 'day_4_due', followUpCount: 0 })
  })

  it('counts only unique successful initial prospect emails toward the Chicago daily target', () => {
    const prospect = lead({ id: 'prospect' })
    const inbound = lead({ id: 'inbound', sales_classification: 'inbound' })
    const result = buildSalesCommandQueue({
      leads: [prospect, inbound],
      outreachSends: [
        send({ id: 'intro-a', lead_id: 'prospect', sent_at: '2026-09-09T15:00:00.000Z' }),
        send({ id: 'intro-a-duplicate', lead_id: 'prospect', sent_at: '2026-09-09T16:00:00.000Z' }),
        send({ id: 'follow-up', lead_id: 'prospect', send_type: 'follow_up', sent_at: '2026-09-09T16:00:00.000Z' }),
        send({ id: 'inbound-intro', lead_id: 'inbound', sent_at: '2026-09-09T16:00:00.000Z' }),
        send({ id: 'failed', lead_id: 'prospect', status: 'failed', sent_at: '2026-09-09T16:00:00.000Z' }),
      ],
      now,
    })

    expect(result.summary).toMatchObject({ newOutreachToday: 1, dailyTarget: 5, newProspectContactsRemaining: 4 })
  })

  it('keeps promised action completion and Not now outside provider work', () => {
    const result = buildSalesCommandQueue({
      leads: [lead()],
      promisedActions: [
        { id: 'open', lead_id: 'lead-a', action_text: 'Send recommendations', due_on: '2026-09-09', completed_at: null, created_at: '2026-09-01T15:00:00.000Z' },
        { id: 'complete', lead_id: 'lead-a', action_text: 'Already done', due_on: '2026-09-01', completed_at: '2026-09-02T15:00:00.000Z', created_at: '2026-09-01T15:00:00.000Z' },
      ],
      now,
    })

    expect(result.items.filter((item) => item.category === 'promised')).toHaveLength(1)
    expect(result.summary.promisedActionsDue).toBe(1)
  })

  it('keeps historical unclassified leads out of queue calculations', () => {
    const result = buildSalesCommandQueue({
      leads: [lead({ sales_classification: null, response_state: null, status: 'contacted' })],
      now,
    })

    expect(result.items).toHaveLength(0)
    expect(result.summary.unclassifiedLeads).toBe(1)
  })

  it('keeps waiting, closed, and completed work out while exposing exact CEO summary values', () => {
    const result = buildSalesCommandQueue({
      leads: [
        lead({ id: 'waiting', created_at: '2026-09-08T15:00:00.000Z' }),
        lead({ id: 'closed', status: 'lost', response_state: 'warm' }),
        lead({ id: 'warm', response_state: 'warm' }),
      ],
      outreachSends: [send({ lead_id: 'waiting', sent_at: '2026-09-08T15:00:00.000Z' })],
      promisedActions: [{ id: 'completed', lead_id: 'warm', action_text: 'Done', due_on: '2026-09-01', completed_at: '2026-09-02T15:00:00.000Z', created_at: '2026-09-01T15:00:00.000Z' }],
      now,
    })

    expect(result.items.map((item) => item.category)).toEqual(['warm'])
    expect(result.summary).toMatchObject({ warmResponses: 1, dueFollowUps: 0, promisedActionsDue: 0, newProspectContactsRemaining: 5 })
  })

  it('uses zero as the target on a Chicago weekend without hiding due action', () => {
    const result = buildSalesCommandQueue({
      leads: [lead()],
      now: new Date('2026-09-12T18:00:00.000Z'), // Saturday in Chicago.
    })

    expect(result.summary).toMatchObject({ dailyTarget: 0, newProspectContactsRemaining: 0 })
    expect(result.items[0].category).toBe('new_prospect')
  })

  it('keeps a phone-only prospect in the queue with Call rather than an email action', () => {
    const result = buildSalesCommandQueue({
      leads: [lead({ id: 'phone-only', email: null, phone: '+13125550123', created_at: '2026-09-09T15:00:00.000Z' })],
      now,
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ category: 'new_prospect', recommendation: 'Call', sendType: null, phone_only: true })
    expect(result.summary.newOutreachToday).toBe(0)
  })
})
