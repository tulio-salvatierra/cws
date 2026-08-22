/* global process */

import { Buffer } from 'node:buffer'
import { Resend } from 'resend'
import { createOutreachClient, missingOutreachEnv } from './shared.js'

const STATUS_BY_EVENT = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.failed': 'failed',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv('RESEND_API_KEY', 'RESEND_WEBHOOK_SECRET')
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing outreach environment variables: ${missing.join(', ')}` })

  const payload = await readPayload(req)
  let event
  try {
    event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers: {
        id: req.headers?.['svix-id'],
        timestamp: req.headers?.['svix-timestamp'],
        signature: req.headers?.['svix-signature'],
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    })
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid Resend webhook signature.' })
  }

  const status = STATUS_BY_EVENT[event.type]
  const messageId = event.data?.email_id
  if (!status || !messageId) return res.status(200).json({ ok: true, ignored: true })
  const client = createOutreachClient()
  const send = await client
    .from('outreach_sends')
    .select('id, subscriber_id')
    .eq('resend_message_id', messageId)
    .maybeSingle()
  if (send.error) return res.status(502).json({ ok: false, error: send.error.message })
  if (!send.data) return res.status(200).json({ ok: true, ignored: true })

  const updated = await client.from('outreach_sends').update({ status }).eq('id', send.data.id)
  if (updated.error) return res.status(502).json({ ok: false, error: updated.error.message })

  if (['bounced', 'complained'].includes(status) && send.data.subscriber_id) {
    const suppressed = await client
      .from('mailing_list_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('id', send.data.subscriber_id)
      .is('unsubscribed_at', null)
    if (suppressed.error) return res.status(502).json({ ok: false, error: suppressed.error.message })
  }

  return res.status(200).json({ ok: true, suppressed: ['bounced', 'complained'].includes(status) && Boolean(send.data.subscriber_id) })
}

async function readPayload(req) {
  if (typeof req.body === 'string') return req.body
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8')
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}
