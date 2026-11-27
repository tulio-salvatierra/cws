import { describe, expect, it, vi } from 'vitest'
import mcpHandler, { isMcpRequest } from '../handler.js'
import { authenticateMcpToken, createMcpToken, generateToken, hashToken, revokeMcpToken } from '../tokens.js'
import { TOOL_NAMES, stripSecrets, summarizeCeoToday } from '../tools.js'

// Fixture data only: the repo is public.
const OWNER = { id: '11111111-1111-4111-8111-111111111111' }
const WORKSPACE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function chain(result) {
  const c = {}
  for (const method of ['select', 'eq', 'is', 'order', 'limit', 'insert', 'update']) c[method] = vi.fn(() => c)
  c.maybeSingle = vi.fn(() => Promise.resolve(result))
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return c
}

function fakeClient(tables) {
  const calls = []
  return {
    calls,
    from: vi.fn(table => {
      const next = tables[table]?.shift?.() ?? { data: null, error: null }
      const c = chain(next)
      calls.push({ table, chain: c })
      return c
    }),
  }
}

function response() {
  const res = { headers: {}, statusCode: 200 }
  res.status = vi.fn(code => { res.statusCode = code; return res })
  res.setHeader = vi.fn((key, value) => { res.headers[key.toLowerCase()] = value })
  res.json = vi.fn(payload => { res.body = payload; return res })
  res.send = vi.fn(text => { res.body = text ? JSON.parse(text) : null; return res })
  return res
}

const rpcHeaders = { host: 'localhost', accept: 'application/json, text/event-stream', 'content-type': 'application/json', authorization: 'Bearer x' }
const ownerContext = { client: null, user: OWNER, workspaceId: WORKSPACE }

const ceoData = {
  actions: [{
    id: 'sales:lead:1', department: 'SALES', business_priority: 'GET MONEY', human_action: 'Follow up with Fixture Bakery',
    why_now: 'Day 4 follow-up is due.', href: '/admin/sales', cta_label: 'Open Sales', move_token: 'secret-move',
    evaluation: { verdict: 'do', next_action: 'Send the follow-up.', missing_data: [], why: [{ claim: 'x' }] },
    owner_response: { review_token: 'secret-review' },
  }],
  all_actions: [],
  money: { available: true, received_amount_cents: 30000, outstanding_amount_cents: 14900, overdue_amount_cents: 0, monthly_recurring_revenue_cents: 14900 },
  goal_pace: { verdict: 'do', business_date: '2026-11-27', goal: { target: 10 }, checkpoint: { target: 4 }, verified: true, next_action: 'Review Sales.', register_snapshot: 'secret', owner_response: { review_token: 'secret' } },
  recent_leads: { available: true, since: '2026-11-21', total: 3, items: [{ name: 'Fixture Person', email: 'person@example.com' }] },
}

async function rpc(body, deps) {
  const res = response()
  await mcpHandler({ method: 'POST', headers: rpcHeaders, body }, res, { authenticate: async () => ownerContext, ...deps })
  return res
}

describe('MCP routing', () => {
  it('detects the rewrite query from req.query or the URL', () => {
    expect(isMcpRequest({ query: { mcp: '1' } })).toBe(true)
    expect(isMcpRequest({ url: '/api/ceo-today?mcp=1' })).toBe(true)
    expect(isMcpRequest({ url: '/api/ceo-today', query: {} })).toBe(false)
  })

  it('rejects GET and DELETE with 405', async () => {
    for (const method of ['GET', 'DELETE']) {
      const res = response()
      await mcpHandler({ method, headers: rpcHeaders }, res, { authenticate: vi.fn() })
      expect(res.statusCode).toBe(405)
    }
  })

  it('returns 401 with WWW-Authenticate when the token is rejected', async () => {
    const res = response()
    await mcpHandler({ method: 'POST', headers: rpcHeaders, body: {} }, res, { authenticate: async () => ({ error: 'nope', status: 401 }) })
    expect(res.statusCode).toBe(401)
    expect(res.headers['www-authenticate']).toMatch(/Bearer/)
  })
})

describe('MCP protocol', () => {
  it('lists exactly the v1 tools, all read-only', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }, { loadCeoToday: vi.fn() })
    const tools = res.body.result.tools
    expect(tools.map(tool => tool.name)).toEqual(TOOL_NAMES)
    expect(TOOL_NAMES).toHaveLength(7)
    expect(tools.every(tool => tool.annotations?.readOnlyHint === true)).toBe(true)
  })

  it('initializes with read-only instructions', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } }, { loadCeoToday: vi.fn() })
    expect(res.body.result.instructions).toMatch(/Read-only/)
  })

  it('get_ceo_today returns the summary with no signing tokens anywhere', async () => {
    const loadCeoToday = vi.fn(async () => ({ data: structuredClone(ceoData), error: null }))
    const res = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'get_ceo_today', arguments: {} } }, { loadCeoToday })
    expect(loadCeoToday).toHaveBeenCalledWith(ownerContext)
    const text = res.body.result.content[0].text
    expect(text).not.toMatch(/secret|_token|register_snapshot|person@example\.com/)
    const summary = JSON.parse(text)
    expect(summary.do_next[0]).toMatchObject({ department: 'SALES', human_action: 'Follow up with Fixture Bakery', laya: { verdict: 'do' } })
    expect(summary.recent_leads).toEqual({ available: true, since: '2026-11-21', total: 3 })
  })

  it('reports load failures as a tool error, not a crash', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_ceo_today', arguments: {} } }, { loadCeoToday: async () => ({ data: null, error: 'CEO Today could not load the current workspace state.' }) })
    expect(res.body.result.isError).toBe(true)
  })
})

