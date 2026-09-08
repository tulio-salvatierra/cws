/* global process */

import { readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))
vi.mock('node:fs/promises', async importOriginal => ({ ...(await importOriginal()), readFile: vi.fn() }))

import handler from '../marketing-linkedin'

const verifiedAccounts = [
  { type: 'LINKEDIN', userDisplayName: 'Cicero Web Studio', userUsername: 'cicero-web-studio' },
  { type: 'FACEBOOK', displayName: 'Cicero Web Studio', username: 'Cicero Web Studio' },
  { type: 'INSTAGRAM', displayName: 'cicerowebstudio', username: 'cicerowebstudio' },
]
const legacyPostedAttempt = {
  id: 'm2-posted', reference_key: 'cws-marketing-linkedin:dddddddd-dddd-4ddd-8ddd-dddddddddddd', caption: 'M2 posted.', asset_path: '/images/logo.png',
  destination: 'linkedin:cicero-web-studio', provider_status: 'posted', provider_post_id: 'm2-provider-post', provider_permalink: 'https://www.linkedin.com/feed/update/urn:li:share:7502889252628856832', provider_error: null, created_at: '2026-09-07T01:00:00.000Z',
}

function providerResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, text: vi.fn().mockResolvedValue(JSON.stringify(body)) }
}

function makeResponse() {
  const response = { statusCode: 200, body: null }
  response.status = vi.fn(code => { response.statusCode = code; return response })
  response.json = vi.fn(body => { response.body = body; return response })
  return response
}

function createDatabase({ latest = legacyPostedAttempt, existing = null, history = [legacyPostedAttempt], results = [] } = {}) {
  const state = { attemptInserts: [], destinationInserts: [], attemptUpdates: [], destinationUpdates: [], results: [...results] }
  const workspace = { data: { workspace_id: 'workspace-1', role: 'owner' }, error: null }

  function query(table) {
    const chain = {
      table,
      filters: {},
      select: vi.fn(() => chain),
      eq: vi.fn((field, value) => { chain.filters[field] = value; return chain }),
      order: vi.fn(() => chain),
      limit: vi.fn(value => { chain.limitValue = value; return chain }),
      insert: vi.fn(values => { chain.operation = 'insert'; chain.values = values; return chain }),
      update: vi.fn(values => { chain.operation = 'update'; chain.values = values; return chain }),
      maybeSingle: vi.fn(() => {
        if (table === 'workspace_members') return Promise.resolve(workspace)
        if (chain.filters.reference_key) return Promise.resolve({ data: existing, error: null })
        return Promise.resolve({ data: latest, error: null })
      }),
      single: vi.fn(() => {
        if (table === 'marketing_publish_attempts' && chain.operation === 'insert') {
          const data = { id: 'm4-attempt-1', ...chain.values, provider_error: null, provider_permalink: null, created_at: '2026-09-08T00:00:00.000Z' }
          state.attemptInserts.push(data)
          return Promise.resolve({ data, error: null })
        }
        if (table === 'marketing_publish_attempts' && chain.operation === 'update') {
          const data = { ...latest, id: chain.filters.id || latest?.id || 'm4-attempt-1', ...chain.values }
          state.attemptUpdates.push(data)
          return Promise.resolve({ data, error: null })
        }
        if (table === 'marketing_publish_destination_results' && chain.operation === 'update') {
          const current = state.results.find(result => result.id === chain.filters.id) || { id: chain.filters.id, platform: 'LINKEDIN' }
          const data = { ...current, ...chain.values }
          state.results = state.results.map(result => result.id === data.id ? data : result)
          state.destinationUpdates.push(data)
          return Promise.resolve({ data, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      }),
      then: (resolve, reject) => {
        let response
        if (table === 'marketing_publish_attempts') response = chain.limitValue === 10 ? { data: history, error: null } : { data: latest, error: null }
        else if (table === 'marketing_publish_destination_results' && chain.operation === 'insert') {
          const rows = chain.values.map((value, index) => ({ id: `destination-${index + 1}`, ...value, provider_error: null, provider_permalink: null, created_at: '2026-09-08T00:00:00.000Z' }))
          state.destinationInserts.push(...rows); state.results = rows; response = { data: rows, error: null }
        } else if (table === 'marketing_publish_destination_results') response = { data: state.results, error: null }
        else response = { data: null, error: null }
        return Promise.resolve(response).then(resolve, reject)
      },
    }
    return chain
  }

  return {
    client: {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null }) },
      from: vi.fn(table => query(table)),
    },
    state,
  }
}

function request({ method = 'GET', body, token = 'owner-token' } = {}) {
  return { method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }
}

