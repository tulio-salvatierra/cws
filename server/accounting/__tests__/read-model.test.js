import { describe, expect, it } from 'vitest'
import { buildAccountingReadModel, obligationFinancialState } from '../read-model.js'

const workspaceId = 'workspace-a'
const client = { id: 'client-a', workspace_id: workspaceId, name: 'Northside Auto' }
const project = { id: 'project-a', workspace_id: workspaceId, client_id: client.id, name: 'Northside Website' }

function obligation(overrides = {}) {
  return {
    id: 'obligation-a', workspace_id: workspaceId, client_id: client.id, operations_project_id: project.id,
    description: 'Website deposit', amount_cents: 75000, currency: 'USD', obligation_type: 'deposit', due_date: '2026-09-13', status: 'expected',
    created_at: '2026-09-01T10:00:00.000Z', updated_at: '2026-09-01T10:00:00.000Z', ...overrides,
  }
}

function receipt(overrides = {}) {
  return {
    id: 'receipt-a', workspace_id: workspaceId, financial_obligation_id: 'obligation-a', amount_cents: 25000,
    received_at: '2026-09-12T12:00:00.000Z', payment_method: 'zelle', reference_note: null, created_at: '2026-09-12T12:00:00.000Z', ...overrides,
  }
}

function recurring(overrides = {}) {
  return {
    id: 'recurring-a', workspace_id: workspaceId, client_id: client.id, description: 'Website care', amount_cents: 7000,
    currency: 'USD', cadence: 'monthly', status: 'active', provider: 'square', provider_reference: null,
    started_at: '2026-08-01', next_expected_at: '2026-09-20', ended_at: null, created_at: '2026-08-01T10:00:00.000Z', updated_at: '2026-08-01T10:00:00.000Z', ...overrides,
  }
}

function model(values = {}) {
  return buildAccountingReadModel({ workspaceId, clients: [client], operationsProjects: [project], now: new Date('2026-09-13T15:00:00.000Z'), ...values })
}

describe('Accounting deterministic read model', () => {
  it('calculates partial receipts, outstanding money, and MRR with integer cents', () => {
    const result = model({ obligations: [obligation()], receipts: [receipt()], recurringRevenue: [recurring()] })
    expect(result.summary).toEqual({ expected_amount_cents: 75000, received_amount_cents: 25000, outstanding_amount_cents: 50000, overdue_amount_cents: 0, monthly_recurring_revenue_cents: 7000 })
    expect(result.obligations[0]).toMatchObject({ received_amount_cents: 25000, outstanding_amount_cents: 50000, financial_state: 'payment_due' })
  })

  it('marks a fully received obligation without a mutable received status', () => {
    const result = model({ obligations: [obligation()], receipts: [receipt({ amount_cents: 75000 })] })
    expect(result.obligations[0]).toMatchObject({ status: 'expected', financial_state: 'received', outstanding_amount_cents: 0 })
    expect(result.outstanding_obligations).toEqual([])
  })

  it('derives due, overdue, and no-date states from an injected current date', () => {
    expect(obligationFinancialState({ status: 'expected', dueDate: '2026-09-13', amountCents: 100, receivedCents: 0, outstandingCents: 100, today: '2026-09-13' })).toBe('payment_due')
    expect(obligationFinancialState({ status: 'expected', dueDate: '2026-09-12', amountCents: 100, receivedCents: 0, outstandingCents: 100, today: '2026-09-13' })).toBe('payment_overdue')
    expect(obligationFinancialState({ status: 'expected', dueDate: null, amountCents: 100, receivedCents: 0, outstandingCents: 100, today: '2026-09-13' })).toBe('expected')
  })

  it('removes waived and cancelled obligations from current expected and outstanding amounts while preserving receipts', () => {
    const result = model({
      obligations: [obligation({ id: 'waived', status: 'waived' }), obligation({ id: 'cancelled', status: 'cancelled' })],
      receipts: [receipt({ id: 'preserved-receipt', financial_obligation_id: 'waived', amount_cents: 10000 })],
    })
    expect(result.summary).toMatchObject({ expected_amount_cents: 0, outstanding_amount_cents: 0, received_amount_cents: 10000 })
    expect(result.recent_receipts).toHaveLength(1)
    expect(result.obligations.map((item) => item.financial_state)).toEqual(['waived', 'cancelled'])
  })

  it('excludes paused and ended recurring revenue from MRR and keeps the durable history readable', () => {
    const result = model({ recurringRevenue: [recurring(), recurring({ id: 'paused', status: 'paused', amount_cents: 8000 }), recurring({ id: 'ended', status: 'ended', amount_cents: 9000, ended_at: '2026-09-01' })] })
    expect(result.summary.monthly_recurring_revenue_cents).toBe(7000)
    expect(result.recurring_revenue).toHaveLength(3)
  })

  it('only exposes due, overdue, and recurring-attention conditions in its narrow CEO projection', () => {
    const result = model({
      obligations: [obligation({ id: 'overdue', due_date: '2026-09-10' }), obligation({ id: 'later', due_date: '2026-09-14' }), obligation({ id: 'received', due_date: '2026-09-10' })],
      receipts: [receipt({ financial_obligation_id: 'received', amount_cents: 75000 })],
      recurringRevenue: [recurring({ id: 'attention', next_expected_at: '2026-09-13' }), recurring({ id: 'future', next_expected_at: '2026-09-14' })],
    })
    expect(result.ceo_projection.map((item) => item.financial_state)).toEqual(['payment_overdue', 'recurring_attention'])
    expect(result.ceo_projection.every((item) => item.client_name === 'Northside Auto')).toBe(true)
  })

  it('ignores cross-workspace inputs and remains deterministic', () => {
    const values = {
      obligations: [obligation(), obligation({ id: 'foreign', workspace_id: 'workspace-b', amount_cents: 99999 })],
      receipts: [receipt(), receipt({ id: 'foreign-receipt', workspace_id: 'workspace-b', amount_cents: 99999 })],
      recurringRevenue: [recurring(), recurring({ id: 'foreign-recurring', workspace_id: 'workspace-b', amount_cents: 99999 })],
    }
    expect(model(values)).toEqual(model(values))
    expect(model(values).summary).toMatchObject({ expected_amount_cents: 75000, received_amount_cents: 25000, monthly_recurring_revenue_cents: 7000 })
  })
})
