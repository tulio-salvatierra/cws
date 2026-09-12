import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authenticateOperationsOwner: vi.fn(),
  authenticateOperationsWorkspace: vi.fn(),
  cleanText: vi.fn((value) => String(value || '').trim()),
  missingOperationsEnv: vi.fn(() => []),
  parseBody: vi.fn((value) => value),
}))

vi.mock('../shared.js', () => ({
  authenticateOperationsOwner: mocks.authenticateOperationsOwner,
  authenticateOperationsWorkspace: mocks.authenticateOperationsWorkspace,
  cleanText: mocks.cleanText,
  missingOperationsEnv: mocks.missingOperationsEnv,
  parseBody: mocks.parseBody,
}))

import handler from '../handler.js'

function response() {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) }
  return res
}

function query(result) {
  const chain = {
    select: vi.fn(() => chain), eq: vi.fn(() => chain), order: vi.fn(() => chain), update: vi.fn(() => chain), maybeSingle: vi.fn(() => Promise.resolve(result)),
  }
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return chain
}

const project = { id: '11111111-1111-4111-8111-111111111111', workspace_id: 'workspace-a', client_id: 'client-a', name: 'Northside Website', project_type: 'website_build', status: 'setup', created_at: '2026-09-12T10:00:00.000Z', updated_at: '2026-09-12T10:00:00.000Z' }
const requirement = { id: '22222222-2222-4222-8222-222222222222', workspace_id: 'workspace-a', project_id: project.id, requirement_key: 'business_basics', label: 'Business basics', category: 'business_basics', status: 'needed', timing: 'needed_now', responsible_party: 'client', notes: null, requested_at: '2026-09-12T10:00:00.000Z', received_at: null, created_at: '2026-09-12T10:00:00.000Z', updated_at: '2026-09-12T10:00:00.000Z' }

describe('Operations endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.missingOperationsEnv.mockReturnValue([])
  })

  it('requires authentication before a read reaches Operations tables', async () => {
    mocks.authenticateOperationsWorkspace.mockResolvedValue({ error: 'Authentication required.', status: 401 })
    const res = response()
    await handler({ method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('loads only the authenticated workspace and filters defensive cross-workspace rows', async () => {
    const projects = query({ data: [project, { ...project, id: '33333333-3333-4333-8333-333333333333', workspace_id: 'workspace-b' }], error: null })
    const requirements = query({ data: [requirement, { ...requirement, id: '44444444-4444-4444-8444-444444444444', workspace_id: 'workspace-b' }], error: null })
    const clients = query({ data: [{ id: 'client-a', workspace_id: 'workspace-a', name: 'Northside', contact_email: null, contact_phone: null }, { id: 'client-b', workspace_id: 'workspace-b', name: 'Other', contact_email: null, contact_phone: null }], error: null })
    const client = { from: vi.fn().mockReturnValueOnce(projects).mockReturnValueOnce(requirements).mockReturnValueOnce(clients) }
    mocks.authenticateOperationsWorkspace.mockResolvedValue({ client, workspaceId: 'workspace-a' })
    const res = response()

    await handler({ method: 'GET' }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(projects.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(requirements.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(clients.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    const payload = res.json.mock.calls[0][0]
    expect(payload.operations.projects).toHaveLength(1)
    expect(payload.operations.projects[0].requirements).toHaveLength(1)
  })

  it('requires the workspace owner before an Operations mutation', async () => {
    mocks.authenticateOperationsOwner.mockResolvedValue({ error: 'Operations owner required.', status: 403 })
    const res = response()
    await handler({ method: 'POST', body: { action: 'create_operations_project' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('creates a project through the single-purpose transactional RPC only', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: project, error: null })
    mocks.authenticateOperationsOwner.mockResolvedValue({ client: { rpc }, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'create_operations_project', client_name: 'Northside', project_name: 'Website', project_type: 'website_build', contact_email: '', contact_phone: '' } }, res)

    expect(rpc).toHaveBeenCalledWith('create_operations_project', expect.objectContaining({ p_workspace_id: 'workspace-a', p_created_by: 'owner-a', p_client_name: 'Northside', p_project_type: 'website_build' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('scopes requirement edits to the owner workspace', async () => {
    const update = query({ data: { ...requirement, status: 'received' }, error: null })
    const client = { from: vi.fn(() => update) }
    mocks.authenticateOperationsOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'update_project_requirement', requirement_id: requirement.id, status: 'received', timing: 'needed_now', responsible_party: 'client', notes: 'Received from client.' } }, res)

    expect(update.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
