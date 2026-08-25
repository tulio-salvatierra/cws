/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))

import handler from '../agent-proposals'

const PROPOSAL_ID = '50cddc54-6447-4530-9a36-6770300c5fd4'

function createResponse() {
  const response = {
    status: vi.fn(() => response),
    json: vi.fn(() => response),
  }
  return response
}

function createQuery(result) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return query
}

function createUpdateQuery(result) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  return query
}

function createClient({
  proposals = [],
  membership = { workspace_id: 'workspace-1' },
  updatedProposal = null,
} = {}) {
  const membershipQuery = createQuery({ data: membership, error: null })
  const proposalsQuery = createQuery({ data: proposals, error: null })
  const updateQuery = createUpdateQuery({ data: updatedProposal, error: null })
  const agentRuns = {
    select: proposalsQuery.select,
    update: updateQuery.update,
  }
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn((table) => {
      if (table === 'workspace_members') return membershipQuery
      if (table === 'agent_runs') return agentRuns
      return null
    }),
  }
  return { client, membershipQuery, proposalsQuery, updateQuery }
}

function request(method = 'GET', token = 'valid-token', body) {
  return {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  }
}

describe('agent proposals API', () => {
  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = 'https://project.supabase.co'
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key'
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    createClientMock.mockReset()
  })

  afterEach(() => {
    delete process.env.VITE_SUPABASE_URL
    delete process.env.VITE_SUPABASE_ANON_KEY
    delete process.env.GENERATION_SUPABASE_URL
    delete process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY
  })

  it('rejects unsupported methods', async () => {
    const response = createResponse()
    await handler(request('POST'), response)
    expect(response.status).toHaveBeenCalledWith(405)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('requires an authenticated bearer token', async () => {
    const response = createResponse()
    await handler(request('GET', ''), response)
    expect(response.status).toHaveBeenCalledWith(401)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('returns only needs-review proposals for the current workspace newest first', async () => {
    const proposals = [
      {
        id: 'run-2',
        agent_key: 'marketing',
        created_at: '2026-08-23T18:00:00Z',
        output: { summary: 'Review the offer.' },
      },
    ]
    const database = createClient({ proposals })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request(), response)

    expect(createClientMock).toHaveBeenCalledWith(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      expect.objectContaining({
        global: { headers: { Authorization: 'Bearer valid-token' } },
      }),
    )
    expect(database.client.from).toHaveBeenCalledWith('agent_runs')
    expect(database.proposalsQuery.select).toHaveBeenCalledWith('id, agent_key, created_at, output')
    expect(database.proposalsQuery.eq).toHaveBeenCalledWith('workspace_id', 'workspace-1')
    expect(database.proposalsQuery.eq).toHaveBeenCalledWith('command_level', 'propose')
    expect(database.proposalsQuery.eq).toHaveBeenCalledWith('status', 'needs_review')
    expect(database.proposalsQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({
      ok: true,
      workspace_id: 'workspace-1',
      proposals,
    })
  })

  it('returns an empty list when the workspace has no pending proposals', async () => {
    const database = createClient({ proposals: [] })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request(), response)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({
      ok: true,
      workspace_id: 'workspace-1',
      proposals: [],
    })
  })

  it('does not query agent_runs when no active workspace membership is visible', async () => {
    const database = createClient({ membership: null })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request(), response)

    expect(database.client.from).not.toHaveBeenCalledWith('agent_runs')
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({
      ok: true,
      workspace_id: null,
      proposals: [],
    })
  })

  it('marks only a current-workspace pending proposal as discussed', async () => {
    const updatedProposal = {
      id: PROPOSAL_ID,
      agent_key: 'marketing',
      status: 'completed',
      created_at: '2026-08-23T18:00:00Z',
      output: { summary: 'Discussed.' },
    }
    const database = createClient({ updatedProposal })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request('PATCH', 'valid-token', { proposal_id: PROPOSAL_ID }), response)

    expect(createClientMock).toHaveBeenCalledWith(
      process.env.GENERATION_SUPABASE_URL,
      process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    expect(database.membershipQuery.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(database.updateQuery.update).toHaveBeenCalledWith({ status: 'completed' })
    expect(database.updateQuery.eq).toHaveBeenCalledWith('id', PROPOSAL_ID)
    expect(database.updateQuery.eq).toHaveBeenCalledWith('workspace_id', 'workspace-1')
    expect(database.updateQuery.eq).toHaveBeenCalledWith('command_level', 'propose')
    expect(database.updateQuery.eq).toHaveBeenCalledWith('status', 'needs_review')
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ ok: true, proposal: updatedProposal })
  })

  it('does not update rows outside the current workspace or pending proposal scope', async () => {
    const database = createClient({ updatedProposal: null })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request('PATCH', 'valid-token', { proposal_id: PROPOSAL_ID }), response)

    expect(database.updateQuery.eq).toHaveBeenCalledWith('workspace_id', 'workspace-1')
    expect(database.updateQuery.eq).toHaveBeenCalledWith('command_level', 'propose')
    expect(database.updateQuery.eq).toHaveBeenCalledWith('status', 'needs_review')
    expect(response.status).toHaveBeenCalledWith(404)
    expect(response.json).toHaveBeenCalledWith({ ok: false, error: 'Pending proposal not found.' })
  })
})
