import { cleanText, createOutreachClient, missingOutreachEnv, parseBody } from './shared.js'

// Public, unauthenticated lead capture for the Negocio Listo landing page.
// Writes one inbound `leads` row owned by the workspace owner. No email or other
// external action is triggered here (external actions need owner confirmation).

export const PUBLIC_LEAD_FORMS = new Set(['popup', 'inline'])
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
  const parts = ['negocio-listo', fields.form, fields.lang]
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
  if (!lead.name || !lead.phone) return res.status(400).json({ ok: false, error: 'A name and a valid US phone number are required.' })
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
    phone: lead.phone,
    email: lead.email || null,
    company: lead.company || null,
    source: buildSource(lead),
    sales_classification: 'inbound',
  }

  // The popup and the inline form can both be sent by one visitor: merge into the recent row.
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString()
  const recent = await client
    .from('leads')
    .select('id, email, company')
    .eq('workspace_id', owner.data.workspace_id)
    .eq('phone', lead.phone)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (recent.error) return res.status(502).json({ ok: false, error: 'Lead capture is unavailable.' })

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

  const inserted = await client.from('leads').insert({
    ...values,
    workspace_id: owner.data.workspace_id,
    created_by: owner.data.user_id,
  })
  if (inserted.error) return res.status(502).json({ ok: false, error: 'Lead capture is unavailable.' })
  return res.status(201).json({ ok: true })
}
