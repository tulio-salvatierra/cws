/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))

import handler, { N8N_BRIDGE_SECRET_HEADER } from '../n8n-dry-run'

const VARIANT_ID = '50cddc54-6447-4530-9a36-6770300c5fd4'

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
  }
  return query
}

function createClient({ role = 'owner', isTest = true, archived = true } = {}) {
  const membership = createQuery({
    data: { workspace_id: 'workspace-1', role },
    error: null,
  })
  const variant = createQuery({
    data: {
      id: VARIANT_ID,
      workspace_id: 'workspace-1',
      campaign_id: 'campaign-1',
      code: 'CWS-001-EN-FINALTEST',
      locale: 'en',
      working_title: 'Final Test',
      status: 'exported',
      is_test: isTest,
      test_archived: archived,
    },
    error: null,
  })
  const campaign = createQuery({
    data: { id: 'campaign-1', channel_id: 'channel-1', code: 'CWS-001', title: 'Intro' },
    error: null,
  })
  const exportVersion = createQuery({
    data: {
      id: 'export-2',
      version: 2,
      caption_text: 'Dry run caption',
      export_reference: 'corrected.mp4',
      exported_at: '2026-08-12T00:00:00Z',
    },
    error: null,
  })
  const insertedSingle = vi.fn().mockResolvedValue({ data: { id: 'run-1' }, error: null })
  const insert = vi.fn(() => ({ select: vi.fn(() => ({ single: insertedSingle })) }))
  const updateSingle = vi.fn()
    .mockResolvedValueOnce({ data: { id: 'run-1', status: 'running' }, error: null })
    .mockResolvedValueOnce({ data: { id: 'run-1', status: 'completed' }, error: null })
  const updateSelect = vi.fn(() => ({ single: updateSingle }))
  const updateEq = vi.fn(() => ({ select: updateSelect }))
  const update = vi.fn(() => ({ eq: updateEq }))
  const agentRuns = { insert, update }

  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn((table) => ({
      workspace_members: membership,
      content_variants: variant,
      campaigns: campaign,
      content_variant_exports: exportVersion,
      agent_runs: agentRuns,
    })[table]),
  }

  return { client, insert, update, updateSingle }
}

function request(body = { variant_id: VARIANT_ID }, token = 'valid-token') {
  return {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  }
}

describe('n8n dry-run bridge API', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.N8N_DRY_RUN_WEBHOOK_URL = 'https://example.n8n.cloud/webhook/cws-os-dry-run'
    process.env.N8N_DRY_RUN_WEBHOOK_SECRET = 'bridge-secret'
    createClientMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.GENERATION_SUPABASE_URL
    delete process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY
    delete process.env.N8N_DRY_RUN_WEBHOOK_URL
    delete process.env.N8N_DRY_RUN_WEBHOOK_SECRET
  })

  it('requires an authenticated session', async () => {
    const response = createResponse()
    await handler(request(undefined, ''), response)
    expect(response.status).toHaveBeenCalledWith(401)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('requires an active workspace owner', async () => {
    const database = createClient({ role: 'member' })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()
    await handler(request(), response)
    expect(response.status).toHaveBeenCalledWith(403)
    expect(database.insert).not.toHaveBeenCalled()
  })

  it('restricts the first cycle to archived test variants', async () => {
    const database = createClient({ isTest: false, archived: false })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()
    await handler(request(), response)
    expect(response.status).toHaveBeenCalledWith(409)
    expect(response.json).toHaveBeenCalledWith({
      ok: false,
      error: 'The first n8n bridge cycle is restricted to archived test variants.',
    })
    expect(database.insert).not.toHaveBeenCalled()
  })

  it('records and returns a valid n8n dry-run acknowledgement', async () => {
    const database = createClient()
    createClientMock.mockReturnValue(database.client)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify({
        ok: true,
        mode: 'dry_run',
        workflow: 'CWS OS — Dry Run Bridge',
        correlation_id: 'run-1',
        received: { content_variant_id: VARIANT_ID },
      })),
    })
    vi.stubGlobal('fetch', fetchMock)
    const response = createResponse()

    await handler(request(), response)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      mode: 'dry_run',
      run_id: 'run-1',
    }))
    expect(fetchMock).toHaveBeenCalledWith(
      process.env.N8N_DRY_RUN_WEBHOOK_URL,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ [N8N_BRIDGE_SECRET_HEADER]: 'bridge-secret' }),
      }),
    )
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(payload).toEqual(expect.objectContaining({
      mode: 'dry_run',
      correlation_id: 'run-1',
      content_variant_id: VARIANT_ID,
      export_version: 2,
      export_reference: 'corrected.mp4',
    }))
    expect(database.update).toHaveBeenNthCalledWith(1, { status: 'running' })
    expect(database.update).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: 'completed' }))
  })

  it('records a failed run when n8n rejects the request', async () => {
    const database = createClient()
    database.updateSingle
      .mockReset()
      .mockResolvedValueOnce({ data: { id: 'run-1', status: 'running' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'run-1', status: 'failed' }, error: null })
    createClientMock.mockReturnValue(database.client)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue('Unauthorized'),
    }))
    const response = createResponse()

    await handler(request(), response)

    expect(response.status).toHaveBeenCalledWith(502)
    expect(response.json).toHaveBeenCalledWith({
      ok: false,
      error: 'n8n bridge returned HTTP 401.',
      run_id: 'run-1',
    })
    expect(database.update).toHaveBeenNthCalledWith(2, expect.objectContaining({
      status: 'failed',
      error_message: 'n8n bridge returned HTTP 401.',
    }))
  })
})
