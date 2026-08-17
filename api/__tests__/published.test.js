/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))

import handler, { PUBLISHED_PLATFORMS } from '../published'

function createResponse() {
  const response = {
    status: vi.fn(() => response),
    json: vi.fn(() => response),
  }
  return response
}

function createSupabaseMock({ existing = null, inserted = null, insertError = null } = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: existing, error: null })
  const firstEq = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }))
  const selectExisting = vi.fn(() => ({ eq: firstEq }))
  const single = vi.fn().mockResolvedValue({ data: inserted, error: insertError })
  const selectInserted = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select: selectInserted }))
  const agentRunUpdate = vi.fn().mockResolvedValue({ data: null, error: null })
  const agentRunUpdateEq = vi.fn(() => agentRunUpdate())
  const agentRunUpdateQuery = vi.fn(() => ({ eq: agentRunUpdateEq }))
  const agentRuns = { update: agentRunUpdateQuery }
  const client = {
    from: vi.fn((table) => table === 'agent_runs' ? agentRuns : { select: selectExisting, insert }),
  }
  return { client, insert, agentRunUpdate, agentRunUpdateQuery }
}

function request(body, secret = 'test-secret') {
  return {
    method: 'POST',
    headers: secret ? { 'x-published-webhook-secret': secret } : {},
    body,
  }
}

describe('published posts API', () => {
  beforeEach(() => {
    process.env.PUBLISHED_SUPABASE_URL = 'https://project.supabase.co'
    process.env.PUBLISHED_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.PUBLISHED_WEBHOOK_SECRET = 'test-secret'
    process.env.PUBLISHED_WORKSPACE_ID = 'workspace-1'
    createClientMock.mockReset()
  })

  afterEach(() => {
    delete process.env.PUBLISHED_SUPABASE_URL
    delete process.env.PUBLISHED_SUPABASE_SERVICE_ROLE_KEY
    delete process.env.PUBLISHED_WEBHOOK_SECRET
    delete process.env.PUBLISHED_WORKSPACE_ID
  })

  it('rejects missing authentication', async () => {
    const response = createResponse()
    await handler(request({ platform: 'youtube', published_at: '2026-08-09T12:00:00Z' }, ''), response)
    expect(response.status).toHaveBeenCalledWith(401)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('rejects incorrect authentication', async () => {
    const response = createResponse()
    await handler(request({ platform: 'youtube', published_at: '2026-08-09T12:00:00Z' }, 'wrong'), response)
    expect(response.status).toHaveBeenCalledWith(401)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('rejects unknown platforms and names every accepted value', async () => {
    const response = createResponse()
    await handler(request({ platform: 'tiktok', published_at: '2026-08-09T12:00:00Z' }), response)
    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      ok: false,
      error: `Invalid platform. Accepted values: ${PUBLISHED_PLATFORMS.join(', ')}.`,
    })
  })

  it('rejects a missing required field', async () => {
    const response = createResponse()
    await handler(request({ platform: 'youtube' }), response)
    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({ ok: false, error: 'published_at is required.' })
  })

  it('inserts a publish event and retains the full request body', async () => {
    const body = {
      platform: 'youtube',
      published_at: '2026-08-09T12:00:00Z',
      external_post_id: 'video-1',
      external_url: 'https://youtube.example/video-1',
      source: 'n8n',
    }
    const inserted = { id: 'published-1', ...body, workspace_id: 'workspace-1' }
    const database = createSupabaseMock({ inserted })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request(body), response)

    expect(response.status).toHaveBeenCalledWith(201)
    expect(response.json).toHaveBeenCalledWith({
      ok: true,
      created: true,
      id: 'published-1',
      record: inserted,
    })
    expect(database.insert).toHaveBeenCalledWith(expect.objectContaining({
      workspace_id: 'workspace-1',
      platform: 'youtube',
      external_post_id: 'video-1',
      raw_payload: body,
    }))
    expect(database.insert.mock.calls[0][0]).not.toHaveProperty('brief_version')
  })

  it('persists a positive brief version when present', async () => {
    const body = {
      platform: 'youtube',
      published_at: '2026-08-09T12:00:00Z',
      brief_version: 2,
    }
    const inserted = { id: 'published-brief-2', ...body, workspace_id: 'workspace-1' }
    const database = createSupabaseMock({ inserted })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request(body), response)

    expect(response.status).toHaveBeenCalledWith(201)
    expect(database.insert).toHaveBeenCalledWith(expect.objectContaining({
      brief_version: 2,
      raw_payload: body,
    }))
  })

  it.each([0, -1, 1.5, '1', null])(
    'rejects invalid brief version %j',
    async (briefVersion) => {
      const response = createResponse()

      await handler(request({
        platform: 'youtube',
        published_at: '2026-08-09T12:00:00Z',
        brief_version: briefVersion,
      }), response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        ok: false,
        error: 'brief_version must be a positive integer.',
      })
      expect(createClientMock).not.toHaveBeenCalled()
    },
  )

  it('returns the existing record when a retry repeats the platform post id', async () => {
    const existing = {
      id: 'published-existing',
      platform: 'youtube',
      external_post_id: 'video-1',
    }
    const database = createSupabaseMock({ existing })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request({
      platform: 'youtube',
      published_at: '2026-08-09T12:00:00Z',
      external_post_id: 'video-1',
    }), response)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({
      ok: true,
      created: false,
      id: 'published-existing',
      record: existing,
    })
    expect(database.insert).not.toHaveBeenCalled()
  })

  it('persists agent_run_id and completes the linked run', async () => {
    const body = {
      platform: 'linkedin',
      published_at: '2026-08-09T12:00:00Z',
      external_post_id: 'linkedin-1',
      agent_run_id: '50cddc54-6447-4530-9a36-6770300c5fd4',
      source: 'n8n',
    }
    const inserted = { id: 'published-2', ...body, workspace_id: 'workspace-1' }
    const database = createSupabaseMock({ inserted })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request(body), response)

    expect(response.status).toHaveBeenCalledWith(201)
    expect(database.insert).toHaveBeenCalledWith(expect.objectContaining({ agent_run_id: body.agent_run_id }))
    expect(database.client.from).toHaveBeenCalledWith('agent_runs')
    expect(database.agentRunUpdateQuery).toHaveBeenCalledWith(expect.objectContaining({
      status: 'completed',
      output: expect.objectContaining({ publication_id: 'published-2' }),
    }))
  })
})
