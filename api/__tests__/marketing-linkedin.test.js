/* global process */

import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))
vi.mock('node:fs/promises', async importOriginal => ({ ...(await importOriginal()), readFile: vi.fn() }))

import handler, { createOwnerConfirmationToken } from '../marketing-linkedin'

const verifiedAccounts = [
  { type: 'LINKEDIN', userDisplayName: 'Cicero Web Studio', userUsername: 'cicero-web-studio' },
  { type: 'FACEBOOK', displayName: 'Cicero Web Studio', username: 'Cicero Web Studio' },
  { type: 'INSTAGRAM', displayName: 'cicerowebstudio', username: 'cicerowebstudio' },
]
const m5SlotKey = '2026-09-07:post-a'
const m5PostBSlotKey = '2026-09-07:post-b'
const m5Reference = 'cws-marketing-m5:11111111-1111-4111-8111-111111111111'
const m5PostBReference = 'cws-marketing-m5:22222222-2222-4222-8222-222222222222'
const legacyFailedAttempt = {
  id: 'm2-failed', reference_key: 'cws-marketing-linkedin:eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', caption: 'M2 failed.', asset_path: '/images/logo.png',
  destination: 'linkedin:cicero-web-studio', provider_status: 'error', provider_post_id: null, provider_permalink: null, provider_error: 'bundle.social did not return an upload ID.', created_at: '2026-09-07T01:00:00.000Z',
}
const legacyM4Attempt = {
  id: 'm4-posted', reference_key: 'cws-marketing-m4:dddddddd-dddd-4ddd-8ddd-dddddddddddd', caption: 'M4 posted.', asset_path: '/images/logo.png',
  destination: 'multi:cicero-web-studio', provider_status: 'posted', provider_post_id: 'm4-provider-post', provider_permalink: null, provider_error: null, created_at: '2026-09-08T01:00:00.000Z',
}

