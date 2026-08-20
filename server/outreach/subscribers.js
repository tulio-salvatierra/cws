import {
  authenticateWorkspace,
  cleanText,
  missingOutreachEnv,
  parseBody,
} from './shared.js'

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing outreach environment variables: ${missing.join(', ')}` })
  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  if (req.method === 'GET') {
    const result = await context.client
      .from('mailing_list_subscribers')
      .select('id, email, name, source, subscribed_at, unsubscribed_at, created_at')
      .eq('workspace_id', context.workspaceId)
      .order('created_at', { ascending: false })
    return result.error
      ? res.status(502).json({ ok: false, error: result.error.message })
      : res.status(200).json({ ok: true, subscribers: result.data || [] })
  }

  const body = parseBody(req.body)
  const email = cleanText(body.email, 320)
  if (!email) return res.status(400).json({ ok: false, error: 'email is required.' })
  const inserted = await context.client.from('mailing_list_subscribers').insert({
    workspace_id: context.workspaceId,
    email,
    name: cleanText(body.name, 200) || null,
    source: cleanText(body.source, 200) || 'manual',
    created_by: context.user.id,
  }).select('id, email, name, source, subscribed_at, unsubscribed_at').single()
  return inserted.error
    ? res.status(400).json({ ok: false, error: inserted.error.message })
    : res.status(201).json({ ok: true, subscriber: inserted.data })
}
