/* global process */

import { getFromEmail, sendResendEmail } from './lib/resend.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const missingEnv = getMissingEnv()

  if (missingEnv.length) {
    return res.status(500).json({
      ok: false,
      error: `Missing notification environment variables: ${missingEnv.join(', ')}`,
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

  const { data, error } = await sendResendEmail(emailPayload)

  if (error) {
    return res.status(502).json({
      ok: false,
      error: error.message || 'Resend notification failed.',
    })
  }

  return res.status(200).json({ ok: true, result: data })
}

function getMissingEnv() {
  return ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'].filter((key) => !process.env[key])
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
  const clientId = clientRecord.id || clientRecord.email || 'unknown'

  return {
    from: getFromEmail(),
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
    idempotencyKey: `client-intake-confirmation/${clientId}`,
  }
}

function buildAdminNotificationEmail(clientRecord) {
  const businessName = getBusinessName(clientRecord)
  const clientId = clientRecord.id || clientRecord.email || 'unknown'

  return {
    from: getFromEmail(),
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
    idempotencyKey: `client-intake-admin/${clientId}`,
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
