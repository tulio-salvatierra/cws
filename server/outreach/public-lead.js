import { randomUUID } from 'node:crypto'
import { notifyContactLead } from './contact-notification.js'
import { cleanText, createOutreachClient, missingOutreachEnv, parseBody } from './shared.js'

// Public, unauthenticated lead capture for Negocio Listo and the contact page.
// Writes one inbound `leads` row owned by the workspace owner. Contact inquiries
// notify the fixed owner inbox, explicitly authorized by the owner; no visitor email.

export const PUBLIC_LEAD_FORMS = new Set(['popup', 'inline', 'contact'])
export const PUBLIC_LEAD_PLANS = new Set(['basico', 'crecer', 'destacado', 'unsure'])
export const PUBLIC_LEAD_TYPES = new Set(['construction', 'roofing', 'plumbing', 'electrical', 'hvac', 'landscaping', 'cleaning', 'painting', 'other'])
const MIN_FILL_MS = 1000 // browser autofill can complete the short popup form in ~1–2 s
const DUPLICATE_WINDOW_MS = 30 * 60 * 1000

export function normalizePhone(value) {
  const digits = cleanText(value, 50).replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return ''
}

function pick(value, allowed) {
  const text = cleanText(value, 32)
  return allowed.has(text) ? text : ''
}

/** Compact, human-readable source tag; the leads table has no dedicated columns for these. */
export function buildSource(fields) {
  const parts = [fields.form === 'contact' ? 'contact-page' : 'negocio-listo', fields.form, fields.lang]
  if (fields.plan) parts.push(`plan=${fields.plan}`)
  if (fields.type) parts.push(`type=${fields.type}`)
  if (fields.hasWebsite) parts.push(`site=${fields.hasWebsite}`)
  if (fields.utm) parts.push(`utm=${fields.utm}`)
  return parts.join('|').slice(0, 200)
}

export function readLead(body) {
  const utmSource = cleanText(body.utm_source, 40).replace(/[|=]/g, '')
  const utmCampaign = cleanText(body.utm_campaign, 40).replace(/[|=]/g, '')
  return {
    name: cleanText(body.name, 200),
    service: pick(body.service, new Set(['new', 'redesign', 'audit', 'other'])),
    message: cleanText(body.message, 4001),
    rawPhone: cleanText(body.phone, 50),
    phone: normalizePhone(body.phone),
    email: cleanText(body.email, 320).toLowerCase(),
    company: cleanText(body.business_name, 200),
    form: pick(body.form, PUBLIC_LEAD_FORMS) || 'inline',
    lang: body.lang === 'en' ? 'en' : 'es',
    plan: pick(body.plan_interest, PUBLIC_LEAD_PLANS),
    type: pick(body.business_type, PUBLIC_LEAD_TYPES),
    hasWebsite: body.has_website === 'yes' || body.has_website === 'no' ? body.has_website : '',
    utm: [utmSource, utmCampaign].filter(Boolean).join('/'),
    honeypot: cleanText(body.company_website, 200),
    elapsedMs: Number(body.elapsed_ms),
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: 'Lead capture is not configured.' })

  const lead = readLead(parseBody(req.body))
  // Bots: a filled honeypot or an instant submit gets a silent success and no write.
  if (lead.honeypot || (Number.isFinite(lead.elapsedMs) && lead.elapsedMs < MIN_FILL_MS)) {
    return res.status(202).json({ ok: true })
  }
  const isContact = lead.form === 'contact'
  if (isContact && (!lead.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !lead.service || !lead.message || lead.message.length > 4000 || (lead.rawPhone && !lead.phone))) {
    return res.status(400).json({ ok: false, error: 'Enter your name, valid email, project type and message, and a valid US phone number if provided.' })
  }
  if (!isContact && (!lead.name || !lead.phone)) return res.status(400).json({ ok: false, error: 'A name and a valid US phone number are required.' })
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) lead.email = ''

  const client = createOutreachClient()
  const owner = await client
    .from('workspace_members')
    .select('workspace_id, user_id')
    .eq('role', 'owner')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (owner.error || !owner.data) return res.status(502).json({ ok: false, error: 'Lead capture is unavailable.' })

  const values = {
    name: lead.name,
    phone: lead.phone || null,
    email: lead.email || null,
    company: lead.company || null,
    source: buildSource(lead),
    sales_classification: 'inbound',
    ...(isContact ? { inquiry_service: lead.service, inquiry_message: lead.message } : {}),
  }

  // The popup and the inline form can both be sent by one visitor: merge into the recent row.
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString()
  let recent
  if (isContact) {
    // Keep free-text inquiry content out of PostgREST's GET URL. A 4,000-character
    // message can exceed proxy URL limits once percent-encoded. Read a bounded
    // set for this workspace/email/source, then compare exact payloads locally.
    const candidates = await client.from('leads')
      .select('id, name, phone, company, inquiry_service, inquiry_message')
      .eq('workspace_id', owner.data.workspace_id)
      .eq('email', lead.email).eq('source', values.source)
      .gte('created_at', since).order('created_at', { ascending: false }).limit(20)
    recent = {
      error: candidates.error,
      data: candidates.data?.find((row) => row.name === values.name
        && row.phone === values.phone && row.company === values.company
        && row.inquiry_service === lead.service && row.inquiry_message === lead.message),
    }
  } else {
    recent = await client.from('leads').select('id, email, company')
      .eq('workspace_id', owner.data.workspace_id).eq('phone', lead.phone)
      .is('inquiry_message', null).gte('created_at', since)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
  }
  if (recent.error) return res.status(502).json({ ok: false, error: 'Lead capture is unavailable.' })

  if (recent.data && isContact) {
    if (!await notifyContactLead(recent.data.id, values)) return notificationFailure(res)
    return res.status(200).json({ ok: true, merged: true })
  }

  if (recent.data) {
    const updated = await client
      .from('leads')
      .update({
        name: values.name,
        email: values.email || recent.data.email,
        company: values.company || recent.data.company,
        source: values.source,
      })
      .eq('id', recent.data.id)
      .eq('workspace_id', owner.data.workspace_id)
    if (updated.error) return res.status(502).json({ ok: false, error: 'Lead capture is unavailable.' })
    return res.status(200).json({ ok: true, merged: true })
  }

  const leadId = isContact ? randomUUID() : null
  const inserted = await client.from('leads').insert({
    ...(isContact ? { id: leadId } : {}),
    ...values,
    workspace_id: owner.data.workspace_id,
    created_by: owner.data.user_id,
  })
  if (inserted.error) return res.status(502).json({ ok: false, error: 'Lead capture is unavailable.' })
  if (isContact && !await notifyContactLead(leadId, values)) return notificationFailure(res)
  return res.status(201).json({ ok: true })
}

function notificationFailure(res) {
  return res.status(502).json({ ok: false, error: 'Your inquiry was saved, but the notification could not be confirmed. Please retry or contact us directly.' })
}
