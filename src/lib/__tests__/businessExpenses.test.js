import { describe, expect, it } from 'vitest'
import { billingDate, businessToday, expenseOverview } from '../businessExpenses.js'
const subscription = { id: 's1', status: 'active', billing_anchor: '2026-01-31', cadence: 'monthly', amount_cents: 2000, next_cycle: 0 }

describe('subscription forecasts', () => {
  it('preserves month-end and leap-day anchors without drifting', () => {
    expect(billingDate('2026-01-31', 'monthly', 1)).toBe('2026-02-28')
    expect(billingDate('2026-01-31', 'monthly', 2)).toBe('2026-03-31')
    expect(billingDate('2024-02-29', 'annual', 1)).toBe('2025-02-28')
    expect(billingDate('2024-02-29', 'annual', 4)).toBe('2028-02-29')
  })
  it('uses Chicago dates near midnight UTC', () => {
    expect(businessToday(new Date('2026-10-01T01:00:00Z'))).toBe('2026-09-30')
  })
  it('separates annual budget from full renewal and confirmed payments', () => {
    const result = expenseOverview([{ ...subscription, cadence: 'annual', amount_cents: 24000 }], [], '2026-01')
    expect(result.monthly_commitment_cents).toBe(2000)
    expect(result.expected_cents).toBe(24000)
    expect(result.paid_cents).toBe(0)
  })
  it('preserves paid history while excluding paused/canceled forecasts', () => {
    const result = expenseOverview([{ ...subscription, status: 'paused' }, { ...subscription, id: 's2', status: 'canceled' }], [{ amount_cents: 2300, paid_on: '2026-03-03', due_on: '2026-02-28' }], '2026-03')
    expect(result.expected).toEqual([])
    expect(result.monthly_commitment_cents).toBe(0)
    expect(result.paid_cents).toBe(2300)
  })
  it('shows overdue cycles but only allows payment of the oldest unconfirmed cycle', () => {
    const result = expenseOverview([{ ...subscription, next_cycle: 1 }], [], '2026-03')
    expect(result.expected.map((item) => [item.due_on, item.payable])).toEqual([['2026-02-28', true], ['2026-03-31', false]])
    expect(result.expected_cents).toBe(2000)
  })
  it('counts a linked project payment once and uses actual paid month', () => {
    const expense = { amount_cents: 2500, project_cost_id: 'cost1', due_on: '2026-02-28', paid_on: '2026-03-01' }
    expect(expenseOverview([], [expense], '2026-02').paid_cents).toBe(0)
    expect(expenseOverview([], [expense], '2026-03').paid_cents).toBe(2500)
  })
})
