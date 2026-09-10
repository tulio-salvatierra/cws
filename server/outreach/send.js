import { getFromEmail, sendResendEmail } from '../../api/lib/resend.js'
import { authenticateOwner, cleanText, draftHash, missingOutreachEnv, parseBody, validSalesConfirmationToken } from './shared.js'

const SEND_TYPES = ['intro', 'follow_up', 'cold']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv('RESEND_API_KEY', 'RESEND_FROM_EMAIL')
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing outreach environment variables: ${missing.join(', ')}` })
  const context = await authenticateOwner(req)
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
  if (!leadResult.data.email) return res.status(409).json({ ok: false, error: 'This phone-only lead has no verified email to send.' })
  if (templateResult.data.type !== body.send_type) return res.status(400).json({ ok: false, error: 'send_type must match the selected template.' })
  const values = { leadId: leadResult.data.id, recipient: leadResult.data.email, templateId: templateResult.data.id, sendType: body.send_type, subject, body: message }
  if (!validSalesConfirmationToken(body.owner_confirmation_token, context, values)) return res.status(403).json({ ok: false, error: 'This owner confirmation is expired, invalid, or bound to a different Sales draft.' })
  const suppressed = await context.client.from('outreach_sends').select('id').eq('workspace_id', context.workspaceId).eq('lead_id', leadResult.data.id).in('status', ['bounced', 'complained']).limit(1)
  if (suppressed.error) return res.status(502).json({ ok: false, error: suppressed.error.message })
  if (suppressed.data?.length) return res.status(409).json({ ok: false, error: 'This lead is suppressed after a bounce or complaint.' })
  const idempotencyKey = `sales/${context.workspaceId}/${leadResult.data.id}/${templateResult.data.id}/${body.send_type}/${draftHash(subject, message)}`
  const existing = await context.client.from('outreach_sends').select('id, status, resend_message_id, sent_at').eq('workspace_id', context.workspaceId).eq('idempotency_key', idempotencyKey).maybeSingle()
  if (existing.error) return res.status(502).json({ ok: false, error: existing.error.message })
  if (existing.data) return res.status(200).json({ ok: true, duplicate: true, send: existing.data })

  const sendValues = {
    workspace_id: context.workspaceId,
    lead_id: leadResult.data.id,
    template_id: templateResult.data.id,
    send_type: body.send_type,
    to_email: leadResult.data.email,
    subject,
    status: 'queued', idempotency_key: idempotencyKey, draft_hash: draftHash(subject, message),
    created_by: context.user.id,
  }
  const recorded = await context.client.from('outreach_sends').insert(sendValues).select('id, status, resend_message_id, sent_at').single()
  if (recorded.error?.code === '23505') { const duplicate = await context.client.from('outreach_sends').select('id, status, resend_message_id, sent_at').eq('workspace_id', context.workspaceId).eq('idempotency_key', idempotencyKey).maybeSingle(); return duplicate.error ? res.status(502).json({ ok: false, error: duplicate.error.message }) : res.status(200).json({ ok: true, duplicate: true, send: duplicate.data }) }
  if (recorded.error) return res.status(502).json({ ok: false, error: recorded.error.message })
  const sent = await sendResendEmail({ from: getFromEmail(), to: [leadResult.data.email], subject, text: message }, { idempotencyKey })
  const sentAt = sent.error ? null : new Date().toISOString()
  const finalized = await context.client.from('outreach_sends').update({ status: sent.error ? 'failed' : 'sent', resend_message_id: sent.data?.id || null, sent_at: sentAt, error_message: sent.error?.message || null }).eq('id', recorded.data.id).select('id, status, resend_message_id, sent_at').single()
  if (finalized.error) return res.status(502).json({ ok: false, error: 'Email outcome requires reconciliation before any retry.', send: recorded.data })
  if (sent.error) return res.status(502).json({ ok: false, error: sent.error.message || 'Resend outreach failed.', send: finalized.data })

  if (leadResult.data.status === 'new') {
    const updated = await context.client.from('leads').update({ status: 'contacted', last_contacted_at: sentAt }).eq('id', leadResult.data.id).eq('workspace_id', context.workspaceId).eq('status', 'new')
    if (updated.error) return res.status(502).json({ ok: false, error: updated.error.message })
  }
  return res.status(201).json({ ok: true, send: finalized.data })
}
