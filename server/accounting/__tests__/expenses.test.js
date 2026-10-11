import { describe, expect, it, vi } from 'vitest'
import { expenseAction } from '../expenses.js'
const w = '11111111-1111-4111-8111-111111111111'
const id = '22222222-2222-4222-8222-222222222222'
const response = () => { const res = { status: vi.fn(() => res), json: vi.fn(() => res) }; return res }
const payment = { action: 'pay_business_expense', id, kind: 'subscription', cycle: 0, amount_cents: 2000, paid_on: '2026-01-31' }

describe('expense actions', () => {
  it.each([{ amount_cents: 1.2 }, { amount_cents: -1 }, { paid_on: '2026-02-30' }, { paid_on: '2999-01-01' }, { cycle: -1 }, { id: 'invalid' }])('rejects invalid payment data before database work: %j', async (invalid) => {
    const client = { rpc: vi.fn() }; const res = response()
    await expenseAction({ client, workspaceId: w, user: { id } }, { ...payment, ...invalid }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(client.rpc).not.toHaveBeenCalled()
  })
  it('takes workspace and owner from authenticated context, never request data', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: id }) }; const res = response()
    await expenseAction({ client, workspaceId: w, user: { id } }, { ...payment, workspace_id: 'attacker', user_id: 'attacker' }, res)
    expect(client.rpc).toHaveBeenCalledWith('pay_business_expense', expect.objectContaining({ p_workspace_id: w, p_user_id: id, p_cycle: 0 }))
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('reports a conflict instead of success when atomic payment is rejected', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ error: { message: 'duplicate' } }) }; const res = response()
    await expenseAction({ client, workspaceId: w, user: { id } }, payment, res)
    expect(res.status).toHaveBeenCalledWith(409)
  })
})
