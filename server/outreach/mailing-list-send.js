import { getFromEmail, sendResendEmail } from '../../api/lib/resend.js'
import { authenticateOwner, createSalesConfirmationToken, draftHash, interpolateTemplate, missingOutreachEnv, parseBody, validSalesConfirmationToken } from './shared.js'
import { commercialBody, emailPreference, isEmailSuppressed, postalAddress, validCommercialBody } from './compliance.js'

const MAX_RECIPIENTS = 100

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  if (missingOutreachEnv('RESEND_API_KEY', 'RESEND_FROM_EMAIL').length) return res.status(503).json({ ok: false, error: 'Commercial email is unavailable.' })
  const context = await authenticateOwner(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const body = parseBody(req.body)
  const preparing = body.action === 'prepare'
  if (!preparing && body.action !== 'send') return res.status(400).json({ ok: false, error: 'Prepare and review the exact recipient drafts before confirming a mailing-list send.' })
  const drafts = Array.isArray(body.drafts) ? body.drafts : []
  if (drafts.some((draft) => !draft || typeof draft !== 'object')) return res.status(400).json({ ok: false, error: 'Review valid recipient drafts before sending.' })
  const ids = preparing ? body.subscriber_ids : drafts.map((draft) => draft.subscriber_id)
  if (!body.template_id || !Array.isArray(ids) || !ids.length || ids.length > MAX_RECIPIENTS || ids.some((id) => typeof id !== 'string') || new Set(ids).size !== ids.length) return res.status(400).json({ ok: false, error: 'Select a template and 1–100 distinct recipients.' })
  const [templateResult, subscribersResult] = await Promise.all([
    context.client.from('email_templates').select('id, subject, body').eq('id', body.template_id).eq('workspace_id', context.workspaceId).eq('lang', 'en').eq('type', 'mailing_list').maybeSingle(),
    context.client.from('mailing_list_subscribers').select('id, email, name').eq('workspace_id', context.workspaceId).is('unsubscribed_at', null).in('id', ids),
  ])
  if (templateResult.error || subscribersResult.error) return res.status(502).json({ ok: false, error: 'Mailing-list recipients could not be checked.' })
  if (!templateResult.data || subscribersResult.data?.length !== ids.length) return res.status(409).json({ ok: false, error: 'A template or eligible recipient was not found.' })
  const reviewed = []
  try {
    postalAddress()
    // Validate the complete batch before reserving or sending any email.
    for (const subscriber of subscribersResult.data) {
      const preference = await emailPreference(context.client, context.workspaceId, subscriber.email)
      if (preference.unsubscribed_at) return res.status(409).json({ ok: false, error: 'A recipient has opted out of marketing email.' })
      const draft = preparing ? {
        subject: interpolateTemplate(templateResult.data.subject, subscriber),
        body: commercialBody(interpolateTemplate(templateResult.data.body, subscriber), preference),
      } : drafts.find((entry) => entry.subscriber_id === subscriber.id)
      if (typeof draft.subject !== 'string' || !draft.subject.trim() || draft.subject.length > 500 || /{{[^}]+}}/.test(draft.subject) || !validCommercialBody(draft.body, preference)) return res.status(400).json({ ok: false, error: 'Review complete mailing-list drafts and their commercial footers.' })
      const values = { leadId: subscriber.id, recipient: subscriber.email, templateId: body.template_id, sendType: 'mailing_list', subject: draft.subject, body: draft.body }
      if (!preparing && !validSalesConfirmationToken(draft.owner_confirmation_token, context, values)) return res.status(403).json({ ok: false, error: 'Review the exact mailing-list recipient and draft again before confirming.' })
      reviewed.push({ subscriber, values, owner_confirmation_token: preparing ? createSalesConfirmationToken(context, values) : draft.owner_confirmation_token })
    }
    if (preparing) return res.status(200).json({ ok: true, drafts: reviewed.map(({ subscriber, values, owner_confirmation_token }) => ({ subscriber_id: subscriber.id, recipient: subscriber.email, subject: values.subject, body: values.body, owner_confirmation_token })) })
    const results = []
    for (const { subscriber, values } of reviewed) {
      const idempotencyKey = `mailing-list/${context.workspaceId}/${subscriber.id}/${body.template_id}/${draftHash(values.subject, values.body)}`
      const existing = await context.client.from('outreach_sends').select('id, status').eq('workspace_id', context.workspaceId).eq('idempotency_key', idempotencyKey).maybeSingle()
      if (existing.error) throw new Error('Send history could not be checked.')
      if (existing.data) { results.push({ subscriber_id: subscriber.id, duplicate: true, send: existing.data }); continue }
      if (await isEmailSuppressed(context.client, context.workspaceId, subscriber.email)) return res.status(409).json({ ok: false, error: 'A recipient has opted out of marketing email.', sends: results })
      const attempt = await context.client.from('outreach_sends').insert({ workspace_id: context.workspaceId, subscriber_id: subscriber.id, template_id: body.template_id, send_type: 'mailing_list', to_email: subscriber.email, subject: values.subject, status: 'queued', idempotency_key: idempotencyKey, draft_hash: draftHash(values.subject, values.body), created_by: context.user.id }).select('id').single()
      if (attempt.error?.code === '23505') return res.status(409).json({ ok: false, error: 'This draft is already reserved. Reload send history before retrying.', sends: results })
      if (attempt.error) throw new Error('The send attempt could not be saved.')
      const sent = await sendResendEmail({ from: getFromEmail(), to: [subscriber.email], subject: values.subject, text: values.body }, { idempotencyKey })
      const final = await context.client.from('outreach_sends').update({ status: sent.error ? 'failed' : 'sent', resend_message_id: sent.data?.id || null, sent_at: sent.error ? null : new Date().toISOString(), error_message: sent.error?.message || null }).eq('id', attempt.data.id).select('id, status').single()
      if (final.error) throw new Error('Email outcome requires reconciliation before any retry.')
      results.push({ subscriber_id: subscriber.id, send: final.data, error: sent.error?.message || null })
    }
    const failed = results.filter((row) => row.error).length
    return res.status(failed ? 207 : 201).json({ ok: !failed, sends: results, failed_count: failed })
  } catch (error) { return res.status(503).json({ ok: false, error: error.message }) }
}
