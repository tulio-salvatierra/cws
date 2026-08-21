/* global process */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))

import handler from '../outreach'

const subscriberId = '5d1d30a8-2a70-446e-8dd2-91121268236b'

function response() {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) }
  return res
}

function client(result) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    is: vi.fn(() => query),
    select: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  createClientMock.mockReturnValue({ from: vi.fn(() => query) })
  return query
}

describe('public unsubscribe route', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    createClientMock.mockReset()
  })

  it('rejects malformed subscriber ids', async () => {
    const res = response()
    await handler({ method: 'GET', query: { path: ['unsubscribe'], subscriber_id: 'bad' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('records an unsubscribe idempotently', async () => {
    const query = client({ data: { id: subscriberId, unsubscribed_at: '2026-08-21T20:00:00Z' }, error: null })
    const res = response()
    await handler({ method: 'GET', query: { path: ['unsubscribe'], subscriber_id: subscriberId } }, res)
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ unsubscribed_at: expect.any(String) }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, unsubscribed: true }))
  })
})
