/* global process */

import { readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))
vi.mock('node:fs/promises', async importOriginal => ({
  ...(await importOriginal()),
  readFile: vi.fn(),
}))

import handler from '../marketing-linkedin'

function providerResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  }
}

function makeResponse() {
  const response = { statusCode: 200, body: null }
  response.status = vi.fn(code => {
    response.statusCode = code
    return response
  })
  response.json = vi.fn(body => {
    response.body = body
    return response
  })
  return response
}

function createDatabase({ currentAttempt = null, existingAttempt = null } = {}) {
  const state = { inserts: [], updates: [] }
  const workspaceResult = { data: { workspace_id: 'workspace-1', role: 'owner' }, error: null }

  function query(result) {
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn((field, value) => {
        if (field === 'reference_key') chain.referenceKey = value
        return chain
      }),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      insert: vi.fn(values => {
        state.inserts.push(values)
        chain.operation = 'insert'
        return chain
      }),
      update: vi.fn(values => {
        state.updates.push(values)
        chain.operation = 'update'
        return chain
      }),
      maybeSingle: vi.fn(() => {
        if (chain.referenceKey) return Promise.resolve({ data: existingAttempt, error: null })
        return Promise.resolve(result)
      }),
      single: vi.fn(() => {
        if (chain.operation === 'insert') {
          return Promise.resolve({
            data: {
              id: 'attempt-1',
              ...state.inserts.at(-1),
              created_at: '2026-09-07T00:00:00.000Z',
              provider_error: null,
              provider_permalink: null,
            },
            error: null,
          })
        }
        if (chain.operation === 'update') {
          return Promise.resolve({
            data: {
              id: 'attempt-1',
              ...(currentAttempt || existingAttempt),
              ...state.updates.at(-1),
              created_at: '2026-09-07T00:00:00.000Z',
            },
            error: null,
          })
        }
        return Promise.resolve({ data: null, error: null })
      }),
    }
    return chain
  }

  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null }) },
    from: vi.fn(table => {
      if (table === 'workspace_members') return query(workspaceResult)
      if (table === 'marketing_publish_attempts') return query({ data: currentAttempt, error: null })
      throw new Error(`Unexpected table ${table}`)
    }),
  }

  return { client, state }
}

function request({ method = 'GET', body, token = 'owner-token' } = {}) {
  return {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  }
}

const connectedCompanyPage = {
  type: 'LINKEDIN',
  userDisplayName: 'Cicero Web Studio',
  userUsername: 'cicero-web-studio',
  channels: [],
}

