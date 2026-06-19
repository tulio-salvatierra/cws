/* global process */

const RESEND_EMAILS_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = 'Cicero Web Studio <onboarding@resend.dev>'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      ok: false,
      error: 'Missing Resend API key.',
    })
  }

  const body = parseRequestBody(req.body)
  const { type, clientRecord } = body

  if (!['confirmation', 'admin-notify'].includes(type) || !clientRecord) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid notification payload.',
    })
  }

  if (type === 'admin-notify' && !process.env.ADMIN_NOTIFY_EMAIL) {
    return res.status(500).json({
      ok: false,
      error: 'Missing admin notification email.',
    })
  }

  const emailPayload = buildEmailPayload(type, clientRecord)

  if (!emailPayload.to?.length) {
    return res.status(400).json({
      ok: false,
      error: 'Missing recipient email.',
    })
  }

  const response = await fetch(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'cicero-client-portal/1.0',
    },
    body: JSON.stringify(emailPayload),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    return res.status(502).json({
      ok: false,
      error: result?.message || result?.error || 'Resend notification failed.',
    })
  }

  return res.status(200).json({ ok: true, result })
}

function parseRequestBody(body) {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }

  return body
}

function buildEmailPayload(type, clientRecord) {
  if (type === 'confirmation') {
    return buildConfirmationEmail(clientRecord)
  }

  return buildAdminNotificationEmail(clientRecord)
}

function buildConfirmationEmail(clientRecord) {
  const businessName = getBusinessName(clientRecord)

  return {
    from: FROM_EMAIL,
    to: [clientRecord.email].filter(Boolean),
    subject: `We received your Cicero Web Studio intake for ${businessName}`,
    text: [
      `Hi ${clientRecord.contactName || clientRecord.clientName || businessName},`,
      '',
      `Thanks for submitting the intake for ${businessName}. We received your project details and will review your goals, current web presence, and next-step priorities.`,
      '',
      'Next step: Cicero Web Studio will follow up with your project status and any clarifying questions.',
      '',
      'Cicero Web Studio',
    ].join('\n'),
    html: [
      `<p>Hi ${escapeHtml(clientRecord.contactName || clientRecord.clientName || businessName)},</p>`,
      `<p>Thanks for submitting the intake for <strong>${escapeHtml(businessName)}</strong>. We received your project details and will review your goals, current web presence, and next-step priorities.</p>`,
      '<p><strong>Next step:</strong> Cicero Web Studio will follow up with your project status and any clarifying questions.</p>',
      '<p>Cicero Web Studio</p>',
    ].join(''),
  }
}

function buildAdminNotificationEmail(clientRecord) {
  const businessName = getBusinessName(clientRecord)

  return {
    from: FROM_EMAIL,
    to: [process.env.ADMIN_NOTIFY_EMAIL].filter(Boolean),
    subject: `New client intake: ${businessName}`,
    text: [
      `New client intake received for ${businessName}.`,
      '',
      `Contact: ${clientRecord.contactName || clientRecord.clientName || 'Not provided'}`,
      `Email: ${clientRecord.email || 'Not provided'}`,
      `Phone: ${clientRecord.phone || 'Not provided'}`,
      `Project type: ${clientRecord.projectType || 'Not provided'}`,
    ].join('\n'),
    html: [
      `<p>New client intake received for <strong>${escapeHtml(businessName)}</strong>.</p>`,
      '<ul>',
      `<li><strong>Contact:</strong> ${escapeHtml(clientRecord.contactName || clientRecord.clientName || 'Not provided')}</li>`,
      `<li><strong>Email:</strong> ${escapeHtml(clientRecord.email || 'Not provided')}</li>`,
      `<li><strong>Phone:</strong> ${escapeHtml(clientRecord.phone || 'Not provided')}</li>`,
      `<li><strong>Project type:</strong> ${escapeHtml(clientRecord.projectType || 'Not provided')}</li>`,
      '</ul>',
    ].join(''),
  }
}

function getBusinessName(clientRecord) {
  return clientRecord.businessName || clientRecord.clientName || 'your business'
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
