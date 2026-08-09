/* global process */

import { waitUntil } from '@vercel/functions'
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

  const syncPromise = (async () => {
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
        return
      }

      console.info('[client-portal-intake] Google Sheets sync completed', {
        event,
        status: response.status,
      })
    } catch (error) {
      if (error instanceof GoogleSheetsWebhookTimeoutError) {
        console.error('[client-portal-intake] background sync timed out', { event })
        return
      }

      console.error('[client-portal-intake] background sync failed', {
        event,
        message: error instanceof Error ? error.message : 'Unknown webhook error',
      })
    }
  })()

  waitUntil(syncPromise)

  return res.status(202).json({ ok: true, queued: true })
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
