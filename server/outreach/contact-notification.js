import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { getFromEmail, sendResendEmail } from '../../api/lib/resend.js'

const RECIPIENT = 'info@cicerowebstudio.xyz'
const SERVICE_LABELS = { new: 'A new website', redesign: 'Improving an existing website', audit: 'A website audit', other: 'Something else / not sure yet' }

// Called only after persistence. The fixed recipient cannot be overridden by public input.
// Same saved lead + same payload use the same provider key on form/network retries.
export async function notifyContactLead(id, lead) {
  const from = getFromEmail()
  if (!from) return false
  const payload = {
    from,
    to: [RECIPIENT],
    replyTo: lead.email,
    subject: 'New contact inquiry — Cicero Web Studio',
    text: [
      'A new contact-page inquiry has been saved in CWS Sales.', '',
      `Name: ${lead.name}`, `Email: ${lead.email}`,
      `Phone: ${lead.phone || 'Not provided'}`, `Business: ${lead.company || 'Not provided'}`,
      `Project type: ${SERVICE_LABELS[lead.inquiry_service] || lead.inquiry_service}`, '',
      'Project message:', lead.inquiry_message, '',
      `Source: ${lead.source}`, `Lead reference: ${id}`,
      'Review in Sales: https://www.cicerowebstudio.xyz/admin/sales', '',
      'Reply to this email to contact the visitor.',
    ].join('\n'),
  }
  return sendNotification(id, payload, `contact-inquiry-${id}`)
}

export async function notifyNegocioListoLead(id, lead, fields) {
  const from = getFromEmail()
  if (!from) return false
  const plans = { basico: 'Básico', crecer: 'Crecer', destacado: 'Destacado', unsure: 'Not sure yet' }
  const payload = {
    from, to: [RECIPIENT],
    ...(lead.email ? { replyTo: lead.email } : {}),
    subject: 'New Negocio Listo lead — Cicero Web Studio',
    text: [
      'A Negocio Listo form submission has been saved in CWS Sales.', '',
      `Name: ${lead.name}`, `Phone: ${lead.phone}`,
      `Email: ${lead.email || 'Not provided'}`, `Business: ${lead.company || 'Not provided'}`,
      `Form: ${fields.form === 'popup' ? 'Popup' : 'Inline'}`,
      `Language: ${fields.lang === 'en' ? 'English' : 'Spanish'}`,
      `Plan interest: ${plans[fields.plan] || 'Not provided'}`,
      `Business type: ${fields.type || 'Not provided'}`,
      `Has website: ${fields.hasWebsite || 'Not provided'}`, '',
      `Source: ${lead.source}`, `Lead reference: ${id}`,
      'Review in Sales: https://www.cicerowebstudio.xyz/admin/sales', '',
      lead.email ? 'Reply to this email to contact the visitor.' : 'No email was provided. Use the phone number above to follow up.',
    ].join('\n'),
  }
  // A popup and a later detailed inline submission can update the same lead.
  // Notify for each distinct saved payload; exact retries keep the same key.
  const fingerprint = createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  return sendNotification(id, payload, `negocio-listo-${id}-${fingerprint}`)
}

async function sendNotification(id, payload, idempotencyKey) {
  for (let attempt = 0; attempt < 2; attempt++) {
    let error
    try {
      const result = await sendResendEmail(payload, { idempotencyKey })
      if (!result.error && result.data?.id) return true
      error = result.error
    } catch {
      error = { statusCode: 503 }
    }
    const retryable = !error?.statusCode || error.statusCode === 429 || error.statusCode >= 500
    if (!retryable || attempt === 1) break
    await delay(500)
  }
  // Do not log submitted personal data or provider error bodies.
  console.error('Contact notification unconfirmed', { leadId: id })
  return false
}