function providerResponse(status, body) { return { ok: status >= 200 && status < 300, status, text: vi.fn().mockResolvedValue(JSON.stringify(body)) } }
function makeResponse() { const response = { statusCode: 200, body: null }; response.status = vi.fn(code => { response.statusCode = code; return response }); response.json = vi.fn(body => { response.body = body; return response }); return response }
function request({ method = 'GET', body, token = 'owner-token' } = {}) { return { method, headers: token ? { authorization: `Bearer ${token}` } : {}, body } }
function ownerConfirmation(slotKey = m5SlotKey, assetId = 'website-launch') { return createOwnerConfirmationToken({ workspaceId: 'workspace-1', userId: 'owner-1' }, { slotKey, asset: { id: assetId } }) }
function queueVerifiedAccounts() { verifiedAccounts.forEach(account => globalThis.fetch.mockResolvedValueOnce(providerResponse(200, account))) }
function m4Results(status = 'posted') { return ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'].map((platform, index) => ({ id: `m4-result-${index}`, attempt_id: 'm4-posted', platform, provider_status: status, provider_error: null, provider_permalink: status === 'posted' ? `https://example.test/${platform}` : null })) }
function m5Attempt(status = 'processing') { return { id: 'm5-attempt', reference_key: m5Reference, caption: 'M5 caption.', asset_id: 'website-launch', asset_path: '/images/en-launch.png', destination: 'multi:cicero-web-studio', marketing_slot_key: m5SlotKey, provider_post_id: 'bundle-post-1', provider_status: status, provider_error: null, created_at: '2026-09-08T12:00:00.000Z' } }
function m5Results(status = 'processing') { return ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'].map((platform, index) => ({ id: `m5-result-${index}`, attempt_id: 'm5-attempt', platform, provider_status: status, provider_error: null, provider_permalink: null })) }
function m6Resolution(action = 'move') { return { occurrence_slot_key: m5SlotKey, origin_slot_key: m5SlotKey, action, target_slot_key: action === 'move' ? m5PostBSlotKey : null, asset_id: 'website-launch', asset_path: '/images/en-launch.png', caption: 'Edited M6 caption.', decided_at: '2026-09-09T12:00:00.000Z', created_at: '2026-09-09T12:00:00.000Z' } }

function createDatabase({ attempts = [legacyM4Attempt, legacyFailedAttempt], resultRows = { 'm4-posted': m4Results() }, resolutions = [] } = {}) {
  const state = { attempts: attempts.map(attempt => ({ ...attempt })), resultRows: Object.fromEntries(Object.entries(resultRows).map(([id, rows]) => [id, rows.map(row => ({ ...row }))])), resolutions: resolutions.map(resolution => ({ ...resolution })), attemptInserts: [], destinationInserts: [], resolutionInserts: [], attemptUpdates: [], destinationUpdates: [] }
  const workspace = { data: { workspace_id: 'workspace-1', role: 'owner' }, error: null }
  const latestAttempt = () => state.attempts[0] || null

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
        if (table === 'marketing_publish_attempts' && chain.filters.reference_key) return Promise.resolve({ data: state.attempts.find(attempt => attempt.reference_key === chain.filters.reference_key) || null, error: null })
        if (table === 'marketing_publish_attempts' && chain.filters.marketing_slot_key) return Promise.resolve({ data: state.attempts.find(attempt => attempt.marketing_slot_key === chain.filters.marketing_slot_key) || null, error: null })
        return Promise.resolve({ data: latestAttempt(), error: null })
      }),
      single: vi.fn(() => {
        if (table === 'marketing_publish_attempts' && chain.operation === 'insert') {
          const data = { id: `m5-attempt-${state.attemptInserts.length + 1}`, ...chain.values, provider_error: null, provider_permalink: null, created_at: '2026-09-08T12:00:00.000Z' }
          state.attempts.unshift(data); state.attemptInserts.push(data)
          return Promise.resolve({ data, error: null })
        }
        if (table === 'marketing_publish_attempts' && chain.operation === 'update') {
          const current = state.attempts.find(attempt => attempt.id === chain.filters.id) || latestAttempt()
          const data = { ...current, ...chain.values }
          state.attempts = state.attempts.map(attempt => attempt.id === data.id ? data : attempt); state.attemptUpdates.push(data)
          return Promise.resolve({ data, error: null })
        }
        if (table === 'marketing_publish_destination_results' && chain.operation === 'update') {
          const rows = state.resultRows[chain.filters.attempt_id] || Object.values(state.resultRows).flat()
          const current = rows.find(row => row.id === chain.filters.id) || { id: chain.filters.id, attempt_id: 'm5-attempt', platform: 'LINKEDIN' }
          const data = { ...current, ...chain.values }
          const targetRows = state.resultRows[data.attempt_id] || []
          state.resultRows[data.attempt_id] = targetRows.map(row => row.id === data.id ? data : row)
          state.destinationUpdates.push(data)
          return Promise.resolve({ data, error: null })
        }
        if (table === 'marketing_slot_resolutions' && chain.operation === 'insert') {
          const data = { id: `m6-resolution-${state.resolutionInserts.length + 1}`, ...chain.values, decided_at: '2026-09-09T12:00:00.000Z', created_at: '2026-09-09T12:00:00.000Z' }
          state.resolutions.push(data); state.resolutionInserts.push(data)
          return Promise.resolve({ data, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      }),
      then: (resolve, reject) => {
        let response = { data: null, error: null }
        if (table === 'marketing_publish_attempts') response = { data: state.attempts, error: null }
        if (table === 'marketing_slot_resolutions') response = { data: state.resolutions, error: null }
        if (table === 'marketing_publish_destination_results' && chain.operation === 'insert') {
          const rows = chain.values.map((value, index) => ({ id: `m5-result-${index}`, ...value, provider_error: null, provider_permalink: null, created_at: '2026-09-08T12:00:00.000Z' }))
          state.resultRows[rows[0].attempt_id] = rows; state.destinationInserts.push(...rows); response = { data: rows, error: null }
        } else if (table === 'marketing_publish_destination_results' && chain.filters.attempt_id) response = { data: state.resultRows[chain.filters.attempt_id] || [], error: null }
        else if (table === 'marketing_publish_destination_results') response = { data: [], error: null }
        return Promise.resolve(response).then(resolve, reject)
      },
    }
    return chain
  }

  return { client: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null }) }, from: vi.fn(table => query(table)) }, state }
}

