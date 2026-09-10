import {
  authenticateWorkspace,
  cleanText,
  missingOutreachEnv,
  parseBody,
} from './shared.js'

const CLASSIFICATIONS = new Set(['inbound', 'prospect'])
const RESPONSE_STATES = new Set(['no_response', 'warm', 'neutral'])

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing outreach environment variables: ${missing.join(', ')}` })

  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  if (req.method === 'GET') {
    const status = cleanText(req.query?.status, 32)
    let query = context.client.from('leads').select('id, name, email, company, status, sales_classification, response_state, phone, locality, last_contacted_at, created_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const result = await query
    return result.error
      ? res.status(502).json({ ok: false, error: result.error.message })
      : res.status(200).json({ ok: true, leads: result.data || [] })
  }

  const body = parseBody(req.body)
  const email = cleanText(body.email, 320)
  const phone = cleanText(body.phone, 50)
  if (!email && !phone) return res.status(400).json({ ok: false, error: 'A verified business email or phone is required.' })
  const salesClassification = cleanText(body.sales_classification, 32)
  const responseState = cleanText(body.response_state, 32)
  if (salesClassification && !CLASSIFICATIONS.has(salesClassification)) return res.status(400).json({ ok: false, error: 'Invalid Sales classification.' })
  if (responseState && !RESPONSE_STATES.has(responseState)) return res.status(400).json({ ok: false, error: 'Invalid response state.' })
  const inserted = await context.client.from('leads').insert({
    workspace_id: context.workspaceId,
    name: cleanText(body.name, 200) || null,
    email: email || null,
    company: cleanText(body.company, 200) || null,
    source: cleanText(body.source, 200) || null,
    sales_classification: salesClassification || null,
    response_state: responseState || null,
    phone: phone || null,
    locality: cleanText(body.locality, 200) || null,
    created_by: context.user.id,
  }).select('id, name, email, company, status, sales_classification, response_state, phone, locality, last_contacted_at').single()
  return inserted.error
    ? res.status(400).json({ ok: false, error: inserted.error.message })
    : res.status(201).json({ ok: true, lead: inserted.data })
}
