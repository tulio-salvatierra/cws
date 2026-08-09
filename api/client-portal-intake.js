/* global process */

import {
  GoogleSheetsWebhookTimeoutError,
  postGoogleSheetsWebhook,
} from '../server/google-sheets-webhook.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL || !process.env.GOOGLE_SHEETS_WEBHOOK_SECRET) {
    return res.status(500).json({
      ok: false,
      error: 'Missing Google Sheets webhook environment variables.',
    })
  }

  const payload = parseRequestBody(req.body)
  const event = payload.event || 'unknown'

  console.info('[client-portal-intake] request received', { event })

  try {
    const { response, result } = await postGoogleSheetsWebhook({
      url: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
      secret: process.env.GOOGLE_SHEETS_WEBHOOK_SECRET,
      payload,
    })

    if (!response.ok || result?.ok === false) {
      console.error('[client-portal-intake] Google Sheets rejected request', {
        event,
        status: response.status,
      })
      return res.status(502).json({
        ok: false,
        error: result?.error || 'Google Sheet sync failed',
      })
    }

    return res.status(200).json({ ok: true, result })
  } catch (error) {
    if (error instanceof GoogleSheetsWebhookTimeoutError) {
      return res.status(504).json({
        ok: false,
        error: 'Google Sheet sync timed out. Please try again.',
      })
    }

    console.error('[client-portal-intake] request failed', {
      event,
      message: error instanceof Error ? error.message : 'Unknown webhook error',
    })
    return res.status(502).json({
      ok: false,
      error: 'Google Sheet sync failed. Please try again.',
    })
  }
}

function parseRequestBody(body) {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }

  return body
}
