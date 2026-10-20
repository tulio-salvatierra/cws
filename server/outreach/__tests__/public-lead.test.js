import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ createOutreachClient: vi.fn(), missingOutreachEnv: vi.fn(() => []) }))
vi.mock('../shared.js', async (importOriginal) => ({
  ...(await importOriginal()),
  createOutreachClient: mocks.createOutreachClient,
  missingOutreachEnv: mocks.missingOutreachEnv,
}))
import handler, { buildSource, normalizePhone, readLead } from '../public-lead.js'

function response() { const res = { status: vi.fn(() => res), json: vi.fn(() => res) }; return res }
function query(result) {
  const q = {}
  for (const method of ['select', 'eq', 'gte', 'order', 'limit', 'insert', 'update']) q[method] = vi.fn(() => q)
  q.maybeSingle = vi.fn(() => Promise.resolve(result))
  q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return q
}
const valid = { name: 'Ana', phone: '(708) 555-0101', business_name: 'Ana Roofing', form: 'popup', lang: 'es', business_type: 'roofing', plan_interest: 'crecer', elapsed_ms: 8000 }

describe('Negocio Listo public lead capture', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.missingOutreachEnv.mockReturnValue([]) })

  it('normalizes US phones and rejects partial numbers', () => {
    expect(normalizePhone('(708) 555-0101')).toBe('+17085550101')
    expect(normalizePhone('1 708 555 0101')).toBe('+17085550101')
    expect(normalizePhone('555-0101')).toBe('')
  })

  it('builds a compact source tag from allow-listed values only', () => {
    const lead = readLead({ ...valid, business_type: 'drop table', utm_source: 'ig|bio', has_website: 'no' })
    expect(buildSource(lead)).toBe('negocio-listo|popup|es|plan=crecer|site=no|utm=igbio')
  })

  it('requires a name and a valid phone', async () => {
    const res = response()
    await handler({ method: 'POST', body: { ...valid, phone: '123' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(mocks.createOutreachClient).not.toHaveBeenCalled()
  })

  it('silently drops honeypot and instant submissions without writing', async () => {
    for (const body of [{ ...valid, company_website: 'spam.example' }, { ...valid, elapsed_ms: 200 }]) {
      const res = response()
      await handler({ method: 'POST', body }, res)
      expect(res.status).toHaveBeenCalledWith(202)
    }
    expect(mocks.createOutreachClient).not.toHaveBeenCalled()
  })

  it('inserts an inbound lead owned by the workspace owner', async () => {
    const insertQuery = query({ error: null })
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: { workspace_id: 'ws-1', user_id: 'owner-1' }, error: null }))
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(insertQuery) }
    mocks.createOutreachClient.mockReturnValue(client)
    const res = response()
    await handler({ method: 'POST', body: valid }, res)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(insertQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      workspace_id: 'ws-1', created_by: 'owner-1', phone: '+17085550101', company: 'Ana Roofing',
      sales_classification: 'inbound', source: 'negocio-listo|popup|es|plan=crecer|type=roofing',
    }))
  })

  it('merges a second submission from the same phone into the recent lead', async () => {
    const updateQuery = query({ error: null })
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: { workspace_id: 'ws-1', user_id: 'owner-1' }, error: null }))
      .mockReturnValueOnce(query({ data: { id: 'lead-1', email: 'old@example.com', company: null }, error: null }))
      .mockReturnValueOnce(updateQuery) }
    mocks.createOutreachClient.mockReturnValue(client)
    const res = response()
    await handler({ method: 'POST', body: { ...valid, form: 'inline' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(updateQuery.update).toHaveBeenCalledWith(expect.objectContaining({ email: 'old@example.com', company: 'Ana Roofing' }))
    expect(updateQuery.insert).not.toHaveBeenCalled()
  })
})
