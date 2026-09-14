import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authenticateComplianceOwner: vi.fn(),
  authenticateWorkspace: vi.fn(),
  cleanText: vi.fn((value) => String(value || '').trim()),
  dateOnly: vi.fn((value) => value || null),
  missingComplianceEnv: vi.fn(() => []),
  parseBody: vi.fn((value) => value),
  safeSourceUrl: vi.fn((value) => value ? String(value) : null),
  validUuid: vi.fn((value) => /^[-a-z0-9]+$/i.test(String(value || ''))),
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
const requirement = {
  id: 'requirement-a', workspace_id: 'workspace-a', title: 'Illinois annual report', category: 'filing', authority_name: 'Illinois Secretary of State', source_url: 'https://www.ilsos.gov/', jurisdiction: 'Illinois', description: 'Annual business filing.', applicability_status: 'needs_verification', verified_by_owner_at: null, verified_by_owner_id: null, recurrence_type: 'annual', recurrence_interval: null, next_due_date: null, status: 'active', created_at: '2026-09-01T10:00:00.000Z', updated_at: '2026-09-01T10:00:00.000Z',
}
const details = { title: requirement.title, category: requirement.category, authority_name: requirement.authority_name, source_url: requirement.source_url, jurisdiction: requirement.jurisdiction, description: requirement.description, recurrence_type: requirement.recurrence_type, recurrence_interval: '', next_due_date: '', notes: '' }

describe('Compliance endpoint', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.missingComplianceEnv.mockReturnValue([]) })

  it('requires authentication before workspace-scoped Compliance reads', async () => {
    mocks.authenticateWorkspace.mockResolvedValue({ error: 'Authentication required.', status: 401 })
    const res = response(); await handler({ method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('reads only workspace-scoped Compliance records and never fetches research or providers', async () => {
    const client = { from: vi.fn(() => query({ data: [], error: null })) }
    mocks.authenticateWorkspace.mockResolvedValue({ ...context, client })
    const fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy)
    const res = response(); await handler({ method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(client.from).toHaveBeenCalledWith('compliance_requirements')
    expect(client.from).toHaveBeenCalledWith('compliance_completions')
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('requires an owner for every Compliance mutation', async () => {
    mocks.authenticateComplianceOwner.mockResolvedValue({ error: 'An active workspace owner is required for Compliance changes.', status: 403 })
    const res = response(); await handler({ method: 'POST', body: { action: 'create_possible_compliance_requirement', ...details } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('creates every new requirement as needs_verification even when a caller tries to forge verified applicability', async () => {
    const insert = query({ data: { id: 'requirement-a' }, error: null })
    const client = { from: vi.fn(() => insert) }
    mocks.authenticateComplianceOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'create_possible_compliance_requirement', ...details, applicability_status: 'applies', verified_by_owner_at: 'forged' } }, res)
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', applicability_status: 'needs_verification', verified_by_owner_at: null, verified_by_owner_id: null, created_by: 'owner-a' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('allows an owner to verify applies only by writing the server-derived verification audit values', async () => {
    const load = query({ data: requirement, error: null })
    const update = query({ data: { ...requirement, applicability_status: 'applies' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(load).mockReturnValueOnce(update) }
    mocks.authenticateComplianceOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'verify_compliance_requirement_applies', compliance_requirement_id: 'requirement-a' } }, res)
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ applicability_status: 'applies', verified_by_owner_id: 'owner-a', verified_by_owner_at: expect.any(String), verified_source_at: expect.any(String) }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('allows an owner to mark a possible requirement not applicable while preserving review audit evidence', async () => {
    const load = query({ data: requirement, error: null })
    const update = query({ data: { ...requirement, applicability_status: 'not_applicable' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(load).mockReturnValueOnce(update) }
    mocks.authenticateComplianceOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'mark_compliance_requirement_not_applicable', compliance_requirement_id: 'requirement-a' } }, res)
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ applicability_status: 'not_applicable', verified_by_owner_id: 'owner-a', verified_by_owner_at: expect.any(String) }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('keeps workspace isolation on every selected requirement before a write', async () => {
    const load = query({ data: null, error: null })
    const client = { from: vi.fn(() => load) }
    mocks.authenticateComplianceOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'verify_compliance_requirement_applies', compliance_requirement_id: 'requirement-a' } }, res)
    expect(load.eq).toHaveBeenCalledWith('id', 'requirement-a')
    expect(load.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('requires verified applicability before an owner can confirm a due date', async () => {
    const load = query({ data: requirement, error: null })
    const client = { from: vi.fn(() => load) }
    mocks.authenticateComplianceOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'set_compliance_due_date', compliance_requirement_id: 'requirement-a', next_due_date: '2026-10-01' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('persists an explicit owner-confirmed due date only on the selected verified requirement', async () => {
    const verified = { ...requirement, applicability_status: 'applies', verified_by_owner_at: '2026-09-01T00:00:00.000Z', verified_by_owner_id: 'owner-a' }
    const load = query({ data: verified, error: null })
    const update = query({ data: { ...verified, next_due_date: '2026-10-01' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(load).mockReturnValueOnce(update) }
    mocks.authenticateComplianceOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'set_compliance_due_date', compliance_requirement_id: 'requirement-a', next_due_date: '2026-10-01' } }, res)
    expect(update.update).toHaveBeenCalledWith({ next_due_date: '2026-10-01' })
    expect(update.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('updates source/details without permitting browser data to forge verification timestamps', async () => {
    const verified = { ...requirement, applicability_status: 'applies', verified_by_owner_at: '2026-09-01T00:00:00.000Z', verified_by_owner_id: 'owner-a' }
    const load = query({ data: verified, error: null })
    const update = query({ data: verified, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(load).mockReturnValueOnce(update) }
    mocks.authenticateComplianceOwner.mockResolvedValue({ ...context, client })
    const res = response(); await handler({ method: 'POST', body: { action: 'update_compliance_requirement_details', compliance_requirement_id: 'requirement-a', ...details, verified_by_owner_at: null, applicability_status: 'needs_verification' } }, res)
    expect(update.update).toHaveBeenCalledWith(expect.not.objectContaining({ applicability_status: expect.anything(), verified_by_owner_at: expect.anything(), verified_by_owner_id: expect.anything() }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('records completion through the single-purpose append-only database function with no external call', async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: { id: 'completion-a' }, error: null }))
    const client = { rpc }
    mocks.authenticateComplianceOwner.mockResolvedValue({ ...context, client })
    const fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy)
    const res = response(); await handler({ method: 'POST', body: { action: 'record_compliance_completion', compliance_requirement_id: 'requirement-a', completed_at: '2026-09-13', next_due_date: '2027-09-13', notes: 'Owner recorded.' } }, res)
    expect(rpc).toHaveBeenCalledWith('record_compliance_completion', expect.objectContaining({ p_workspace_id: 'workspace-a', p_requirement_id: 'requirement-a', p_recorded_by: 'owner-a', p_completed_at: '2026-09-13', p_next_due_date: '2027-09-13' }))
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    vi.unstubAllGlobals()
  })
})
