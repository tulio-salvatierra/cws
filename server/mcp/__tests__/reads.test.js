import { describe, expect, it, vi } from 'vitest'
import mcpHandler from '../handler.js'
import { readAccounting, readComplianceDue, readLeads, readProject, readProjects, readPromisedActions } from '../reads.js'

// Fixture data only: the repo is public.
const WS = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NOW = new Date('2026-11-27T18:00:00Z')

function fakeClient(tables) {
  const calls = []
  const client = {
    calls,
    from: vi.fn(table => {
      const result = typeof tables[table] === 'function' ? tables[table]() : (tables[table] ?? { data: [], error: null })
      const c = {}
      for (const method of ['select', 'eq', 'is', 'in', 'lt', 'order', 'limit']) c[method] = vi.fn(() => c)
      c.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
      calls.push({ table, chain: c })
      return c
    }),
  }
  return client
}

const ctx = client => ({ client, user: { id: 'u' }, workspaceId: WS })
const eqCalls = (client, table) => client.calls.filter(call => call.table === table).flatMap(call => call.chain.eq.mock.calls)

describe('readLeads', () => {
  const leads = { data: [{ id: 'l1', name: 'Fixture Owner', company: 'Fixture Tacos', status: 'new', email: 'owner@example.com', phone: '+13125550100' }], error: null }

  it('scopes to the workspace, excludes test leads, and omits contact details by default', async () => {
    const client = fakeClient({ leads })
    const result = await readLeads(ctx(client), { limit: 50 })
    expect(eqCalls(client, 'leads')).toEqual(expect.arrayContaining([['workspace_id', WS], ['is_test', false]]))
    expect(result.leads[0]).not.toHaveProperty('email')
    expect(result.leads[0]).not.toHaveProperty('phone')
    expect(result.contact_details).toMatch(/omitted/)
  })

  it('includes contact details only when asked and passes filters through', async () => {
    const client = fakeClient({ leads })
    const result = await readLeads(ctx(client), { include_contact: true, status: 'new', response_state: 'warm', limit: 5 })
    expect(result.leads[0]).toMatchObject({ email: 'owner@example.com', phone: '+13125550100' })
    expect(eqCalls(client, 'leads')).toEqual(expect.arrayContaining([['status', 'new'], ['response_state', 'warm']]))
    expect(client.calls[0].chain.limit).toHaveBeenCalledWith(5)
  })

  it('reports a read failure as an error', async () => {
    expect(await readLeads(ctx(fakeClient({ leads: { data: null, error: { message: 'x' } } })))).toEqual({ error: 'Leads could not be loaded.' })
  })
})

describe('readPromisedActions', () => {
  it('labels due state in Chicago time and drops promises on test leads', async () => {
    const client = fakeClient({
      sales_promised_actions: { data: [
        { id: 'p1', lead_id: 'l1', action_text: 'Call back', due_on: '2026-11-26' },
        { id: 'p2', lead_id: 'l1', action_text: 'Send quote', due_on: '2026-11-27' },
        { id: 'p3', lead_id: 'lt', action_text: 'Test promise', due_on: '2026-11-30' },
      ], error: null },
      leads: { data: [{ id: 'l1', name: 'Fixture Owner', company: 'Fixture Tacos', is_test: false }, { id: 'lt', name: 'Test', company: null, is_test: true }], error: null },
    })
    const result = await readPromisedActions(ctx(client), {}, NOW)
    expect(result.business_date).toBe('2026-11-27')
    expect(result.promised_actions.map(row => [row.action, row.state])).toEqual([['Call back', 'overdue'], ['Send quote', 'due_today']])
    expect(result.promised_actions[0].lead).toEqual({ id: 'l1', name: 'Fixture Owner', company: 'Fixture Tacos' })
  })

  it('filters to overdue before today when asked', async () => {
    const client = fakeClient({ sales_promised_actions: { data: [], error: null } })
    await readPromisedActions(ctx(client), { overdue_only: true }, NOW)
    expect(client.calls[0].chain.lt).toHaveBeenCalledWith('due_on', '2026-11-27')
    expect(client.calls[0].chain.is).toHaveBeenCalledWith('completed_at', null)
  })
})

