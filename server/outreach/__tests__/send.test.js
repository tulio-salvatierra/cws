import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authenticateOwner: vi.fn(),
  cleanText: vi.fn((value) => String(value || '').trim()),
  draftHash: vi.fn(() => 'a'.repeat(64)),
  missingOutreachEnv: vi.fn(() => []),
  parseBody: vi.fn((body) => body),
  validSalesConfirmationToken: vi.fn(() => true),
  getFromEmail: vi.fn(() => 'Cicero Web Studio <hello@example.com>'),
  sendResendEmail: vi.fn(),
}))

vi.mock('../shared.js', () => ({
  authenticateOwner: mocks.authenticateOwner,
  cleanText: mocks.cleanText,
  draftHash: mocks.draftHash,
  missingOutreachEnv: mocks.missingOutreachEnv,
  parseBody: mocks.parseBody,
  validSalesConfirmationToken: mocks.validSalesConfirmationToken,
}))
vi.mock('../../../api/lib/resend.js', () => ({
  getFromEmail: mocks.getFromEmail,
  sendResendEmail: mocks.sendResendEmail,
}))

import handler from '../send.js'

function response() {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) }
  return res
}

function query(result, order, label) {
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q), in: vi.fn(() => q), limit: vi.fn(() => q),
    insert: vi.fn(() => { if (label) order.push(label); return q }),
    update: vi.fn(() => q), maybeSingle: vi.fn(() => Promise.resolve(result)), single: vi.fn(() => Promise.resolve(result)),
  }
  q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return q
}

function request(overrides = {}) {
  return {
    method: 'POST',
    body: {
      lead_id: 'lead-a', template_id: 'template-a', send_type: 'intro',
      subject: 'A useful note', body: 'Hello from Cicero Web Studio.', owner_confirmation_token: 'confirmed',
      ...overrides,
    },
  }
}

function setContext(results) {
  const client = { from: vi.fn(() => results.shift()) }
  mocks.authenticateOwner.mockResolvedValue({ client, user: { id: 'owner-a' }, workspaceId: 'workspace-a' })
  return client
}

const lead = { data: { id: 'lead-a', email: 'lead@example.com', status: 'contacted' }, error: null }
const template = { data: { id: 'template-a', type: 'intro' }, error: null }

describe('authenticated Sales send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.missingOutreachEnv.mockReturnValue([])
    mocks.validSalesConfirmationToken.mockReturnValue(true)
    mocks.sendResendEmail.mockResolvedValue({ data: { id: 'resend-message-a' }, error: null })
  })

  it('rejects a confirmation bound to a different lead, recipient, or edited draft before any provider mutation', async () => {
    mocks.validSalesConfirmationToken.mockReturnValue(false)
    const order = []
    const insert = query({ data: null, error: null }, order, 'insert')
    setContext([query(lead, order), query(template, order), insert])
    const res = response()

    await handler(request(), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(insert.insert).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('keeps GET/reload and unauthenticated requests outside the provider path', async () => {
    const getResponse = response()
    await handler({ method: 'GET' }, getResponse)
    expect(getResponse.status).toHaveBeenCalledWith(405)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()

    mocks.authenticateOwner.mockResolvedValue({ error: 'Authentication required.', status: 401 })
    const postResponse = response()
    await handler(request(), postResponse)
    expect(postResponse.status).toHaveBeenCalledWith(401)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('blocks a phone-only lead before it can prepare a confirmation or reach Resend', async () => {
    const order = []
    setContext([
      query({ data: { id: 'lead-a', email: null, status: 'new' }, error: null }, order),
      query(template, order),
    ])
    const res = response()

    await handler(request(), res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(mocks.validSalesConfirmationToken).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('persists the stable send attempt before invoking Resend and then durably records the result', async () => {
    const order = []
    const inserted = query({ data: { id: 'send-a', status: 'queued', resend_message_id: null, sent_at: null }, error: null }, order, 'insert')
    const finalized = query({ data: { id: 'send-a', status: 'sent', resend_message_id: 'resend-message-a', sent_at: '2026-09-09T00:00:00.000Z' }, error: null }, order)
    setContext([
      query(lead, order), query(template, order), query({ data: [], error: null }, order), query({ data: null, error: null }, order), inserted, finalized,
    ])
    mocks.sendResendEmail.mockImplementation(async () => { order.push('provider'); return { data: { id: 'resend-message-a' }, error: null } })
    const res = response()

    await handler(request(), res)

    expect(order).toEqual(['insert', 'provider'])
    expect(inserted.insert).toHaveBeenCalledWith(expect.objectContaining({ status: 'queued', idempotency_key: expect.stringContaining('sales/workspace-a/lead-a/template-a/intro/') }))
    expect(finalized.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent', resend_message_id: 'resend-message-a' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('does not create a second provider email when the same authorized send is retried', async () => {
    const order = []
    const existing = { id: 'send-a', status: 'sent', resend_message_id: 'resend-message-a', sent_at: '2026-09-09T00:00:00.000Z' }
    setContext([
      query(lead, order), query(template, order), query({ data: [], error: null }, order), query({ data: existing, error: null }, order),
    ])
    const res = response()

    await handler(request(), res)

    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ ok: true, duplicate: true, send: existing })
  })

  it('blocks a bounced or complained lead before it can be resent', async () => {
    const order = []
    setContext([
      query(lead, order), query(template, order), query({ data: [{ id: 'prior-bounce' }], error: null }, order),
    ])
    const res = response()

    await handler(request(), res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('keeps a failed provider result on the existing durable attempt', async () => {
    const order = []
    const inserted = query({ data: { id: 'send-a', status: 'queued', resend_message_id: null, sent_at: null }, error: null }, order, 'insert')
    const finalized = query({ data: { id: 'send-a', status: 'failed', resend_message_id: null, sent_at: null }, error: null }, order)
    setContext([
      query(lead, order), query(template, order), query({ data: [], error: null }, order), query({ data: null, error: null }, order), inserted, finalized,
    ])
    mocks.sendResendEmail.mockImplementation(async () => { order.push('provider'); return { data: null, error: { message: 'Provider unavailable' } } })
    const res = response()

    await handler(request(), res)

    expect(order).toEqual(['insert', 'provider'])
    expect(finalized.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed', error_message: 'Provider unavailable' }))
    expect(res.status).toHaveBeenCalledWith(502)
  })

  it('does not retry a provider mutation when final result persistence requires reconciliation', async () => {
    const order = []
    const inserted = query({ data: { id: 'send-a', status: 'queued', resend_message_id: null, sent_at: null }, error: null }, order, 'insert')
    const failedFinalization = query({ data: null, error: { message: 'Database unavailable' } }, order)
    setContext([
      query(lead, order), query(template, order), query({ data: [], error: null }, order), query({ data: null, error: null }, order), inserted, failedFinalization,
    ])
    const res = response()

    await handler(request(), res)

    expect(mocks.sendResendEmail).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false, error: 'Email outcome requires reconciliation before any retry.' }))
  })
})
