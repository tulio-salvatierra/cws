import { describe, it, expect } from 'vitest'
import { profitability } from '../profitability'
const base = { month: '2026-10', now: new Date('2026-10-11T20:00:00Z') }
describe('monthly cash profitability', () => {
  it('includes every receipt, paid expenses and standalone costs once', () => {
    const result = profitability({ ...base, receipts: [{ amount_cents: 30000, received_at: '2026-10-10T12:00:00Z' }], expenses: [{ amount_cents: 2300, paid_on: '2026-10-03', project_cost_id: 'linked' }], projectCosts: [{ id: 'linked', amount_cents: 2300, paid_on: '2026-10-03', incurred_on: '2026-10-03' }, { id: 'other', amount_cents: 1000, paid_on: '2026-10-05', incurred_on: '2026-09-28' }] })
    expect(result.income).toBe(30000); expect(result.paid).toBe(3300); expect(result.net).toBe(26700)
  })
  it('keeps expected bills and unknown project payments out of recorded cash, but exposes the shortfall', () => {
    const result = profitability({ ...base, receipts: [{ amount_cents: 3000, received_at: '2026-10-04T12:00:00Z' }], subscriptions: [{ id: 's', billing_anchor: '2026-10-03', next_cycle: 0, status: 'active', cadence: 'monthly', amount_cents: 4600 }], projectCosts: [{ id: 'p', amount_cents: 1000, incurred_on: '2026-10-01' }] })
    expect(result.net).toBe(3000); expect(result.unpaid).toBe(4600); expect(result.unconfirmedCents).toBe(1000); expect(result.afterKnownBills).toBe(-2600)
  })
  it('uses Chicago month boundaries, not a truncated UTC timestamp', () => {
    expect(profitability({ ...base, receipts: [{ amount_cents: 3000, received_at: '2026-10-01T01:00:00Z' }] }).income).toBe(0)
  })
  it('charges annual expenses entirely when paid and excludes future payments', () => {
    const result = profitability({ ...base, expenses: [{ amount_cents: 24000, paid_on: '2026-10-01' }, { amount_cents: 10000, paid_on: '2026-11-01' }], receipts: [{ amount_cents: 50000, received_at: '2026-10-20T12:00:00Z' }] })
    expect(result.net).toBe(-24000)
  })
  it('ignores historical linked costs even when the linked payment falls in another month', () => {
    const result = profitability({ ...base, expenses: [{ amount_cents: 1000, paid_on: '2026-09-30', project_cost_id: 'p' }], projectCosts: [{ id: 'p', amount_cents: 1000, incurred_on: '2026-10-01' }] })
    expect(result.net).toBe(0); expect(result.unconfirmed).toEqual([])
  })
})
