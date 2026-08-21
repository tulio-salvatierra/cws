/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))

import handler from '../generate-draft'

function createResponse() {
  const response = {
    status: vi.fn(() => response),
    json: vi.fn(() => response),
  }
  return response
}

function request(body = {}, token = 'access-token') {
  return {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  }
}

function createQuery(result) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

function createDatabase({ membership = { workspace_id: 'workspace-1' } } = {}) {
  const inserts = []
  const updates = []
  const records = {
    workspace_members: membership,
    channels: {
      id: 'channel-1',
      workspace_id: 'workspace-1',
      name: 'Cicero Web Studio',
      slug: 'cicero-web-studio',
    },
    channel_brief: {
      id: 'brief-1',
      workspace_id: 'workspace-1',
      channel_id: 'channel-1',
      language: 'en',
      version: 1,
      audience: 'Local business owners',
      geography: 'Chicago',
      tone: 'Clear and practical',
      topics_allowed: ['websites'],
      topics_forbidden: ['guarantees'],
      cta: 'Book a discovery call',
      example_good: 'A clear practical example.',
      example_bad: 'A vague hype-heavy example.',
      target_cadence_days: 7,
    },
  }
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    from: vi.fn((table) => {
      if (table !== 'agent_runs') {
        return createQuery({ data: records[table] || null, error: null })
      }
      return {
        insert: vi.fn((payload) => {
          inserts.push(payload)
          return createQuery({ data: { id: 'run-1' }, error: null })
        }),
        update: vi.fn((payload) => {
          updates.push(payload)
          return createQuery({ data: null, error: null })
        }),
      }
    }),
  }
  return { client, inserts, updates }
}

describe('non-publishing draft generation API', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.OPENAI_API_KEY = 'openai-key'
    createClientMock.mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    delete process.env.GENERATION_SUPABASE_URL
    delete process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.OPENAI_GENERATION_MODEL
    vi.unstubAllGlobals()
  })

  it('rejects a request without a signed-in session token', async () => {
    const response = createResponse()
    await handler(request({ topic: 'A useful topic' }, ''), response)
    expect(response.status).toHaveBeenCalledWith(401)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('rejects an authenticated user without an active workspace membership', async () => {
    const database = createDatabase({ membership: null })
    createClientMock.mockReturnValue(database.client)
    const response = createResponse()

    await handler(request({ topic: 'A useful topic' }), response)

    expect(response.status).toHaveBeenCalledWith(403)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('generates one brief-grounded proposal and records it for review', async () => {
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client)
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'response-1',
        model: 'gpt-5.6',
        output: [{
          type: 'message',
          content: [{ type: 'output_text', text: 'Clear websites help customers act.' }],
        }],
      }),
    })
    const response = createResponse()

    await handler(request({
      channel_slug: 'cicero-web-studio',
      language: 'en',
      topic: 'Clear website messaging',
    }), response)

    expect(response.status).toHaveBeenCalledWith(201)
    expect(database.inserts).toEqual([expect.objectContaining({
      workspace_id: 'workspace-1',
      command_level: 'propose',
      agent_key: 'channel-draft-generator',
      status: 'queued',
      input: expect.objectContaining({
        brief_id: 'brief-1',
        brief_version: 1,
        brief_snapshot: expect.objectContaining({ audience: 'Local business owners' }),
      }),
      created_by: 'user-1',
    })])
    expect(database.updates[0]).toEqual({ status: 'running' })
    expect(database.updates[1]).toEqual(expect.objectContaining({
      status: 'needs_review',
      output: expect.objectContaining({
        draft_text: 'Clear websites help customers act.',
        brief_id: 'brief-1',
        brief_version: 1,
      }),
    }))
    const openAiRequest = JSON.parse(fetch.mock.calls[0][1].body)
    expect(openAiRequest).toEqual(expect.objectContaining({
      model: 'gpt-5.6',
      store: false,
      reasoning: { effort: 'low' },
    }))
    expect(openAiRequest).not.toHaveProperty('tools')
  })

  it('records a failed run when OpenAI rejects the generation request', async () => {
    const database = createDatabase()
    createClientMock.mockReturnValue(database.client)
    fetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: { message: 'Model request failed.' } }),
    })
    const response = createResponse()

    await handler(request({ topic: 'Clear website messaging' }), response)

    expect(response.status).toHaveBeenCalledWith(502)
    expect(database.updates.at(-1)).toEqual({
      status: 'failed',
      output: null,
      error_message: 'Model request failed.',
    })
  })
})
