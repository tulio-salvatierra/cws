import { authenticateOwner, missingOutreachEnv, parseBody } from './shared.js'
import { suppressEmail } from './compliance.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  if (missingOutreachEnv().length) return res.status(503).json({ ok: false, error: 'Email preferences are unavailable.' })
  const context = await authenticateOwner(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const body = parseBody(req.body)
  if (!body.lead_id) return res.status(400).json({ ok: false, error: 'Select a lead to record their opt-out.' })
  const lead = await context.client.from('leads').select('email').eq('workspace_id', context.workspaceId).eq('id', body.lead_id).maybeSingle()
  if (lead.error) return res.status(502).json({ ok: false, error: 'The lead could not be loaded.' })
  if (!lead.data?.email) return res.status(404).json({ ok: false, error: 'No email recipient was found.' })
  try {
    await suppressEmail(context.client, context.workspaceId, lead.data.email, 'owner_recorded_opt_out', context.user.id)
    return res.status(200).json({ ok: true })
  } catch (error) { return res.status(503).json({ ok: false, error: error.message }) }
}
