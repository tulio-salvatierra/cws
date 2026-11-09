import { describe, expect, it, vi } from 'vitest'
import { addDays, signNegocioListo, validateSigning } from '../negocio-listo-signing.js'

const SIGN = '11111111-1111-4111-8111-111111111111'
const RECEIPT = '22222222-2222-4222-8222-222222222222'
const LEAD = '33333333-3333-4333-8333-333333333333'
const body = (over = {}) => ({ action: 'sign_negocio_listo', signing_id: SIGN, receipt_id: RECEIPT, client_name: 'Third City Cafe', client_email: 'owner@thirdcity.example', client_phone: '+17735550100', plan: 'crecer', setup_paid_on: '2026-11-09', setup_method: 'zelle', ...over })

function chain(result) {
  const builder = { select: () => builder, eq: () => builder, ilike: () => builder, limit: () => Promise.resolve(result.list || { data: [], error: null }), single: () => Promise.resolve(result.single || { data: null, error: null }), maybeSingle: () => Promise.resolve(result.single || { data: null, error: null }), insert: (row) => { result.inserted = row; return builder }, update: (row) => { result.updated = row; return { eq: () => ({ eq: () => Promise.resolve({ error: null }) }) } } }
  return builder
}
function fakeContext() {
  const calls = { rpc: [], tables: {} }
  const tables = {
    clients: { single: { data: { id: 'client-1', name: 'Third City Cafe', contact_email: 'owner@thirdcity.example', status: 'active' }, error: null } },
    agreement_installments: { single: { data: { financial_obligation_id: 'setup-ob' }, error: null } },
    leads: {},
    client_service_agreements: {},
  }
  return {
    calls, tables,
    context: {
      workspaceId: 'ws', user: { id: 'owner' },
      client: {
        rpc: vi.fn(async (name, params) => { calls.rpc.push([name, params]); return { data: params.p_id || params.p_receipt_id, error: null } }),
        from: (table) => chain(tables[table]),
      },
    },
  }
}
function fakeRes() {
  const res = { statusCode: 0, body: null, status(code) { res.statusCode = code; return res }, json(payload) { res.body = payload; return res } }
  return res
}

describe('validateSigning', () => {
  it('starts billing 14 days after the setup payment and uses the page price', () => {
    const { value } = validateSigning(body(), '2026-11-09')
    expect(value.billingStart).toBe('2026-11-23')
    expect(value.plan).toMatchObject({ id: 'crecer', monthly_cents: 25000 })
  })
  it('rejects a future setup date, an unknown plan and Square without an email', () => {
    expect(validateSigning(body({ setup_paid_on: '2026-11-10' }), '2026-11-09').error).toMatch(/setup was paid/)
    expect(validateSigning(body({ plan: 'gold' }), '2026-11-09').error).toMatch(/Básico/)
    expect(validateSigning(body({ client_email: '', create_square_subscription: true }), '2026-11-09').error).toMatch(/Square needs/)
  })
  it('handles month ends', () => {
    expect(addDays('2026-12-25', 14)).toBe('2027-01-08')
  })
})

describe('signNegocioListo', () => {
  it('creates the agreement, records the $300 setup, schedules 12 months and marks the lead won', async () => {
    const { context, calls, tables } = fakeContext()
    const res = fakeRes()
    await signNegocioListo(context, body({ lead_id: LEAD }), res, { today: '2026-11-09', env: {} })
    expect(res.statusCode).toBe(200)
    expect(calls.rpc.map(([name]) => name)).toEqual(['create_client_service_agreement', 'record_agreement_payment', 'schedule_client_service_agreement_billing'])
    expect(calls.rpc[0][1]).toMatchObject({ p_id: SIGN, p_client_id: 'client-1', p_product_name: 'Negocio Listo — Crecer', p_setup_cents: 30000, p_monthly_cents: 25000, p_term_months: 12 })
    expect(calls.rpc[1][1]).toMatchObject({ p_obligation_id: 'setup-ob', p_receipt_id: RECEIPT, p_amount_cents: 30000, p_received_at: '2026-11-09T12:00:00.000Z', p_method: 'zelle' })
    expect(calls.rpc[2][1]).toMatchObject({ p_id: SIGN, p_billing_start_date: '2026-11-23' })
    expect(tables.leads.updated).toEqual({ status: 'won' })
    expect(res.body).toMatchObject({ ok: true, billing_start_date: '2026-11-23', square: { requested: false } })
  })

  it('creates the Square subscription on the billing start date and saves its id', async () => {
    const { context, tables } = fakeContext()
    const square = {
      locationId: vi.fn().mockResolvedValue('LOC'),
      findOrCreateCustomer: vi.fn().mockResolvedValue('CUST'),
      planVariationId: vi.fn().mockResolvedValue('VAR'),
      createSubscription: vi.fn().mockResolvedValue('SUB'),
    }
    const res = fakeRes()
    await signNegocioListo(context, body({ create_square_subscription: true }), res, { today: '2026-11-09', env: { SQUARE_ACCESS_TOKEN: 'x' }, square })
    expect(square.planVariationId).toHaveBeenCalledWith({ planName: 'Negocio Listo — Crecer ($250/mo)', monthlyCents: 25000, idempotencyKey: 'nl-crecer-25000' })
    expect(square.createSubscription).toHaveBeenCalledWith({ idempotencyKey: `${SIGN}-subscription`, locationId: 'LOC', planVariationId: 'VAR', customerId: 'CUST', startDate: '2026-11-23' })
    expect(tables.client_service_agreements.updated).toEqual({ square_subscription_reference: 'SUB' })
    expect(res.body.square).toEqual({ requested: true, ok: true, subscription_id: 'SUB', customer_id: 'CUST', start_date: '2026-11-23' })
  })

  it('keeps the Accounting record and reports when Square is not configured or fails', async () => {
    const first = fakeContext(); const res1 = fakeRes()
    await signNegocioListo(first.context, body({ create_square_subscription: true }), res1, { today: '2026-11-09', env: {} })
    expect(res1.body).toMatchObject({ ok: true, square: { ok: false, error: 'SQUARE_ACCESS_TOKEN is not set on the server.' } })
    const second = fakeContext(); const res2 = fakeRes()
    const square = { locationId: vi.fn().mockRejectedValue(new Error('Square /locations: UNAUTHORIZED')) }
    await signNegocioListo(second.context, body({ create_square_subscription: true }), res2, { today: '2026-11-09', env: { SQUARE_ACCESS_TOKEN: 'x' }, square })
    expect(res2.body).toMatchObject({ ok: true, square: { ok: false, error: 'Square /locations: UNAUTHORIZED' } })
  })

  it('stops with 409 when Accounting rejects the agreement', async () => {
    const { context } = fakeContext()
    context.client.rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'Owner required' } })
    const res = fakeRes()
    await signNegocioListo(context, body(), res, { today: '2026-11-09', env: {} })
    expect(res.statusCode).toBe(409)
    expect(res.body.error).toMatch(/Owner required/)
  })
})