describe('M5 Marketing endpoint', () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-08T17:00:00.000Z'))
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.BUNDLE_SOCIAL_API_KEY = 'bundle-key'
    process.env.BUNDLE_SOCIAL_TEAM_ID = 'team-1'
    createClientMock.mockReset(); readFile.mockReset(); globalThis.fetch = vi.fn()
  })

  afterEach(() => vi.useRealTimers())

  it('requires authentication before provider discovery', async () => {
    const response = makeResponse(); await handler(request({ token: '' }), response)
    expect(response.statusCode).toBe(401); expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('prepares status without creating attempts and issues a token only for Post A', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    const response = makeResponse(); await handler(request(), response)
    expect(response.statusCode).toBe(200)
    expect(response.body.slots.map(slot => [slot.label, slot.weekday, slot.slot_key])).toEqual([
      ['Post A', 'Tuesday', '2026-09-07:post-a'],
      ['Post B', 'Friday', '2026-09-07:post-b'],
    ])
    expect(response.body.slots.map(slot => slot.asset.id)).toEqual(['website-launch', 'bilingual-website'])
    expect(new Set(response.body.slots.map(slot => slot.asset.id)).size).toBe(2)
    expect(response.body.slots.map(slot => Boolean(slot.owner_confirmation_token))).toEqual([true, false])
    expect(response.body.attempt_history.map(attempt => attempt.id)).toEqual(expect.arrayContaining(['m2-failed', 'm4-posted']))
    expect(database.state.attemptInserts).toEqual([])
    expect(database.state.destinationInserts).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
  })

  it('reloads without creating attempts, uploads, or provider posts', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts(); queueVerifiedAccounts()
    const first = makeResponse(); const second = makeResponse()
    await handler(request(), first); await handler(request(), second)
    expect(first.statusCode).toBe(200); expect(second.statusCode).toBe(200)
    expect(database.state.attemptInserts).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
  })

  it('fails closed when Facebook is not the verified CWS Page', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client)
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, verifiedAccounts[0]))
      .mockResolvedValueOnce(providerResponse(200, { type: 'FACEBOOK', displayName: 'Other Business' }))
      .mockResolvedValueOnce(providerResponse(200, verifiedAccounts[2]))
    const response = makeResponse(); await handler(request({ method: 'POST', body: { caption: 'M5 caption.', slot_key: m5SlotKey, asset_id: 'website-launch', reference_key: m5Reference, owner_confirmation_token: ownerConfirmation() } }), response)
    expect(response.statusCode).toBe(409); expect(database.state.attemptInserts).toEqual([]); expect(readFile).not.toHaveBeenCalled()
  })

  it('creates only Post A from one confirmed Post A request and locks a duplicate request', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts(); readFile.mockResolvedValue(new Uint8Array([1, 2, 3]))
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, { id: 'upload-1' }))
      .mockResolvedValueOnce(providerResponse(200, { id: 'bundle-post-1', status: 'PROCESSING', externalData: {} }))
    const response = makeResponse(); await handler(request({ method: 'POST', body: { caption: 'M5 caption.', slot_key: m5SlotKey, asset_id: 'website-launch', reference_key: m5Reference, owner_confirmation_token: ownerConfirmation() } }), response)
    expect(response.statusCode).toBe(202)
    expect(database.state.attemptInserts).toEqual([expect.objectContaining({ destination: 'multi:cicero-web-studio', marketing_slot_key: m5SlotKey, asset_id: 'website-launch', asset_path: '/images/en-launch.png' })])
    expect(database.state.destinationInserts).toHaveLength(3)
    const createCall = globalThis.fetch.mock.calls.find(([url, options]) => url.endsWith('/post') && options?.method === 'POST')
    expect(JSON.parse(createCall[1].body)).toMatchObject({ socialAccountTypes: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'], data: { LINKEDIN: { uploadIds: ['upload-1'] }, FACEBOOK: { type: 'POST', uploadIds: ['upload-1'] }, INSTAGRAM: { type: 'POST', uploadIds: ['upload-1'] } } })
    queueVerifiedAccounts()
    const duplicate = makeResponse(); await handler(request({ method: 'POST', body: { caption: 'M5 caption.', slot_key: m5SlotKey, asset_id: 'website-launch', reference_key: m5Reference, owner_confirmation_token: ownerConfirmation() } }), duplicate)
    expect(duplicate.statusCode).toBe(409)
    expect(database.state.attemptInserts).toHaveLength(1)
    expect(database.state.attemptInserts[0].marketing_slot_key).toBe(m5SlotKey)
    expect(database.state.attemptInserts.some(attempt => attempt.marketing_slot_key === m5PostBSlotKey)).toBe(false)
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(1)
  })

  it('rejects a Post B confirmation before Post A is terminal', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    const response = makeResponse(); await handler(request({ method: 'POST', body: {
      caption: 'Post B caption.', slot_key: m5PostBSlotKey, asset_id: 'bilingual-website', reference_key: m5PostBReference, owner_confirmation_token: ownerConfirmation(m5PostBSlotKey, 'bilingual-website'),
    } }), response)
    expect(response.statusCode).toBe(409)
    expect(database.state.attemptInserts).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
  })

  it('requires a separate Post B token after Post A posts and creates only Post B', async () => {
    const postA = m5Attempt('posted')
    const database = createDatabase({ attempts: [postA, legacyM4Attempt], resultRows: { 'm4-posted': m4Results(), 'm5-attempt': m5Results('posted') } })
    createClientMock.mockReturnValue(database.client); queueVerifiedAccounts(); readFile.mockResolvedValue(new Uint8Array([1, 2, 3]))
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, { id: 'upload-b' }))
      .mockResolvedValueOnce(providerResponse(200, { id: 'bundle-post-b', status: 'PROCESSING', externalData: {} }))
    const response = makeResponse(); await handler(request({ method: 'POST', body: {
      caption: 'Post B caption.', slot_key: m5PostBSlotKey, asset_id: 'bilingual-website', reference_key: m5PostBReference, owner_confirmation_token: ownerConfirmation(m5PostBSlotKey, 'bilingual-website'),
    } }), response)
    expect(response.statusCode).toBe(202)
    expect(database.state.attemptInserts).toHaveLength(1)
    expect(database.state.attemptInserts[0]).toEqual(expect.objectContaining({ marketing_slot_key: m5PostBSlotKey, asset_id: 'bilingual-website' }))
    expect(database.state.attempts.filter(attempt => attempt.marketing_slot_key === m5SlotKey)).toHaveLength(1)
  })

  it('rejects a Post A authorization token when it is presented for Post B', async () => {
    const postA = m5Attempt('posted')
    const database = createDatabase({ attempts: [postA, legacyM4Attempt], resultRows: { 'm4-posted': m4Results(), 'm5-attempt': m5Results('posted') } })
    createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    const response = makeResponse(); await handler(request({ method: 'POST', body: {
      caption: 'Post B caption.', slot_key: m5PostBSlotKey, asset_id: 'bilingual-website', reference_key: m5PostBReference, owner_confirmation_token: ownerConfirmation(),
    } }), response)
    expect(response.statusCode).toBe(403)
    expect(database.state.attemptInserts).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
  })

  it('locks a slot with an existing attempt rather than creating another post', async () => {
    const current = m5Attempt('posted')
    const database = createDatabase({ attempts: [current, legacyM4Attempt, legacyFailedAttempt], resultRows: { 'm4-posted': m4Results(), 'm5-attempt': m5Results('posted') } })
    createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    const response = makeResponse(); await handler(request({ method: 'POST', body: { caption: 'M5 caption.', slot_key: m5SlotKey, asset_id: 'website-launch', reference_key: m5Reference, owner_confirmation_token: ownerConfirmation() } }), response)
    expect(response.statusCode).toBe(409); expect(database.state.attemptInserts).toEqual([])
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
  })

  it('reconciles an unfinished slot without another upload or provider create-post call', async () => {
    const current = m5Attempt('processing')
    const database = createDatabase({ attempts: [current, legacyM4Attempt], resultRows: { 'm4-posted': m4Results(), 'm5-attempt': m5Results('processing') } })
    createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    globalThis.fetch.mockResolvedValueOnce(providerResponse(200, {
      id: 'bundle-post-1', status: 'POSTED', externalData: {
        LINKEDIN: { id: 'li-1', permalink: 'https://linkedin.test/post' }, FACEBOOK: { id: 'fb-1', permalink: 'https://facebook.test/post' }, INSTAGRAM: { id: 'ig-1', permalink: 'https://instagram.test/post' },
      },
    }))
    const response = makeResponse(); await handler(request(), response)
    expect(response.statusCode).toBe(200)
    expect(response.body.slots.find(slot => slot.slot_key === m5SlotKey).state).toBe('posted')
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/upload/') && options?.method === 'POST')).toHaveLength(0)
    expect(readFile).not.toHaveBeenCalled()
  })
})