describe('stripSecrets', () => {
  it('removes token-like and snapshot keys at any depth', () => {
    const cleaned = stripSecrets({ a: { review_token: 1, move_token: 2, token: 3, keep: { deeper: [{ provider_reference: 'x', ok: 1 }] } }, input_snapshot: {} })
    expect(cleaned).toEqual({ a: { keep: { deeper: [{ ok: 1 }] } } })
  })

  it('summary keeps the money tiles', () => {
    expect(summarizeCeoToday(ceoData).money.outstanding_amount_cents).toBe(14900)
  })
})

describe('MCP token auth', () => {
  const token = generateToken()

  it('rejects missing or malformed tokens without a database read', async () => {
    const client = fakeClient({})
    expect((await authenticateMcpToken({ headers: {} }, { client })).status).toBe(401)
    expect((await authenticateMcpToken({ headers: { authorization: 'Bearer eyJhbGciOi.jwt' } }, { client })).status).toBe(401)
    expect(client.from).not.toHaveBeenCalled()
  })

  it('rejects unknown and revoked tokens', async () => {
    const unknown = fakeClient({ mcp_tokens: [{ data: null, error: null }] })
    expect((await authenticateMcpToken({ headers: { authorization: `Bearer ${token}` } }, { client: unknown })).status).toBe(401)
    const revoked = fakeClient({ mcp_tokens: [{ data: { id: 't', workspace_id: WORKSPACE, user_id: OWNER.id, revoked_at: '2026-11-27T00:00:00Z' }, error: null }] })
    expect((await authenticateMcpToken({ headers: { authorization: `Bearer ${token}` } }, { client: revoked })).status).toBe(401)
  })

  it('rejects a token whose user is no longer an active owner', async () => {
    const client = fakeClient({
      mcp_tokens: [{ data: { id: 't', workspace_id: WORKSPACE, user_id: OWNER.id, revoked_at: null }, error: null }],
      workspace_members: [{ data: { role: 'member' }, error: null }],
    })
    expect((await authenticateMcpToken({ headers: { authorization: `Bearer ${token}` } }, { client })).status).toBe(403)
  })

  it('looks up by hash and returns the token workspace context', async () => {
    const client = fakeClient({
      mcp_tokens: [{ data: { id: 't', workspace_id: WORKSPACE, user_id: OWNER.id, revoked_at: null }, error: null }, { data: null, error: null }],
      workspace_members: [{ data: { role: 'owner' }, error: null }],
    })
    const context = await authenticateMcpToken({ headers: { authorization: `Bearer ${token}` } }, { client })
    expect(context).toMatchObject({ workspaceId: WORKSPACE, user: { id: OWNER.id }, tokenId: 't' })
    expect(client.calls[0].chain.eq).toHaveBeenCalledWith('token_hash', hashToken(token))
    expect(client.calls[2].chain.update).toHaveBeenCalledWith({ last_used_at: expect.any(String) })
  })
})

describe('MCP token owner actions', () => {
  it('stores only the hash and returns the plaintext once', async () => {
    const client = fakeClient({ mcp_tokens: [{ data: { id: 'n', label: 'Laptop', token_prefix: 'cws_mcp_abcdef' }, error: null }] })
    const created = await createMcpToken({ client, user: OWNER, workspaceId: WORKSPACE }, { label: ' Laptop ' })
    const row = client.calls[0].chain.insert.mock.calls[0][0]
    expect(created.token).toMatch(/^cws_mcp_[A-Za-z0-9_-]{43}$/)
    expect(row).toEqual({ workspace_id: WORKSPACE, user_id: OWNER.id, token_hash: hashToken(created.token), token_prefix: created.token.slice(0, 14), label: 'Laptop' })
    expect(JSON.stringify(row)).not.toContain(created.token)
  })

  it('requires a label', async () => {
    expect((await createMcpToken({ client: fakeClient({}), user: OWNER, workspaceId: WORKSPACE }, { label: '  ' })).status).toBe(400)
  })

  it('revokes only an active token in the same workspace', async () => {
    const id = '22222222-2222-4222-8222-222222222222'
    const client = fakeClient({ mcp_tokens: [{ data: [{ id }], error: null }] })
    expect(await revokeMcpToken({ client, workspaceId: WORKSPACE }, { token_id: id })).toEqual({ revoked: id })
    const c = client.calls[0].chain
    expect(c.eq).toHaveBeenCalledWith('workspace_id', WORKSPACE)
    expect(c.is).toHaveBeenCalledWith('revoked_at', null)
    const missing = fakeClient({ mcp_tokens: [{ data: [], error: null }] })
    expect((await revokeMcpToken({ client: missing, workspaceId: WORKSPACE }, { token_id: id })).status).toBe(404)
  })
})
