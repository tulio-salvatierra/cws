/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, assessDraftSafelyMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  assessDraftSafelyMock: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))
vi.mock('../../server/laya/assess.js', () => ({ assessDraftSafely: assessDraftSafelyMock }))

import handler from '../laya-assess'

function response() {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) }
  return res
}

function request(body, token = 'access-token') {
  return { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body }
}

function query(result) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

function database({ membership = { workspace_id: 'workspace-1' }, run = null } = {}) {
  const updates = []
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn((table) => {
      if (table === 'workspace_members') return query({ data: membership, error: null })
      if (table === 'agent_runs') {
        return {
          select: vi.fn(() => query({ data: run, error: null })),
          insert: vi.fn((value) => {
            updates.push(value)
            return query({ data: { id: 'run-1' }, error: null })
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
  }
  return { client, updates }
}

describe('Laya existing-draft assessment API', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    createClientMock.mockReset()
    assessDraftSafelyMock.mockReset()
  })

  afterEach(() => {
    delete process.env.GENERATION_SUPABASE_URL
    delete process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY
  })

  it('requires a signed-in user before database access', async () => {
    const res = response()
    await handler(request({ run_id: 'run-1' }, ''), res)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('assesses and persists a draft only inside the caller workspace', async () => {
    const run = {
      id: 'run-1',
      input: { topic: 'Clear messages', brief_snapshot: { audience: 'Owners' } },
      output: { draft_text: 'Practical draft.', model: 'gpt-test' },
    }
    const db = database({ run })
    createClientMock.mockReturnValue(db.client)
    const laya = { available: true, mode: 'shadow-only', policy_version: 'cws-laya-shadow-v1', result: { answers: {} } }
    assessDraftSafelyMock.mockResolvedValue(laya)
    const res = response()

    await handler(request({ run_id: 'run-1' }), res)

    expect(db.client.from).toHaveBeenCalledWith('workspace_members')
    expect(db.client.from).toHaveBeenCalledWith('agent_runs')
    expect(assessDraftSafelyMock).toHaveBeenCalledWith({
      topic: 'Clear messages',
      draft: 'Practical draft.',
      brief: { audience: 'Owners' },
    })
    expect(db.updates).toEqual([expect.objectContaining({ agent_key: 'laya-asset-assessment', command_level: 'ask', output: { laya }, input: expect.objectContaining({ source_run_id: 'run-1', draft_snapshot: 'Practical draft.' }) })])
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ ok: true, laya })
  })

  it('does not assess a run outside the caller workspace', async () => {
    const db = database({ run: null })
    createClientMock.mockReturnValue(db.client)
    const res = response()

    await handler(request({ run_id: 'other-workspace-run' }), res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(assessDraftSafelyMock).not.toHaveBeenCalled()
  })
})
