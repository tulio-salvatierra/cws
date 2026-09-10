import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authenticateOwner: vi.fn(), createSalesConfirmationToken: vi.fn(), interpolateTemplate: vi.fn(),
  missingOutreachEnv: vi.fn(() => []), parseBody: vi.fn((value) => value),
}))
vi.mock('../shared.js', () => ({
  authenticateOwner: mocks.authenticateOwner,
  createSalesConfirmationToken: mocks.createSalesConfirmationToken,
  interpolateTemplate: mocks.interpolateTemplate,
  missingOutreachEnv: mocks.missingOutreachEnv,
  parseBody: mocks.parseBody,
}))
import handler from '../draft.js'

function response() { const res = { status: vi.fn(() => res), json: vi.fn(() => res) }; return res }
function query(result) { const q = { select: vi.fn(() => q), eq: vi.fn(() => q), maybeSingle: vi.fn(() => Promise.resolve(result)) }; q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject); return q }

describe('Sales email draft safety for phone-only leads', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does not issue an email confirmation for a lead with no email', async () => {
    const client = { from: vi.fn().mockReturnValueOnce(query({ data: { id: 'lead-a', email: null, status: 'new' }, error: null })).mockReturnValueOnce(query({ data: { id: 'template-a', type: 'intro', subject: 'Hi', body: 'Hello' }, error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()
    await handler({ method: 'POST', body: { lead_id: 'lead-a', template_id: 'template-a' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(mocks.createSalesConfirmationToken).not.toHaveBeenCalled()
  })
})
