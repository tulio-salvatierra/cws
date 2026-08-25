/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))

import handler from '../agent-proposals'

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

function createClient({ proposals = [], membership = { workspace_id: 'workspace-1' } } = {}) {
  const membershipQuery = createQuery({ data: membership, error: null })
  const proposalsQuery = createQuery({ data: proposals, error: null })
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn((table) => ({
      workspace_members: membershipQuery,
      agent_runs: proposalsQuery,
    })[table]),
  }
  return { client, membershipQuery, proposalsQuery }
}

function request(method = 'GET', token = 'valid-token') {
  return {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  }
}

describe('agent proposals API', () => {
  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = 'https://project.supabase.co'
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key'
    createClientMock.mockReset()
  })

  afterEach(() => {
    delete process.env.VITE_SUPABASE_URL
    delete process.env.VITE_SUPABASE_ANON_KEY
  })

  it('rejects mutation methods', async () => {
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
})