describe('marketing LinkedIn endpoint', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.BUNDLE_SOCIAL_API_KEY = 'bundle-key'
    process.env.BUNDLE_SOCIAL_TEAM_ID = 'team-1'
    createClientMock.mockReset()
    readFile.mockReset()
    globalThis.fetch = vi.fn()
  })

  it('requires authentication before it reads provider configuration', async () => {
    const response = makeResponse()
    await handler(request({ token: '' }), response)

    expect(response.statusCode).toBe(401)
    expect(createClientMock).not.toHaveBeenCalled()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('returns a verified CWS LinkedIn Company Page without creating a post', async () => {
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client)
    globalThis.fetch.mockResolvedValueOnce(providerResponse(200, connectedCompanyPage))

    const response = makeResponse()
    await handler(request(), response)

    expect(response.statusCode).toBe(200)
    expect(response.body.destination).toMatchObject({
      ready: true,
      name: 'LinkedIn — Cicero Web Studio Company Page',
      channel_name: 'Cicero Web Studio',
    })
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.bundle.social/api/v1/social-account/by-type?type=LINKEDIN&teamId=team-1',
      expect.objectContaining({ headers: expect.objectContaining({ 'x-api-key': 'bundle-key' }) }),
    )
    expect(database.state.inserts).toEqual([])
  })

  it('blocks publishing when the selected LinkedIn profile is personal even if the Company Page is available', async () => {
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client)
    globalThis.fetch.mockResolvedValueOnce(providerResponse(200, {
      type: 'LINKEDIN',
      displayName: 'Tulio Salvatierra',
      username: 'tuliosalvatierra',
      channels: [
        { id: 'personal-1', name: 'Tulio Salvatierra' },
        { id: 'company-1', name: 'Cicero Web Studio', username: 'cicero-web-studio' },
      ],
    }))

    const response = makeResponse()
    await handler(request(), response)

    expect(response.statusCode).toBe(409)
    expect(response.body.error).toMatch(/Cicero Web Studio LinkedIn Company Page/)
    expect(database.state.inserts).toEqual([])
  })

  it('persists an intent, uploads the static logo, and creates only a LinkedIn post', async () => {
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client)
    readFile.mockResolvedValue(new Uint8Array([1, 2, 3]))
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, connectedCompanyPage))
      .mockResolvedValueOnce(providerResponse(200, { uploadId: 'upload-1' }))
      .mockResolvedValueOnce(providerResponse(200, { id: 'provider-post-1', status: 'PROCESSING', externalData: {} }))

    const response = makeResponse()
    await handler(request({
      method: 'POST',
      body: {
        caption: 'A clear CWS message.',
        reference_key: 'cws-marketing-linkedin:11111111-1111-4111-8111-111111111111',
      },
    }), response)

    expect(response.statusCode).toBe(202)
    expect(database.state.inserts).toEqual([expect.objectContaining({
      asset_path: '/images/logo.png',
      destination: 'linkedin:cicero-web-studio',
      provider_status: 'preparing',
    })])
    expect(database.state.updates).toEqual([expect.objectContaining({
      upload_id: 'upload-1',
      provider_post_id: 'provider-post-1',
      provider_status: 'processing',
    })])
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
    expect(globalThis.fetch.mock.calls[1][0]).toContain('/upload')
    const createCall = globalThis.fetch.mock.calls[2]
    expect(createCall[0]).toContain('/post')
    expect(JSON.parse(createCall[1].body)).toMatchObject({
      socialAccountTypes: ['LINKEDIN'],
      data: { LINKEDIN: { text: 'A clear CWS message.', uploadIds: ['upload-1'] } },
    })
  })

  it('treats a repeated reference key as the same attempt without uploading or creating another post', async () => {
    const existingAttempt = {
      id: 'attempt-1',
      reference_key: 'cws-marketing-linkedin:33333333-3333-4333-8333-333333333333',
      provider_post_id: null,
      provider_status: 'preparing',
      caption: 'A clear CWS message.',
      asset_path: '/images/logo.png',
      provider_error: null,
      provider_permalink: null,
    }
    const database = createDatabase({ existingAttempt })
    createClientMock.mockReturnValue(database.client)
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, connectedCompanyPage))
      .mockResolvedValueOnce(providerResponse(404, { message: 'Not found' }))

    const response = makeResponse()
    await handler(request({
      method: 'POST',
      body: { caption: 'A clear CWS message.', reference_key: existingAttempt.reference_key },
    }), response)

    expect(response.statusCode).toBe(200)
    expect(response.body.duplicate).toBe(true)
    expect(database.state.inserts).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(globalThis.fetch.mock.calls[1][0]).toContain('/post/reference-key/')
  })

  it('looks up the reference key after an ambiguous provider timeout instead of replaying create-post', async () => {
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client)
    readFile.mockResolvedValue(new Uint8Array([1, 2, 3]))
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, connectedCompanyPage))
      .mockResolvedValueOnce(providerResponse(200, { uploadId: 'upload-1' }))
      .mockRejectedValueOnce(new Error('socket closed'))
      .mockResolvedValueOnce(providerResponse(200, { id: 'provider-post-1', status: 'PROCESSING', externalData: {} }))

    const response = makeResponse()
    await handler(request({
      method: 'POST',
      body: {
        caption: 'A clear CWS message.',
        reference_key: 'cws-marketing-linkedin:22222222-2222-4222-8222-222222222222',
      },
    }), response)

    expect(response.statusCode).toBe(202)
    const postCreates = globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')
    expect(postCreates).toHaveLength(1)
    expect(globalThis.fetch.mock.calls[3][0]).toContain('/post/reference-key/')
    expect(database.state.updates).toContainEqual(expect.objectContaining({ provider_post_id: 'provider-post-1' }))
  })
})
