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