function queueVerifiedAccounts() { verifiedAccounts.forEach(account => globalThis.fetch.mockResolvedValueOnce(providerResponse(200, account))) }
function m4Reference() { return 'cws-marketing-m4:11111111-1111-4111-8111-111111111111' }
function m4Attempt(status = 'processing') { return { id: 'm4-attempt-1', reference_key: m4Reference(), caption: 'M4 caption.', asset_path: '/images/logo.png', destination: 'multi:cicero-web-studio', provider_post_id: 'bundle-post-1', provider_status: status, provider_error: null, created_at: '2026-09-08T00:00:00.000Z' } }
function destinationResults(status = 'processing') { return ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'].map((platform, index) => ({ id: `destination-${index + 1}`, attempt_id: 'm4-attempt-1', platform, provider_status: status, provider_error: null, provider_permalink: null })) }

describe('M4 Marketing endpoint', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.BUNDLE_SOCIAL_API_KEY = 'bundle-key'
    process.env.BUNDLE_SOCIAL_TEAM_ID = 'team-1'
    createClientMock.mockReset(); readFile.mockReset(); globalThis.fetch = vi.fn()
  })

  it('requires authentication before provider discovery', async () => {
    const response = makeResponse()
    await handler(request({ token: '' }), response)
    expect(response.statusCode).toBe(401)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('discovers and positively verifies all three active CWS destinations without publishing', async () => {
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    const response = makeResponse(); await handler(request(), response)
    expect(response.statusCode).toBe(200)
    expect(response.body.destinations).toEqual(expect.arrayContaining([
      expect.objectContaining({ platform: 'LINKEDIN', verification_state: 'verified', channel_name: 'Cicero Web Studio' }),
      expect.objectContaining({ platform: 'FACEBOOK', verification_state: 'verified', channel_name: 'Cicero Web Studio' }),
      expect.objectContaining({ platform: 'INSTAGRAM', verification_state: 'verified', channel_name: 'cicerowebstudio' }),
    ]))
    expect(response.body.attempt).toBeNull()
    expect(response.body.attempt_history).toEqual([expect.objectContaining({ id: legacyPostedAttempt.id, provider_permalink: legacyPostedAttempt.provider_permalink })])
    expect(database.state.attemptInserts).toEqual([])
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  it('fails closed when an active Facebook account is not the CWS Page', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client)
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, verifiedAccounts[0]))
      .mockResolvedValueOnce(providerResponse(200, { type: 'FACEBOOK', displayName: 'Other Business', username: 'other-business' }))
      .mockResolvedValueOnce(providerResponse(200, verifiedAccounts[2]))
    const response = makeResponse()
    await handler(request({ method: 'POST', body: { caption: 'M4 caption.', reference_key: m4Reference() } }), response)
    expect(response.statusCode).toBe(409)
    expect(response.body.destinations).toContainEqual(expect.objectContaining({ platform: 'FACEBOOK', verification_state: 'not_verified' }))
    expect(database.state.attemptInserts).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
  })

  it('uses one owner-confirmed multi-platform provider post and one reusable upload', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts(); readFile.mockResolvedValue(new Uint8Array([1, 2, 3]))
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, { id: 'upload-1' }))
      .mockResolvedValueOnce(providerResponse(200, { id: 'bundle-post-1', status: 'PROCESSING', externalData: {} }))
    const response = makeResponse()
    await handler(request({ method: 'POST', body: { caption: 'M4 caption.', reference_key: m4Reference() } }), response)
    expect(response.statusCode).toBe(202)
    expect(database.state.attemptInserts).toEqual([expect.objectContaining({ destination: 'multi:cicero-web-studio' })])
    expect(database.state.destinationInserts).toHaveLength(3)
    const createCall = globalThis.fetch.mock.calls.find(([url, options]) => url.endsWith('/post') && options?.method === 'POST')
    expect(JSON.parse(createCall[1].body)).toMatchObject({
      socialAccountTypes: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'],
      data: { LINKEDIN: { uploadIds: ['upload-1'] }, FACEBOOK: { type: 'POST', uploadIds: ['upload-1'] }, INSTAGRAM: { type: 'POST', uploadIds: ['upload-1'] } },
    })
  })

  it('persists partial outcomes independently after one provider response', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts(); readFile.mockResolvedValue(new Uint8Array([1]))
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, { id: 'upload-1' }))
      .mockResolvedValueOnce(providerResponse(200, {
        id: 'bundle-post-1', status: 'ERROR', errors: { INSTAGRAM: { errorMessage: 'Instagram permission expired.' } },
        externalData: { LINKEDIN: { id: 'li-1', permalink: 'https://linkedin.test/post' }, FACEBOOK: { id: 'fb-1', permalink: 'https://facebook.test/post' } },
      }))
    const response = makeResponse()
    await handler(request({ method: 'POST', body: { caption: 'M4 caption.', reference_key: m4Reference() } }), response)
    expect(response.body.destination_results).toEqual(expect.arrayContaining([
      expect.objectContaining({ platform: 'LINKEDIN', provider_status: 'posted', provider_permalink: 'https://linkedin.test/post' }),
      expect.objectContaining({ platform: 'FACEBOOK', provider_status: 'posted', provider_permalink: 'https://facebook.test/post' }),
      expect.objectContaining({ platform: 'INSTAGRAM', provider_status: 'error', provider_error: 'Instagram permission expired.' }),
    ]))
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(1)
  })

  it('reconciles unfinished destinations on reload without a second create-post', async () => {
    const current = m4Attempt()
    const database = createDatabase({ latest: current, history: [legacyPostedAttempt], results: destinationResults() })
    createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    globalThis.fetch.mockResolvedValueOnce(providerResponse(200, {
      id: 'bundle-post-1', status: 'POSTED', externalData: {
        LINKEDIN: { id: 'li-1', permalink: 'https://linkedin.test/post' }, FACEBOOK: { id: 'fb-1', permalink: 'https://facebook.test/post' }, INSTAGRAM: { id: 'ig-1', permalink: 'https://instagram.test/post' },
      },
    }))
    const response = makeResponse(); await handler(request(), response)
    expect(response.statusCode).toBe(200)
    expect(response.body.destination_results.every(result => result.provider_status === 'posted')).toBe(true)
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
    expect(database.state.destinationUpdates).toHaveLength(3)
  })

  it('returns an existing terminal M4 attempt without republishing posted destinations', async () => {
    const current = m4Attempt('posted')
    const database = createDatabase({ latest: current, existing: current, results: destinationResults('posted') })
    createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    const response = makeResponse()
    await handler(request({ method: 'POST', body: { caption: 'M4 caption.', reference_key: current.reference_key } }), response)
    expect(response.statusCode).toBe(200)
    expect(response.body.duplicate).toBe(true)
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
    expect(readFile).not.toHaveBeenCalled()
  })
})
