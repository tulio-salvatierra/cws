import { createOutreachClient, missingOutreachEnv } from './shared.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing outreach environment variables: ${missing.join(', ')}` })
  const subscriberId = req.method === 'POST' ? req.body?.subscriber_id : req.query?.subscriber_id
  if (typeof subscriberId !== 'string' || !UUID.test(subscriberId)) return res.status(400).json({ ok: false, error: 'A valid subscriber_id is required.' })

  const result = await createOutreachClient()
    .from('mailing_list_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', subscriberId)
    .is('unsubscribed_at', null)
    .select('id, unsubscribed_at')
    .maybeSingle()

  if (result.error) return res.status(502).json({ ok: false, error: result.error.message })
  return res.status(200).json({ ok: true, unsubscribed: Boolean(result.data), subscriber: result.data || { id: subscriberId } })
}