const project = (overrides = {}) => ({ id: '33333333-3333-4333-8333-333333333333', workspace_id: WS, client_id: 'c1', name: 'Fixture Site', project_type: 'website_build', status: 'in_progress', actual_hours: 4, created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z', ...overrides })
const requirement = { id: 'r1', workspace_id: WS, project_id: '33333333-3333-4333-8333-333333333333', requirement_key: 'logo', label: 'Logo files', category: 'brand', status: 'needed', timing: 'needed_now', responsible_party: 'client', notes: null, requested_at: '2026-11-20T00:00:00Z', received_at: null, created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z' }

describe('projects', () => {
  it('summarizes open projects with who they are waiting on, without client contact info', async () => {
    const client = fakeClient({
      operations_projects: { data: [project(), project({ id: '44444444-4444-4444-8444-444444444444', name: 'Done', status: 'completed' }), project({ id: '55555555-5555-4555-8555-555555555555', workspace_id: OTHER, name: 'Other workspace' })], error: null },
      project_requirements: { data: [requirement], error: null },
      clients: { data: [{ id: 'c1', workspace_id: WS, name: 'Fixture Client', status: 'active', contact_email: 'client@example.com' }], error: null },
    })
    const result = await readProjects(ctx(client), {})
    expect(result.projects.map(row => row.name)).toEqual(['Fixture Site'])
    expect(result.projects[0]).toMatchObject({ client: 'Fixture Client', delivery_state: 'waiting_on_client', blocker_count: 1, current_blocker: 'Logo files' })
    expect(JSON.stringify(result)).not.toContain('client@example.com')
    expect((await readProjects(ctx(client), { include_closed: true })).projects).toHaveLength(2)
  })

  it('get_project returns requirements, or a not-found error', async () => {
    const found = fakeClient({ operations_projects: { data: [project()], error: null }, project_requirements: { data: [requirement], error: null }, clients: { data: [], error: null } })
    const detail = await readProject(ctx(found), { project_id: '33333333-3333-4333-8333-333333333333' })
    expect(detail.requirements).toEqual([expect.objectContaining({ label: 'Logo files', responsible_party: 'client', status: 'needed' })])
    expect(eqCalls(found, 'operations_projects')).toContainEqual(['id', '33333333-3333-4333-8333-333333333333'])
    const missing = fakeClient({ operations_projects: { data: [], error: null } })
    expect(await readProject(ctx(missing), { project_id: '33333333-3333-4333-8333-333333333333' })).toEqual({ error: 'No project with that id in this workspace.' })
  })
})

describe('readAccounting', () => {
  it('returns overdue bills and receipts without payment reference notes', async () => {
    const client = fakeClient({
      financial_obligations: { data: [{ id: 'o1', workspace_id: WS, client_id: 'c1', description: 'Setup fee', amount_cents: 30000, currency: 'USD', obligation_type: 'setup', due_date: '2026-11-01', status: 'expected', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' }], error: null },
      payment_receipts: { data: [{ id: 'pr1', workspace_id: WS, financial_obligation_id: 'o1', amount_cents: 10000, received_at: '2026-11-02', payment_method: 'square', reference_note: 'private ref', created_at: '2026-11-02T00:00:00Z' }], error: null },
      clients: { data: [{ id: 'c1', workspace_id: WS, name: 'Fixture Client', status: 'active' }], error: null },
    })
    const result = await readAccounting(ctx(client), NOW)
    expect(result.summary.outstanding_amount_cents).toBe(20000)
    expect(result.overdue).toEqual([expect.objectContaining({ description: 'Setup fee', client: 'Fixture Client', outstanding_amount_cents: 20000 })])
    expect(result.recent_receipts[0]).toEqual({ amount_cents: 10000, received_at: '2026-11-02', payment_method: 'square', for: 'Setup fee' })
    expect(JSON.stringify(result)).not.toContain('private ref')
    expect(client.calls.find(call => call.table === 'payment_receipts').chain.select.mock.calls[0][0]).not.toContain('reference_note')
  })
})

describe('readComplianceDue', () => {
  it('returns active items that need attention or fall inside the window', async () => {
    const base = { workspace_id: WS, category: 'license', authority_name: 'City', source_url: null, jurisdiction: 'Cicero', description: 'd', applicability_status: 'applies', verified_by_owner_at: '2026-10-01T00:00:00Z', verified_source_at: null, recurrence_type: 'annual', recurrence_interval: null, last_completed_at: null, status: 'active', notes: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' }
    const client = fakeClient({ compliance_requirements: { data: [
      { ...base, id: 'k1', title: 'Business license', next_due_date: '2026-12-10' },
      { ...base, id: 'k2', title: 'Far away', next_due_date: '2027-06-01' },
      { ...base, id: 'k3', title: 'Retired', next_due_date: '2026-11-01', status: 'retired' },
    ], error: null } })
    const result = await readComplianceDue(ctx(client), { within_days: 30 }, NOW)
    expect(result.through).toBe('2026-12-27')
    expect(result.items.map(row => row.title)).toEqual(['Business license'])
  })
})

describe('tool input validation over MCP', () => {
  const headers = { host: 'localhost', accept: 'application/json, text/event-stream', 'content-type': 'application/json' }
  const call = async (name, args, reads) => {
    const res = { status: vi.fn(() => res), setHeader: vi.fn(), json: vi.fn(), send: vi.fn(text => { res.body = JSON.parse(text) }) }
    await mcpHandler({ method: 'POST', headers, body: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } } }, res,
      { authenticate: async () => ({ client: null, user: { id: 'u' }, workspaceId: WS }), loadCeoToday: vi.fn(), reads })
    return res.body
  }

  it('rejects a non-uuid project_id before any read', async () => {
    const reads = { readProject: vi.fn() }
    const body = await call('get_project', { project_id: 'not-a-uuid' }, reads)
    expect(body.result?.isError ?? Boolean(body.error)).toBe(true)
    expect(reads.readProject).not.toHaveBeenCalled()
  })

  it('caps list_leads at 100 and defaults to 50', async () => {
    const reads = { readLeads: vi.fn(async () => ({ leads: [] })) }
    expect((await call('list_leads', { limit: 500 }, reads)).result?.isError ?? true).toBe(true)
    await call('list_leads', {}, reads)
    expect(reads.readLeads).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: WS }), expect.objectContaining({ limit: 50 }))
  })

  it('strips secret-shaped keys from read results', async () => {
    const reads = { readAccounting: vi.fn(async () => ({ summary: {}, provider_reference: 'x', nested: { review_token: 'y', ok: 1 } })) }
    const text = (await call('get_accounting_summary', {}, reads)).result.content[0].text
    expect(JSON.parse(text)).toEqual({ summary: {}, nested: { ok: 1 } })
  })
})
