import { authenticateOwner, createSalesConfirmationToken, interpolateTemplate, missingOutreachEnv, parseBody } from './shared.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing outreach environment variables: ${missing.join(', ')}` })
  const context = await authenticateOwner(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const body = parseBody(req.body)
  if (!body.lead_id || !body.template_id) return res.status(400).json({ ok: false, error: 'lead_id and template_id are required.' })
  const [leadResult, templateResult] = await Promise.all([
    context.client.from('leads').select('id, name, email, company, status').eq('id', body.lead_id).eq('workspace_id', context.workspaceId).maybeSingle(),
    context.client.from('email_templates').select('id, type, subject, body').eq('id', body.template_id).eq('workspace_id', context.workspaceId).eq('lang', 'en').maybeSingle(),
  ])
  if (leadResult.error || templateResult.error) return res.status(502).json({ ok: false, error: (leadResult.error || templateResult.error).message })
  if (!leadResult.data || !templateResult.data) return res.status(404).json({ ok: false, error: 'Lead or template not found.' })
  if (!leadResult.data.email) return res.status(409).json({ ok: false, error: 'This phone-only lead has no verified email for an outreach draft.' })
  const subject = interpolateTemplate(body.subject || templateResult.data.subject, leadResult.data)
  const message = interpolateTemplate(body.body || templateResult.data.body, leadResult.data)
  return res.status(200).json({ ok: true, lead: leadResult.data, template: { id: templateResult.data.id, type: templateResult.data.type }, subject, body: message, owner_confirmation_token: createSalesConfirmationToken(context, { leadId: leadResult.data.id, recipient: leadResult.data.email, templateId: templateResult.data.id, sendType: templateResult.data.type, subject, body: message }) })
}
