import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authenticateWorkspace: vi.fn(),
  cleanText: vi.fn((value) => String(value || '').trim()),
  missingOutreachEnv: vi.fn(() => []),
  parseBody: vi.fn((value) => value),
}))

vi.mock('../shared.js', () => ({
  authenticateWorkspace: mocks.authenticateWorkspace,
  cleanText: mocks.cleanText,
  missingOutreachEnv: mocks.missingOutreachEnv,
  parseBody: mocks.parseBody,
}))

import handler from '../leads.js'

function response() { const res = { status: vi.fn(() => res), json: vi.fn(() => res) }; return res }
function query(result) {
  const q = { select: vi.fn(() => q), eq: vi.fn(() => q), order: vi.fn(() => q), insert: vi.fn(() => q), single: vi.fn(() => Promise.resolve(result)) }
  q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return q
}

describe('Sales leads contact methods', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.authenticateWorkspace.mockResolvedValue({ workspaceId: 'workspace-a', user: { id: 'owner-a' } }) })

  it('allows a phone-only prospect without creating email outreach', async () => {
    const inserted = query({ data: { id: 'lead-a', email: null, phone: '+13125550123', sales_classification: 'prospect' }, error: null })
    mocks.authenticateWorkspace.mockResolvedValue({ workspaceId: 'workspace-a', user: { id: 'owner-a' }, client: { from: vi.fn(() => inserted) } })
    const res = response()
    await handler({ method: 'POST', body: { name: 'Chicago General Contractor', email: '', phone: '+13125550123', sales_classification: 'prospect' } }, res)
    expect(inserted.insert).toHaveBeenCalledWith(expect.objectContaining({ email: null, phone: '+13125550123' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('requires at least one verified public contact method', async () => {
    const res = response()
    await handler({ method: 'POST', body: { name: 'No Contact', email: '', phone: '' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
