/* global process */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, verifyMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  verifyMock: vi.fn(),
}))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))
vi.mock('resend', () => ({ Resend: function Resend() { return { webhooks: { verify: verifyMock } } } }))

import handler from '../outreach-webhook'

const subscriberId = '5d1d30a8-2a70-446e-8dd2-91121268236b'

function response() {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) }
  return res
}

function query(result) {
  const current = {
    select: vi.fn(() => current),
    update: vi.fn(() => current),
    eq: vi.fn(() => current),
    is: vi.fn(() => current),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  }
  current.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return current
}

describe('Resend outreach webhook', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_test'
    verifyMock.mockReset()
    createClientMock.mockReset()
  })

  it('suppresses a mailing-list subscriber after a bounce', async () => {
    verifyMock.mockReturnValue({ type: 'email.bounced', data: { email_id: 'msg_123' } })
    const sendQuery = query({ data: { id: 'send-1', subscriber_id: subscriberId }, error: null })
    const statusQuery = query({ data: null, error: null })
    const subscriberQuery = query({ data: null, error: null })
    const fromMock = vi.fn()
      .mockReturnValueOnce(sendQuery)
      .mockReturnValueOnce(statusQuery)
      .mockReturnValueOnce(subscriberQuery)
    createClientMock.mockReturnValue({
      from: fromMock,
    })

    const res = response()
    await handler({
      method: 'POST',
      body: '{}',
      headers: { 'svix-id': 'id', 'svix-timestamp': 'now', 'svix-signature': 'sig' },
    }, res)

    expect(statusQuery.update).toHaveBeenCalledWith({ status: 'bounced' })
    expect(subscriberQuery.update).toHaveBeenCalledWith({ unsubscribed_at: expect.any(String) })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ ok: true, suppressed: true })
  })

  it('does not suppress a lead delivery event', async () => {
    verifyMock.mockReturnValue({ type: 'email.delivered', data: { email_id: 'msg_456' } })
    const sendQuery = query({ data: { id: 'send-2', subscriber_id: null }, error: null })
    const statusQuery = query({ data: null, error: null })
    const fromMock = vi.fn()
      .mockReturnValueOnce(sendQuery)
      .mockReturnValueOnce(statusQuery)
    createClientMock.mockReturnValue({
      from: fromMock,
    })

    const res = response()
    await handler({
      method: 'POST',
      body: '{}',
      headers: { 'svix-id': 'id', 'svix-timestamp': 'now', 'svix-signature': 'sig' },
    }, res)

    expect(statusQuery.update).toHaveBeenCalledWith({ status: 'delivered' })
    expect(res.json).toHaveBeenCalledWith({ ok: true, suppressed: false })
  })
})
