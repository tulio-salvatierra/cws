/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { waitUntilMock } = vi.hoisted(() => ({ waitUntilMock: vi.fn() }))

vi.mock('@vercel/functions', () => ({ waitUntil: waitUntilMock }))

import handler from '../client-portal-intake'
import { GOOGLE_SHEETS_WEBHOOK_TIMEOUT_MS } from '../../server/google-sheets-webhook'

function createResponse() {
  const response = {
    status: vi.fn(() => response),
    json: vi.fn(() => response),
  }
  return response
}

describe('client portal intake API', () => {
  beforeEach(() => {
    waitUntilMock.mockReset()
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = 'https://example.com/webhook'
    process.env.GOOGLE_SHEETS_WEBHOOK_SECRET = 'test-secret'
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    delete process.env.GOOGLE_SHEETS_WEBHOOK_URL
    delete process.env.GOOGLE_SHEETS_WEBHOOK_SECRET
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('queues the Google Sheets request and returns immediately', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ ok: true, rowId: 'row-1' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const response = createResponse()

    await handler({ method: 'POST', body: { event: 'client_intake.created' } }, response)

    expect(response.status).toHaveBeenCalledWith(202)
    expect(response.json).toHaveBeenCalledWith({
      ok: true,
      queued: true,
    })
    expect(waitUntilMock).toHaveBeenCalledTimes(1)
    await waitUntilMock.mock.calls[0][0]
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      event: 'client_intake.created',
      secret: 'test-secret',
    })
  })

  it('contains a background timeout without changing the accepted response', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        reject(error)
      })
    })))
    const response = createResponse()

    await handler({ method: 'POST', body: { event: 'client_intake.created' } }, response)

    expect(response.status).toHaveBeenCalledWith(202)
    expect(response.json).toHaveBeenCalledWith({ ok: true, queued: true })
    expect(waitUntilMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(GOOGLE_SHEETS_WEBHOOK_TIMEOUT_MS)
    await waitUntilMock.mock.calls[0][0]

    expect(console.error).toHaveBeenCalledWith(
      '[client-portal-intake] background sync timed out',
      { event: 'client_intake.created' },
    )
  })
})