describe('M6 missed-slot safety boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-09T17:00:00.000Z'))
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.BUNDLE_SOCIAL_API_KEY = 'bundle-key'
    process.env.BUNDLE_SOCIAL_TEAM_ID = 'team-1'
    createClientMock.mockReset(); readFile.mockReset(); globalThis.fetch = vi.fn()
  })

  afterEach(() => vi.useRealTimers())

  it('shows a missed Tuesday on Wednesday without creating an attempt, upload, or provider post', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    const response = makeResponse(); await handler(request(), response)
    expect(response.statusCode).toBe(200)
    expect(response.body.slots[0]).toMatchObject({ slot_key: m5SlotKey, state: 'missed' })
    expect(response.body.missed_slot_signal).toMatchObject({ state: 'owner_decision_required', slot_key: m5SlotKey })
    expect(database.state.attemptInserts).toEqual([])
    expect(database.state.resolutionInserts).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
  })

  it('requires the exact oldest missed-slot confirmation before Publish now can create an attempt', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts()
    const response = makeResponse(); await handler(request({ method: 'POST', body: {
      caption: 'Post B caption.', slot_key: m5PostBSlotKey, asset_id: 'bilingual-website', reference_key: m5PostBReference, owner_confirmation_token: ownerConfirmation(m5PostBSlotKey, 'bilingual-website'),
    } }), response)
    expect(response.statusCode).toBe(409)
    expect(database.state.attemptInserts).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
  })

  it('allows Publish now only through the existing exact slot and asset capability', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts(); readFile.mockResolvedValue(new Uint8Array([1, 2, 3]))
    globalThis.fetch
      .mockResolvedValueOnce(providerResponse(200, { id: 'm6-upload' }))
      .mockResolvedValueOnce(providerResponse(200, { id: 'm6-post', status: 'PROCESSING', externalData: {} }))
    const response = makeResponse(); await handler(request({ method: 'POST', body: {
      caption: 'M6 Publish now caption.', slot_key: m5SlotKey, asset_id: 'website-launch', reference_key: m5Reference, owner_confirmation_token: ownerConfirmation(),
    } }), response)
    expect(response.statusCode).toBe(202)
    expect(database.state.attemptInserts).toHaveLength(1)
    expect(database.state.attemptInserts[0]).toMatchObject({ marketing_slot_key: m5SlotKey, asset_id: 'website-launch' })
    expect(database.state.attemptInserts.some(attempt => attempt.marketing_slot_key === m5PostBSlotKey)).toBe(false)
  })

  it('moves the oldest missed slot internally, preserving its edited caption and creating zero provider requests', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client)
    const response = makeResponse(); await handler(request({ method: 'POST', body: {
      action: 'move', caption: 'Keep this edited caption.', slot_key: m5SlotKey, asset_id: 'website-launch', owner_confirmation_token: ownerConfirmation(),
    } }), response)
    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({ decision: 'move', occurrence_slot_key: m5SlotKey, target_slot_key: m5PostBSlotKey })
    expect(database.state.resolutionInserts).toEqual([expect.objectContaining({ action: 'move', asset_id: 'website-launch', caption: 'Keep this edited caption.', target_slot_key: m5PostBSlotKey })])
    expect(database.state.attemptInserts).toEqual([])
    expect(database.state.destinationInserts).toEqual([])
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(readFile).not.toHaveBeenCalled()
  })

  it('skips only the missed occurrence with zero provider requests and keeps the asset eligible', async () => {
    const database = createDatabase(); createClientMock.mockReturnValue(database.client)
    const response = makeResponse(); await handler(request({ method: 'POST', body: {
      action: 'skip', caption: 'Keep this edited caption.', slot_key: m5SlotKey, asset_id: 'website-launch', owner_confirmation_token: ownerConfirmation(),
    } }), response)
    expect(response.statusCode).toBe(200)
    expect(database.state.resolutionInserts).toEqual([expect.objectContaining({ action: 'skip', target_slot_key: null, asset_id: 'website-launch' })])
    expect(database.state.attemptInserts).toEqual([])
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('will not accept a second decision for a resolved occurrence and never creates a provider post on reload', async () => {
    const database = createDatabase({ resolutions: [m6Resolution()] }); createClientMock.mockReturnValue(database.client); queueVerifiedAccounts(); queueVerifiedAccounts()
    const decision = makeResponse(); await handler(request({ method: 'POST', body: {
      action: 'skip', caption: 'Edited M6 caption.', slot_key: m5SlotKey, asset_id: 'website-launch', owner_confirmation_token: ownerConfirmation(),
    } }), decision)
    const first = makeResponse(); const second = makeResponse()
    await handler(request(), first); await handler(request(), second)
    expect(decision.statusCode).toBe(409)
    expect(first.statusCode).toBe(200); expect(second.statusCode).toBe(200)
    expect(database.state.resolutionInserts).toEqual([])
    expect(database.state.attemptInserts).toEqual([])
    expect(globalThis.fetch.mock.calls.filter(([url, options]) => url.endsWith('/post') && options?.method === 'POST')).toHaveLength(0)
    expect(readFile).not.toHaveBeenCalled()
  })
})
