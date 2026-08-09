export const GOOGLE_SHEETS_WEBHOOK_TIMEOUT_MS = 12_000

export class GoogleSheetsWebhookTimeoutError extends Error {
  constructor(message = 'Google Sheet sync timed out.') {
    super(message)
    this.name = 'GoogleSheetsWebhookTimeoutError'
  }
}

export async function postGoogleSheetsWebhook({
  url,
  secret,
  payload,
  timeoutMs = GOOGLE_SHEETS_WEBHOOK_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
  logger = console,
}) {
  const controller = new AbortController()
  const startedAt = Date.now()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  logger.info('[client-portal-intake] Google Sheets request started', { timeoutMs })

  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, secret }),
      signal: controller.signal,
    })
    const result = await response.json().catch(() => null)

    logger.info('[client-portal-intake] Google Sheets request completed', {
      durationMs: Date.now() - startedAt,
      status: response.status,
    })

    return { response, result }
  } catch (error) {
    const durationMs = Date.now() - startedAt

    if (controller.signal.aborted || error?.name === 'AbortError') {
      logger.error('[client-portal-intake] Google Sheets request timed out', {
        durationMs,
        timeoutMs,
      })
      throw new GoogleSheetsWebhookTimeoutError()
    }

    logger.error('[client-portal-intake] Google Sheets request failed', {
      durationMs,
      message: error instanceof Error ? error.message : 'Unknown webhook error',
    })
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
