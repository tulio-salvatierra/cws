import { authenticateWorkspace, cleanText, missingOutreachEnv } from '../lib/outreach.js'

const TYPES = ['intro', 'follow_up', 'cold']

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing outreach environment variables: ${missing.join(', ')}` })
  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const type = cleanText(req.query?.type, 32)
  if (type && !TYPES.includes(type)) return res.status(400).json({ ok: false, error: 'type must be intro, follow_up, or cold.' })
  let query = context.client.from('email_templates').select('id, name, type, lang, subject, body').eq('workspace_id', context.workspaceId).eq('lang', 'en').order('name')
  if (type) query = query.eq('type', type)
  const result = await query
  return result.error
    ? res.status(502).json({ ok: false, error: result.error.message })
    : res.status(200).json({ ok: true, templates: result.data || [] })
}
