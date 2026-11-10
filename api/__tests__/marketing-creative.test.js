/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))

import handler from '../marketing-creative.js'

const requestId = '11111111-1111-4111-8111-111111111111'

function response() {
  const result = { statusCode: 200, body: null }
  result.status = vi.fn(status => { result.statusCode = status; return result })
  result.json = vi.fn(body => { result.body = body; return result })
  return result
}

function ownerClient(role = 'owner') {
  const membership = {
    select: vi.fn(() => membership),
    eq: vi.fn(() => membership),
    order: vi.fn(() => membership),
    limit: vi.fn(() => membership),
    maybeSingle: vi.fn().mockResolvedValue({ data: { workspace_id: 'workspace-1', role }, error: null }),
  }
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null }) },
    from: vi.fn(table => {
      if (table === 'workspace_members') return membership
      throw new Error(`Unexpected table: ${table}`)
    }),
  }
}

describe('Marketing creative server boundary', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://database.example.test'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
    process.env.OPENAI_API_KEY = 'test-openai-key'
    createClientMock.mockReset()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key]
    Object.assign(process.env, originalEnv)
  })

  it('requires authentication before any database or OpenAI operation', async () => {
    const result = response()
    await handler({ method: 'POST', headers: {}, body: { action: 'generate_story_ideas', offer_id: requestId, request_key: requestId } }, result)
    expect(result.statusCode).toBe(401)
    expect(createClientMock).not.toHaveBeenCalled()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('rejects a non-owner before it can prepare Marketing creative', async () => {
    createClientMock.mockReturnValue(ownerClient('member'))
    const result = response()
    await handler({ method: 'POST', headers: { authorization: 'Bearer access-token' }, body: { action: 'generate_story_ideas', offer_id: requestId, request_key: requestId } }, result)
    expect(result.statusCode).toBe(403)
    expect(result.body.error).toMatch(/workspace owner/i)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it.each(['assess_marketing_asset', 'review_laya_assessment'])('requires owner authority for %s', async action => {
    createClientMock.mockReturnValue(ownerClient('member'))
    const result = response()
    await handler({ method: 'POST', headers: { authorization: 'Bearer access-token' }, body: { action } }, result)
    expect(result.statusCode).toBe(403)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('fails closed when owner-triggered generation lacks server-side OpenAI configuration', async () => {
    delete process.env.OPENAI_API_KEY
    createClientMock.mockReturnValue(ownerClient())
    const result = response()
    await handler({ method: 'POST', headers: { authorization: 'Bearer access-token' }, body: { action: 'generate_story_ideas', offer_id: requestId, request_key: requestId } }, result)
    expect(result.statusCode).toBe(503)
    expect(result.body.error).toMatch(/server-side OpenAI configuration/i)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})

// Query-level fixtures exercise the actual HTTP handler and image processing;
// provider calls and storage are replaced so tests cannot publish or spend.
function scriptedClient(results) {
  const client = ownerClient()
  const calls = []
  const tables = { ...results }
  client.from = vi.fn(table => {
    if (table === 'workspace_members') return ownerClient().from(table)
    const call = { table, filters: [], values: null }
    calls.push(call)
    const query = {}
    for (const method of ['select', 'eq', 'contains', 'order', 'limit', 'insert', 'update']) {
      query[method] = vi.fn((...args) => {
        if (method === 'insert' || method === 'update') { call.operation = method; call.values = args[0] }
        if (method === 'eq' || method === 'contains') call.filters.push(args)
        return query
      })
    }
    const finish = () => {
      if (!tables[table]?.length) throw new Error(`Unexpected query for ${table}`)
      const next = tables[table].shift()
      return Promise.resolve(next?.error ? next : { data: next, error: null })
    }
    query.single = finish
    query.maybeSingle = finish
    query.then = (resolve, reject) => finish().then(resolve, reject)
    return query
  })
  const storage = { upload: vi.fn().mockResolvedValue({ error: null }), createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://private.example.test/image.jpg' } }) }
  client.storage = { from: vi.fn(() => storage) }
  return { client, calls, storage }
}

const ideaRun = { id: requestId, input: { offer_id: requestId }, output: { ideas: [1, 2, 3].map(n => ({ id: `idea-${n}`, title: 'A useful idea', hook: 'A hook', caption: 'A caption', visual_prompt: 'A studio desk', cta: 'Learn more' })) } }
const post = body => ({ method: 'POST', headers: { authorization: 'Bearer token' }, body })

describe('format-aware generation and approval', () => {
  beforeEach(() => {
    vi.stubEnv('GENERATION_SUPABASE_URL', 'https://database.example.test')
    vi.stubEnv('GENERATION_SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')
    vi.stubGlobal('fetch', vi.fn())
    createClientMock.mockReset()
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it('rejects an invalid platform/format before generation or storage', async () => {
    createClientMock.mockReturnValue(ownerClient())
    const res = response()
    await handler(post({ action: 'generate_visual_draft', format_id: 'linkedin-story' }), res)
    expect(res.statusCode).toBe(400)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('passes a supported size and destination brief, then stores validated JPEG bytes', async () => {
    const { default: sharp } = await import('sharp')
    const generated = await sharp({ create: { width: 144, height: 256, channels: 3, background: '#336699' } }).png().toBuffer()
    const asset = { id: requestId, workspace_id: 'workspace-1', format_id: 'instagram-story', storage_bucket: 'marketing-creative', storage_object_path: `generated/${requestId}/${requestId}.jpg`, status: 'ready' }
    const { client, calls, storage } = scriptedClient({ agent_runs: [ideaRun, null, { id: requestId }, { id: requestId }, { id: requestId }], offers: [{ id: requestId }], marketing_creative_assets: [asset, asset] })
    createClientMock.mockReturnValue(client)
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'response-1', output: [{ type: 'image_generation_call', result: generated.toString('base64') }] }) })
    const res = response()
    await handler(post({ action: 'generate_visual_draft', idea_run_id: requestId, idea_id: 'idea-1', request_key: requestId, format_id: 'instagram-story' }), res)
    expect(res.statusCode).toBe(201)
    const request = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(request.tools[0]).toMatchObject({ type: 'image_generation', model: 'gpt-image-2', size: '1152x2048', output_format: 'jpeg' })
    expect(JSON.parse(request.input).format).toMatchObject({ aspect_ratio: '9:16', export_width: 1080, export_height: 1920, intended_use: 'Instagram Story' })
    expect(request.store).toBe(false)
    const [path, bytes, options] = storage.upload.mock.calls[0]
    expect(path).toMatch(/\.jpg$/)
    expect(options).toEqual({ contentType: 'image/jpeg', upsert: false })
    expect(await sharp(bytes).metadata()).toMatchObject({ width: 1080, height: 1920, format: 'jpeg' })
    expect(calls.find(c => c.values?.status === 'ready').values.image_validation).toMatchObject({ format_id: 'instagram-story', padded: false, cropped: false })
    expect(calls.some(c => c.table === 'offer_media')).toBe(false)
  })


  it('remakes a padded ready Story using its private image reference, retaining the original object', async () => {
    const { default: sharp } = await import('sharp')
    const generated = await sharp({ create: { width: 144, height: 256, channels: 3, background: '#336699' } }).jpeg().toBuffer()
    const original = { id: requestId, asset_run_id: 'old-run', format_id: 'instagram-story', storage_bucket: 'marketing-creative', storage_object_path: 'generated/original.jpg', status: 'ready', image_validation: { padded: true } }
    const replacement = { ...original, asset_run_id: requestId, storage_object_path: 'generated/replacement.jpg' }
    const { client, calls, storage } = scriptedClient({ agent_runs: [ideaRun, null, { id: requestId }, { id: requestId }, { id: requestId }], offers: [{ id: requestId }], marketing_creative_assets: [{ error: { code: '23505' } }, original, replacement, replacement] })
    createClientMock.mockReturnValue(client)
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ output: [{ type: 'image_generation_call', result: generated.toString('base64') }] }) })
    const res = response()
    await handler(post({ action: 'generate_visual_draft', idea_run_id: requestId, idea_id: 'idea-1', request_key: requestId, format_id: 'instagram-story', regenerate: true }), res)
    expect(res.statusCode).toBe(201)
    const request = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(request.input[0].content[1]).toEqual({ type: 'input_image', image_url: 'https://private.example.test/image.jpg' })
    expect(request.input[0].content[0].text).toMatch(/Preserve the subject, pose/)
    expect(storage.createSignedUrl).toHaveBeenCalledWith(original.storage_object_path, 300)
    expect(storage.upload.mock.calls[0][0]).toBe(replacement.storage_object_path)
    expect(calls.find(c => c.values?.status === 'needs_review').values.output.source_storage_object_path).toBe(original.storage_object_path)
  })

  it('restores the original padded draft when a remake fails', async () => {
    const original = { id: requestId, asset_run_id: 'old-run', format_id: 'instagram-story', storage_bucket: 'marketing-creative', storage_object_path: 'generated/original.jpg', status: 'ready', image_validation: { padded: true } }
    const { client, calls } = scriptedClient({ agent_runs: [ideaRun, null, { id: requestId }, { id: requestId }, { id: requestId }], offers: [{ id: requestId }], marketing_creative_assets: [{ error: { code: '23505' } }, original, { ...original, asset_run_id: requestId }, original] })
    createClientMock.mockReturnValue(client)
    globalThis.fetch.mockRejectedValue(new Error('Provider unavailable'))
    const res = response()
    await handler(post({ action: 'generate_visual_draft', idea_run_id: requestId, idea_id: 'idea-1', request_key: requestId, format_id: 'instagram-story', regenerate: true }), res)
    expect(res.statusCode).toBe(502)
    expect(calls.find(c => c.values?.status === 'ready').values).toMatchObject({ asset_run_id: 'old-run', storage_object_path: original.storage_object_path, image_validation: original.image_validation })
  })

  it('does not upload corrupt output and records a retryable failure', async () => {
    const asset = { id: requestId, storage_object_path: `generated/${requestId}/${requestId}.jpg` }
    const { client, storage, calls } = scriptedClient({ agent_runs: [ideaRun, null, { id: requestId }, { id: requestId }, { id: requestId }], offers: [{ id: requestId }], marketing_creative_assets: [asset, asset] })
    createClientMock.mockReturnValue(client)
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ output: [{ type: 'image_generation_call', result: 'bm90LWFuLWltYWdl' }] }) })
    const res = response()
    await handler(post({ action: 'generate_visual_draft', idea_run_id: requestId, idea_id: 'idea-1', request_key: requestId, format_id: 'facebook-feed-square' }), res)
    expect(res.statusCode).toBe(502)
    expect(storage.upload).not.toHaveBeenCalled()
    expect(calls.some(c => c.values?.status === 'failed')).toBe(true)
  })

  it('rejects reuse of a request key for another format', async () => {
    const { client } = scriptedClient({ agent_runs: [ideaRun, { id: requestId, input: { idea_run_id: requestId, idea_id: 'idea-1', format_id: 'instagram-story' } }], offers: [{ id: requestId }] })
    createClientMock.mockReturnValue(client)
    const res = response()
    await handler(post({ action: 'generate_visual_draft', idea_run_id: requestId, idea_id: 'idea-1', request_key: requestId, format_id: 'facebook-feed-square' }), res)
    expect(res.statusCode).toBe(409)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('approves a validated feed JPEG into the existing library without publishing', async () => {
    const asset = { id: requestId, offer_id: requestId, asset_run_id: requestId, format_id: 'facebook-feed-square', storage_bucket: 'marketing-creative', storage_object_path: `generated/${requestId}/${requestId}.jpg`, image_validation: { version: 1, format_id: 'facebook-feed-square', width: 1080, height: 1080, mime_type: 'image/jpeg', byte_length: 50000 } }
    const { client, calls } = scriptedClient({ marketing_creative_assets: [asset, { ...asset, status: 'approved' }], offer_media: [{ id: requestId }], offer_captions: [{ id: requestId }] })
    createClientMock.mockReturnValue(client)
    const res = response()
    await handler(post({ action: 'approve_visual_draft', creative_asset_id: requestId, caption: 'A caption', linkedin_compatible: true, facebook_compatible: true, instagram_compatible: true }), res)
    expect(res.statusCode).toBe(200)
    expect(calls.find(c => c.table === 'offer_media').values).toMatchObject({ storage_object_path: asset.storage_object_path, media_source: 'generated', status: 'active' })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('retries only the failed variant and allocates a fresh JPEG path', async () => {
    const asset = { id: requestId, status: 'failed', format_id: 'facebook-story', storage_object_path: `generated/${requestId}/${requestId}.jpg` }
    const { client, calls } = scriptedClient({ agent_runs: [ideaRun, null, { id: requestId }, { id: requestId }, { id: requestId }], offers: [{ id: requestId }], marketing_creative_assets: [{ error: { code: '23505' } }, asset, asset, asset] })
    createClientMock.mockReturnValue(client)
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ output: [] }) })
    const res = response()
    await handler(post({ action: 'generate_visual_draft', idea_run_id: requestId, idea_id: 'idea-1', request_key: requestId, format_id: 'facebook-story' }), res)
    expect(calls.filter(c => c.table === 'marketing_creative_assets')[1].filters).toContainEqual(['format_id', 'facebook-story'])
    const retry = calls.find(c => c.operation === 'update' && c.values?.status === 'generating')
    expect(retry.values.storage_object_path).not.toBe(asset.storage_object_path)
    expect(retry.values).toMatchObject({ format_id: 'facebook-story', image_validation: null })
    expect(retry.filters).toContainEqual(['status', 'failed'])
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it.each(['instagram-story', 'facebook-reel-cover', 'linkedin-feed-landscape', 'instagram-feed-square'])('prevents unsafe approval of %s', async formatId => {
    const asset = { id: requestId, format_id: formatId, storage_object_path: `generated/${requestId}/${requestId}.jpg`, image_validation: null }
    const { client, calls } = scriptedClient({ marketing_creative_assets: [asset, asset] })
    createClientMock.mockReturnValue(client)
    const res = response()
    await handler(post({ action: 'approve_visual_draft', creative_asset_id: requestId, caption: 'A caption', linkedin_compatible: true, facebook_compatible: true, instagram_compatible: true }), res)
    expect(res.statusCode).toBe(502)
    expect(calls.some(c => c.table === 'offer_media')).toBe(false)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
