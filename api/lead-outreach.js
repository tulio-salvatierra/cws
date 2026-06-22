/* global process */

import { getFromEmail, sendResendEmail } from './lib/resend.js'

const OUTREACH_TYPES = ['intro', 'followUp']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const missingEnv = getMissingEnv()

  if (missingEnv.length) {
    return res.status(500).json({
      ok: false,
      error: `Missing outreach environment variables: ${missingEnv.join(', ')}`,
    })
  }

  const body = parseRequestBody(req.body)
  const { lead, type, personalNote = '' } = body

  if (!lead || !OUTREACH_TYPES.includes(type)) {
    return res.status(400).json({ ok: false, error: 'Invalid outreach payload.' })
  }

  if (lead.doNotContact || lead.status === 'Do Not Contact') {
    return res.status(400).json({ ok: false, error: 'Lead is marked do not contact.' })
  }

  if (!lead.email) {
    return res.status(400).json({ ok: false, error: 'Lead is missing an email address.' })
  }

  const emailPayload = buildOutreachEmail({ lead, type, personalNote })
  const { data, error } = await sendResendEmail(emailPayload)

  if (error) {
    return res.status(502).json({
      ok: false,
      error: error.message || 'Resend outreach failed.',
    })
  }

  return res.status(200).json({ ok: true, result: data })
}

function getMissingEnv() {
  return ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'BUSINESS_POSTAL_ADDRESS'].filter(
    (key) => !process.env[key],
  )
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

function buildOutreachEmail({ lead, type, personalNote }) {
  const subject =
    type === 'intro'
      ? `Quick website idea for ${lead.businessName}`
      : `Following up on ${lead.businessName}`
  const introText = buildIntroText(lead, personalNote)
  const followUpText = buildFollowUpText(lead, personalNote)
  const message = type === 'intro' ? introText : followUpText
  const replyTo = process.env.LEAD_REPLY_TO_EMAIL || process.env.ADMIN_NOTIFY_EMAIL || ''

  return {
    from: getFromEmail(),
    to: [lead.email],
    ...(replyTo ? { replyTo: [replyTo] } : {}),
    subject,
    text: message.text,
    html: message.html,
    idempotencyKey: buildOutreachIdempotencyKey(type, lead),
  }
}

function buildOutreachIdempotencyKey(type, lead) {
  const leadId = lead.id || lead.email

  if (type === 'intro') {
    return `lead-intro/${leadId}`
  }

  const followUpSlot = lead.nextFollowUpDate || lead.lastContacted || 'initial'
  return `lead-follow-up/${leadId}/${followUpSlot}`
}

function buildIntroText(lead, personalNote) {
  const greeting = `Hi ${lead.contactName || lead.businessName},`
  const websiteLine = lead.websiteUrl ? `I took a quick look at ${lead.websiteUrl}.` : ''
  const noteLine = personalNote.trim() ? `${personalNote.trim()}\n\n` : ''
  const text = [
    greeting,
    '',
    `${websiteLine} I run Cicero Web Studio, where I help local service businesses make their websites and Google profiles clearer, faster to understand, and easier to turn into real inquiries.`,
    '',
    noteLine
      ? `${noteLine}If helpful, I can send over a short observation about one improvement opportunity for ${lead.businessName}.`
      : `If helpful, I can send over a short observation about one improvement opportunity for ${lead.businessName}.`,
    '',
    'No pressure either way.',
    '',
    buildComplianceFooter(),
  ].join('\n')

  return {
    text,
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(websiteLine)} I run Cicero Web Studio, where I help local service businesses make their websites and Google profiles clearer, faster to understand, and easier to turn into real inquiries.</p>`,
      personalNote.trim() ? `<p>${escapeHtml(personalNote.trim())}</p>` : '',
      `<p>If helpful, I can send over a short observation about one improvement opportunity for ${escapeHtml(lead.businessName)}.</p>`,
      '<p>No pressure either way.</p>',
      buildComplianceFooterHtml(),
    ].join(''),
  }
}

function buildFollowUpText(lead, personalNote) {
  const greeting = `Hi ${lead.contactName || lead.businessName},`
  const noteLine = personalNote.trim() ? `${personalNote.trim()}\n\n` : ''
  const text = [
    greeting,
    '',
    `Quick follow-up on ${lead.businessName}.`,
    '',
    noteLine ||
      'I wanted to check whether improving your website, Google profile, or lead flow is something worth looking at this quarter.',
    '',
    'If not, no worries.',
    '',
    buildComplianceFooter(),
  ].join('\n')

  return {
    text,
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>Quick follow-up on ${escapeHtml(lead.businessName)}.</p>`,
      personalNote.trim()
        ? `<p>${escapeHtml(personalNote.trim())}</p>`
        : '<p>I wanted to check whether improving your website, Google profile, or lead flow is something worth looking at this quarter.</p>',
      '<p>If not, no worries.</p>',
      buildComplianceFooterHtml(),
    ].join(''),
  }
}

function buildComplianceFooter() {
  const unsubscribeLine = process.env.LEAD_UNSUBSCRIBE_URL
    ? `Unsubscribe: ${process.env.LEAD_UNSUBSCRIBE_URL}`
    : 'To opt out, reply with "unsubscribe" and I will remove you from future outreach.'

  return [
    'Tulio Salvatierra',
    'Cicero Web Studio',
    process.env.BUSINESS_POSTAL_ADDRESS,
    unsubscribeLine,
  ].join('\n')
}

function buildComplianceFooterHtml() {
  const unsubscribeLine = process.env.LEAD_UNSUBSCRIBE_URL
    ? `<a href="${escapeAttribute(process.env.LEAD_UNSUBSCRIBE_URL)}">Unsubscribe</a>`
    : 'To opt out, reply with "unsubscribe" and I will remove you from future outreach.'

  return [
    '<hr>',
    '<p style="font-size:12px;color:#52525b;line-height:1.5">',
    'Tulio Salvatierra<br>',
    'Cicero Web Studio<br>',
    `${escapeHtml(process.env.BUSINESS_POSTAL_ADDRESS)}<br>`,
    unsubscribeLine,
    '</p>',
  ].join('')
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}
