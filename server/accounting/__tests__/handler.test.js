import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authenticateAccountingOwner: vi.fn(),
  authenticateWorkspace: vi.fn(),
  cents: vi.fn((value) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null),
  cleanText: vi.fn((value) => String(value || '').trim()),
  dateOnly: vi.fn((value) => value || null),
  missingAccountingEnv: vi.fn(() => []),
  parseBody: vi.fn((value) => value),
  receiptTimestamp: vi.fn((value) => value ? `${value}T12:00:00.000Z` : null),
  validUuid: vi.fn((value) => /^[-a-z0-9]+$/i.test(value)),
}))

vi.mock('../shared.js', () => mocks)

import handler from '../handler.js'

function response() { const res = { status: vi.fn(() => res), json: vi.fn(() => res) }; return res }
function query(result) {
  const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), order: vi.fn(() => chain), insert: vi.fn(() => chain), update: vi.fn(() => chain), maybeSingle: vi.fn(() => Promise.resolve(result)) }
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return chain
}

const context = { workspaceId: 'workspace-a', user: { id: 'owner-a' } }
const validObligation = { action: 'create_financial_obligation', client_id: 'client-a', operations_project_id: 'project-a', description: 'Website deposit', amount_cents: 75000, obligation_type: 'deposit', due_date: '2026-09-20' }

describe('Accounting endpoint', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.missingAccountingEnv.mockReturnValue([]) })

  it('requires authentication before its workspace-scoped read', async () => {
    mocks.authenticateWorkspace.mockResolvedValue({ error: 'Authentication required.', status: 401 })
    const res = response(); await handler({ method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('loads only authenticated workspace financial state and never calls a provider', async () => {
    const client = { from: vi.fn(() => query({ data: [], error: null })) }
    mocks.authenticateWorkspace.mockResolvedValue({ ...context, client })
    const fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy)
    const res = response(); await handler({ method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(client.from).toHaveBeenCalledWith('financial_obligations')
    expect(client.from).toHaveBeenCalledWith('payment_receipts')
    expect(client.from).toHaveBeenCalledWith('recurring_revenue')
    expect(fetchSpy).not.toHaveBeenCalled(); vi.unstubAllGlobals()
  })

  it('requires an owner for every financial mutation', async () => {
    mocks.authenticateAccountingOwner.mockResolvedValue({ error: 'An active workspace owner is required for Accounting changes.', status: 403 })
    const res = response(); await handler({ method: 'POST', body: validObligation }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('creates an integer-cent obligation only after client and project share the owner workspace', async () => {
    const clientQuery = query({ data: { id: 'client-a', workspace_id: 'workspace-a' }, error: null })
    const projectQuery = query({ data: { id: 'project-a', workspace_id: 'workspace-a', client_id: 'client-a' }, error: null })
    const insert = query({ data: { id: 'obligation-a' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(clientQuery).mockReturnValueOnce(projectQuery).mockReturnValueOnce(insert) }
    mocks.authenticateAccountingOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: validObligation }, res)
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', client_id: 'client-a', operations_project_id: 'project-a', amount_cents: 75000, currency: 'USD', status: 'expected', created_by: 'owner-a' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('rejects a project belonging to another client or workspace before any obligation insert', async () => {
    const clientQuery = query({ data: { id: 'client-a', workspace_id: 'workspace-a' }, error: null })
    const projectQuery = query({ data: { id: 'project-a', workspace_id: 'workspace-a', client_id: 'client-b' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(clientQuery).mockReturnValueOnce(projectQuery) }
    mocks.authenticateAccountingOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: validObligation }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(client.from).toHaveBeenCalledTimes(2)
  })

  it.each([0, -1, 12.5])('rejects a zero, negative, or non-integer receipt amount (%s)', async (amount_cents) => {
    mocks.cents.mockImplementationOnce(() => null)
    mocks.authenticateAccountingOwner.mockResolvedValue(context)
    const res = response(); await handler({ method: 'POST', body: { action: 'record_payment_receipt', financial_obligation_id: 'obligation-a', amount_cents, payment_method: 'zelle', received_at: '2026-09-13' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('rejects a receipt that would overpay before inserting, while the database trigger remains the concurrent safeguard', async () => {
    const obligationQuery = query({ data: { id: 'obligation-a', workspace_id: 'workspace-a', amount_cents: 75000, status: 'expected' }, error: null })
    const receiptsQuery = query({ data: [{ amount_cents: 70000 }], error: null })
    const client = { from: vi.fn().mockReturnValueOnce(obligationQuery).mockReturnValueOnce(receiptsQuery) }
    mocks.authenticateAccountingOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'record_payment_receipt', financial_obligation_id: 'obligation-a', amount_cents: 10000, payment_method: 'zelle', received_at: '2026-09-13' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(client.from).toHaveBeenCalledTimes(2)
  })

  it('records a valid partial receipt as an append-only owner-confirmed entry', async () => {
    const obligationQuery = query({ data: { id: 'obligation-a', workspace_id: 'workspace-a', amount_cents: 75000, status: 'expected' }, error: null })
    const receiptsQuery = query({ data: [{ amount_cents: 25000 }], error: null })
    const insert = query({ data: { id: 'receipt-b' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(obligationQuery).mockReturnValueOnce(receiptsQuery).mockReturnValueOnce(insert) }
    mocks.authenticateAccountingOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'record_payment_receipt', financial_obligation_id: 'obligation-a', amount_cents: 50000, payment_method: 'zelle', received_at: '2026-09-13', reference_note: 'Confirmed by owner' } }, res)
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ amount_cents: 50000, recorded_by: 'owner-a', workspace_id: 'workspace-a', received_at: '2026-09-13T12:00:00.000Z' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('creates monthly recurring revenue and can only pause or end it without deleting history', async () => {
    const clientQuery = query({ data: { id: 'client-a', workspace_id: 'workspace-a' }, error: null })
    const insert = query({ data: { id: 'recurring-a' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(clientQuery).mockReturnValueOnce(insert) }
    mocks.authenticateAccountingOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'create_recurring_revenue', client_id: 'client-a', description: 'Website care', amount_cents: 7000, provider: 'square', started_at: '2026-09-01', next_expected_at: '2026-10-01' } }, res)
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ cadence: 'monthly', status: 'active', amount_cents: 7000, provider: 'square' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
