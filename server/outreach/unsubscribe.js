import { createOutreachClient, missingOutreachEnv, parseBody } from './shared.js'
import { suppressEmail } from './compliance.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  res.setHeader?.('Cache-Control', 'no-store')
  res.setHeader?.('Referrer-Policy', 'no-referrer')
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed' })
  if (missingOutreachEnv().length) return res.status(503).json({ ok: false, error: 'Unsubscribe is temporarily unavailable. Please try again.' })
  const input = req.method === 'GET' ? req.query || {} : parseBody(req.body)
  const token = input.token
  const subscriberId = input.subscriber_id
  if ((Boolean(token) === Boolean(subscriberId)) || (typeof (token || subscriberId) !== 'string' || !UUID.test(token || subscriberId || ''))) return res.status(400).json({ ok: false, error: 'Open the unsubscribe link from your email.' })
  const client = createOutreachClient()
  const legacy = Boolean(subscriberId)
  const result = await client.from(legacy ? 'mailing_list_subscribers' : 'outreach_email_preferences')
    .select('id, workspace_id, email').eq('id', token || subscriberId).maybeSingle()
  if (result.error) return res.status(503).json({ ok: false, error: 'Unsubscribe is temporarily unavailable. Please try again.' })
  if (!result.data) return res.status(400).json({ ok: false, error: 'This unsubscribe link is not valid.' })
  // A GET or link-preview visit never changes preferences.
  if (req.method === 'GET') return res.status(200).json({ ok: true })
  try {
    await suppressEmail(client, result.data.workspace_id, result.data.email, 'recipient_opt_out')
    return res.status(200).json({ ok: true, message: 'You are unsubscribed from all Cicero Web Studio marketing emails.' })
  } catch {
    return res.status(503).json({ ok: false, error: 'The opt-out could not be saved. Please try again.' })
  }
}
