import { afterEach, expect, it, vi } from 'vitest'
import { assessDraftSafely } from './assess.js'
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
it('does not call a model without both server credentials', async () => {
  vi.stubEnv('LAYA_SERVICE_URL', '')
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  expect(await assessDraftSafely({})).toMatchObject({ available: false, status: 'not_configured' })
  expect(fetch).not.toHaveBeenCalled()
})
it.each([{}, { mode: 'shadow-only', policy_version: 'cws-laya-shadow-v1', result: { answers: {} } }])('fails safely on invalid model output', async payload => {
  vi.stubEnv('LAYA_SERVICE_URL', 'https://laya.example/assess')
  vi.stubEnv('LAYA_SERVICE_TOKEN', 'secret')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }))
  expect(await assessDraftSafely({ topic: 'test', draft: 'test', brief: {} })).toMatchObject({ available: false, status: 'unavailable' })
})
it('keeps structured model scores advisory and sends the exact brief snapshot', async () => {
  vi.stubEnv('LAYA_SERVICE_URL', 'https://laya.example/assess')
  vi.stubEnv('LAYA_SERVICE_TOKEN', 'secret')
  const payload = { mode: 'shadow-only', policy_version: 'cws-laya-shadow-v1', result: { answers: { forbidden_claim: { noul: 0.62 }, brief_fit: { score: 2.44 }, review_priority: { choice: 'review', confidence: 0.02 } } } }
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => payload })
  vi.stubGlobal('fetch', fetch)
  expect(await assessDraftSafely({ topic: 'test', draft: 'text', brief: { version: 1 } })).toEqual({ ...payload, available: true })
  expect(JSON.parse(fetch.mock.calls[0][1].body).state.channel_brief).toEqual({ version: 1 })
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer secret')
})
