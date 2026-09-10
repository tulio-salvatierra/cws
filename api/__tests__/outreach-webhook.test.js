/* global process */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, verifyMock } = vi.hoisted(() => ({ createClientMock: vi.fn(), verifyMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))
vi.mock('resend', () => ({ Resend: function Resend() { return { webhooks: { verify: verifyMock } } } }))
import handler from '../outreach-webhook.js'

function response() { const res = { status: vi.fn(() => res), json: vi.fn(() => res) }; return res }
function query(result) { const q = { select: vi.fn(() => q), update: vi.fn(() => q), eq: vi.fn(() => q), is: vi.fn(() => q), maybeSingle: vi.fn(() => Promise.resolve(result)) }; q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject); return q }
describe('Resend outreach webhook', () => {
  beforeEach(() => { process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'; process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service'; process.env.RESEND_API_KEY = 'key'; process.env.RESEND_WEBHOOK_SECRET = 'secret'; verifyMock.mockReset(); createClientMock.mockReset() })
  it.each(['email.bounced', 'email.complained'])('suppresses a subscriber after %s', async (type) => {
    verifyMock.mockReturnValue({ type, data: { email_id: 'message' } }); const send = query({ data: { id: 'send', subscriber_id: 'subscriber' }, error: null }); const update = query({ data: null, error: null }); const subscriber = query({ data: null, error: null }); createClientMock.mockReturnValue({ from: vi.fn().mockReturnValueOnce(send).mockReturnValueOnce(update).mockReturnValueOnce(subscriber) }); const res = response(); await handler({ method: 'POST', body: '{}', headers: { 'svix-id': 'id', 'svix-timestamp': 'now', 'svix-signature': 'sig' } }, res); expect(subscriber.update).toHaveBeenCalledWith({ unsubscribed_at: expect.any(String) }); expect(res.json).toHaveBeenCalledWith({ ok: true, suppressed: true })
  })

  it('records a delivered event without suppressing the recipient', async () => {
    verifyMock.mockReturnValue({ type: 'email.delivered', data: { email_id: 'message' } })
    const send = query({ data: { id: 'send', subscriber_id: 'subscriber' }, error: null })
    const update = query({ data: null, error: null })
    createClientMock.mockReturnValue({ from: vi.fn().mockReturnValueOnce(send).mockReturnValueOnce(update) })
    const res = response()

    await handler({ method: 'POST', body: '{}', headers: { 'svix-id': 'id', 'svix-timestamp': 'now', 'svix-signature': 'sig' } }, res)

    expect(update.update).toHaveBeenCalledWith({ status: 'delivered' })
    expect(res.json).toHaveBeenCalledWith({ ok: true, suppressed: false })
  })
})
