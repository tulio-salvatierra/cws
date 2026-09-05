/* global process */

import { getFromEmail, sendResendEmail } from '../../api/lib/resend.js'
import {
  authenticateWorkspace,
  interpolateTemplate,
  missingOutreachEnv,
  parseBody,
} from './shared.js'

const MAX_RECIPIENTS = 100
const UNSUBSCRIBE_BASE_URL = process.env.OUTREACH_UNSUBSCRIBE_BASE_URL || 'https://www.cicerowebstudio.xyz/api/outreach/unsubscribe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv('RESEND_API_KEY', 'RESEND_FROM_EMAIL')
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing outreach environment variables: ${missing.join(', ')}` })
  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  const body = parseBody(req.body)
  const subscriberIds = Array.isArray(body.subscriber_ids) ? [...new Set(body.subscriber_ids.filter((id) => typeof id === 'string' && id))] : []
  if (!body.template_id || !subscriberIds.length || subscriberIds.length > MAX_RECIPIENTS) {
    return res.status(400).json({ ok: false, error: `template_id and between 1 and ${MAX_RECIPIENTS} subscriber_ids are required.` })
  }

  const [templateResult, subscribersResult] = await Promise.all([
    context.client.from('email_templates').select('id, subject, body').eq('id', body.template_id).eq('workspace_id', context.workspaceId).eq('lang', 'en').eq('type', 'mailing_list').maybeSingle(),
    context.client.from('mailing_list_subscribers').select('id, email, name').eq('workspace_id', context.workspaceId).is('unsubscribed_at', null).in('id', subscriberIds),
  ])
  if (templateResult.error || subscribersResult.error) return res.status(502).json({ ok: false, error: (templateResult.error || subscribersResult.error).message })
  if (!templateResult.data) return res.status(404).json({ ok: false, error: 'Mailing-list template not found.' })
  if (!templateResult.data.body.includes('{{unsubscribe_url}}')) return res.status(400).json({ ok: false, error: 'Mailing-list templates must include {{unsubscribe_url}}.' })
  if ((subscribersResult.data || []).length !== subscriberIds.length) return res.status(400).json({ ok: false, error: 'One or more subscribers were not found or are unsubscribed.' })

  const results = []
  for (const subscriber of subscribersResult.data) {
    const unsubscribeUrl = `${UNSUBSCRIBE_BASE_URL}?subscriber_id=${encodeURIComponent(subscriber.id)}`
    const subject = interpolateTemplate(templateResult.data.subject, subscriber)
    const message = interpolateTemplate(templateResult.data.body, { ...subscriber, unsubscribeUrl })
    const sent = await sendResendEmail({ from: getFromEmail(), to: [subscriber.email], subject, text: message }, { idempotencyKey: `mailing-list/${subscriber.id}/${templateResult.data.id}/${Date.now()}` })
    const recorded = await context.client.from('outreach_sends').insert({
      workspace_id: context.workspaceId,
      subscriber_id: subscriber.id,
      template_id: templateResult.data.id,
      send_type: 'mailing_list',
      to_email: subscriber.email,
      subject,
      status: sent.error ? 'failed' : 'sent',
      resend_message_id: sent.data?.id || null,
      sent_at: sent.error ? null : new Date().toISOString(),
      created_by: context.user.id,
    }).select('id, status, resend_message_id, sent_at').single()
    if (recorded.error) return res.status(502).json({ ok: false, error: recorded.error.message })
    results.push({ subscriber_id: subscriber.id, email: subscriber.email, send: recorded.data, error: sent.error?.message || null })
  }

  const failed = results.filter((result) => result.error)
  return res.status(failed.length ? 207 : 201).json({ ok: !failed.length, sends: results, failed_count: failed.length })
}
