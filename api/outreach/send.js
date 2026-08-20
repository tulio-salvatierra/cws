import { getFromEmail, sendResendEmail } from '../lib/resend.js'
import { authenticateWorkspace, cleanText, missingOutreachEnv, parseBody } from '../lib/outreach.js'

const SEND_TYPES = ['intro', 'follow_up', 'cold']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv('RESEND_API_KEY', 'RESEND_FROM_EMAIL')
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing outreach environment variables: ${missing.join(', ')}` })
  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  const body = parseBody(req.body)
  const subject = cleanText(body.subject, 500)
  const message = cleanText(body.body, 20000)
  if (!body.lead_id || !body.template_id || !SEND_TYPES.includes(body.send_type) || !subject || !message) {
    return res.status(400).json({ ok: false, error: 'lead_id, template_id, send_type, subject, and body are required.' })
  }

  const [leadResult, templateResult] = await Promise.all([
    context.client.from('leads').select('id, email, status').eq('id', body.lead_id).eq('workspace_id', context.workspaceId).maybeSingle(),
    context.client.from('email_templates').select('id, type').eq('id', body.template_id).eq('workspace_id', context.workspaceId).eq('lang', 'en').maybeSingle(),
  ])
  if (leadResult.error || templateResult.error) return res.status(502).json({ ok: false, error: (leadResult.error || templateResult.error).message })
  if (!leadResult.data || !templateResult.data) return res.status(404).json({ ok: false, error: 'Lead or template not found.' })
  if (templateResult.data.type !== body.send_type) return res.status(400).json({ ok: false, error: 'send_type must match the selected template.' })

  const sent = await sendResendEmail({
    from: getFromEmail(),
    to: [leadResult.data.email],
    subject,
    text: message,
  }, { idempotencyKey: `outreach/${body.lead_id}/${body.template_id}/${Date.now()}` })

  const sendValues = {
    workspace_id: context.workspaceId,
    lead_id: leadResult.data.id,
    template_id: templateResult.data.id,
    send_type: body.send_type,
    to_email: leadResult.data.email,
    subject,
    status: sent.error ? 'failed' : 'sent',
    resend_message_id: sent.data?.id || null,
    sent_at: sent.error ? null : new Date().toISOString(),
    created_by: context.user.id,
  }
  const recorded = await context.client.from('outreach_sends').insert(sendValues).select('id, status, resend_message_id, sent_at').single()
  if (recorded.error) return res.status(502).json({ ok: false, error: recorded.error.message })
  if (sent.error) return res.status(502).json({ ok: false, error: sent.error.message || 'Resend outreach failed.', send: recorded.data })

  if (leadResult.data.status === 'new') {
    const updated = await context.client.from('leads').update({ status: 'contacted', last_contacted_at: sendValues.sent_at }).eq('id', leadResult.data.id).eq('workspace_id', context.workspaceId).eq('status', 'new')
    if (updated.error) return res.status(502).json({ ok: false, error: updated.error.message })
  }
  return res.status(201).json({ ok: true, send: recorded.data })
}
