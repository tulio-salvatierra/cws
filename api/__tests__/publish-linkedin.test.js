/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))

import handler, { LINKEDIN_PUBLISH_AGENT_KEY } from '../publish-linkedin'

const VARIANT_ID = '50cddc54-6447-4530-9a36-6770300c5fd4'
const WORKSPACE_ID = '60cddc54-6447-4530-9a36-6770300c5fd4'

function createResponse() {
  const response = { status: vi.fn(() => response), json: vi.fn(() => response) }
  return response
}

function query(result) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  return chain
}

function createDatabase({ member = true, status = 'exported' } = {}) {
  const variant = query({
    data: {
      id: VARIANT_ID,
      workspace_id: WORKSPACE_ID,
      campaign_id: '70cddc54-6447-4530-9a36-6770300c5fd4',
      code: 'CWS-001-EN-MASTER',
      locale: 'en',
      status,
    },
    error: null,
  })
  const membership = query({ data: member ? { workspace_id: WORKSPACE_ID } : null, error: null })
  const campaign = query({ data: { id: '70cddc54-6447-4530-9a36-6770300c5fd4', channel_id: '80cddc54-6447-4530-9a36-6770300c5fd4', code: 'CWS-001', title: 'Intro' }, error: null })
  const exportVersion = query({ data: { id: '90cddc54-6447-4530-9a36-6770300c5fd4', version: 2, caption_text: 'Final caption', export_reference: 'https://canva.link/example' }, error: null })
  const inserted = vi.fn().mockResolvedValue({ data: { id: 'run-1' }, error: null })
  const insert = vi.fn(() => ({ select: vi.fn(() => ({ single: inserted })) }))
  const updateSingle = vi.fn().mockResolvedValue({ data: { id: 'run-1', status: 'failed' }, error: null })
  const update = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: updateSingle })) })) }))
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn((table) => ({
      content_variants: variant,
      workspace_members: membership,
      campaigns: campaign,
      content_variant_exports: exportVersion,
      agent_runs: { insert, update },
    })[table]),
  }
  return { client, insert, update, updateSingle }
}

function request(body = { content_variant_id: VARIANT_ID, platform: 'linkedin' }, token = 'valid-token') {
  return { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body }
}

describe('LinkedIn publish dispatch API', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.N8N_PUBLISH_WEBHOOK_URL = 'https://example.n8n.cloud/webhook/publish'
    process.env.N8N_PUBLISH_WEBHOOK_SECRET = 'publish-secret'
    createClientMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.GENERATION_SUPABASE_URL
    delete process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY
    delete process.env.N8N_PUBLISH_WEBHOOK_URL
    delete process.env.N8N_PUBLISH_WEBHOOK_SECRET
  })

  it('rejects an unauthenticated caller', async () => {
    const response = createResponse()
    await handler(request(undefined, ''), response)
    expect(response.status).toHaveBeenCalledWith(401)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('does not reveal missing n8n environment variables to unauthenticated callers', async () => {
    delete process.env.N8N_PUBLISH_WEBHOOK_URL
    delete process.env.N8N_PUBLISH_WEBHOOK_SECRET
    const response = createResponse()

    await handler(request(undefined, ''), response)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({ ok: false, error: 'Authentication required.' })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('reports missing publishing configuration only after authentication', async () => {
    delete process.env.N8N_PUBLISH_WEBHOOK_URL
    delete process.env.N8N_PUBLISH_WEBHOOK_SECRET
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request(), response)

    expect(response.status).toHaveBeenCalledWith(503)
    expect(response.json).toHaveBeenCalledWith({ ok: false, error: 'LinkedIn publishing is not configured.' })
    expect(database.client.auth.getUser).toHaveBeenCalledWith('valid-token')
    expect(database.client.from).not.toHaveBeenCalled()
    expect(database.insert).not.toHaveBeenCalled()
  })

  it('rejects a non-member', async () => {
    const database = createDatabase({ member: false })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()
    await handler(request(), response)
    expect(response.status).toHaveBeenCalledWith(403)
    expect(database.insert).not.toHaveBeenCalled()
  })

  it('rejects a variant that has not reached the exported gate', async () => {
    const database = createDatabase({ status: 'approved' })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()
    await handler(request(), response)
    expect(response.status).toHaveBeenCalledWith(409)
    expect(response.json).toHaveBeenCalledWith({ ok: false, error: 'The content variant must be exported before it can be published.' })
    expect(database.insert).not.toHaveBeenCalled()
  })

  it('creates a running execute agent run and returns 202 after webhook acceptance', async () => {
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 })
    vi.stubGlobal('fetch', fetchMock)
    const response = createResponse()

    await handler(request(), response)

    expect(response.status).toHaveBeenCalledWith(202)
    expect(response.json).toHaveBeenCalledWith({ ok: true, agent_run_id: 'run-1' })
    expect(database.insert).toHaveBeenCalledWith(expect.objectContaining({
      command_level: 'execute',
      agent_key: LINKEDIN_PUBLISH_AGENT_KEY,
      status: 'running',
      started_at: expect.any(String),
    }))
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(payload).toEqual(expect.objectContaining({
      platform: 'linkedin',
      content_variant_id: VARIANT_ID,
      agent_run_id: 'run-1',
      idempotency_key: `linkedin:v1:${VARIANT_ID}:export:2`,
    }))
  })

  it('marks the run failed when n8n rejects the request', async () => {
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const response = createResponse()

    await handler(request(), response)

    expect(response.status).toHaveBeenCalledWith(502)
    expect(database.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failed',
      error_message: 'n8n publish webhook returned HTTP 500.',
    }))
  })
})
