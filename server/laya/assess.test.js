/* global process */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { assessDraftSafely } from './assess'

afterEach(() => {
  delete process.env.LAYA_SERVICE_URL
  delete process.env.LAYA_SERVICE_TOKEN
  vi.unstubAllGlobals()
})

describe('assessDraftSafely', () => {
  it('does not call an unconfigured service', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const result = await assessDraftSafely({ topic: 'Topic', draft: 'Draft', brief: {} })

    expect(result).toEqual(expect.objectContaining({ available: false, status: 'not_configured', mode: 'shadow-only' }))
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns a valid advisory result from the configured private service', async () => {
    process.env.LAYA_SERVICE_URL = 'http://127.0.0.1:8765/assess'
    process.env.LAYA_SERVICE_TOKEN = 'test-token'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        mode: 'shadow-only',
        policy_version: 'cws-laya-shadow-v1',
        result: { answers: { forbidden_claim: { noul: 0.1 } } },
      }),
    }))

    const result = await assessDraftSafely({ topic: 'Topic', draft: 'Draft', brief: {} })

    expect(result).toEqual(expect.objectContaining({ available: true, mode: 'shadow-only' }))
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8765/assess', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
    }))
  })
})
