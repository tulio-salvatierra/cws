/* global process */

import { createClient } from '@supabase/supabase-js'

export const LINKEDIN_PUBLISH_AGENT_KEY = 'linkedin-publisher'
export const LINKEDIN_PUBLISH_TIMEOUT_MS = 10_000

const PLATFORM = 'linkedin'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const missingEnv = getMissingEnv()
  if (missingEnv.length) {
    return res.status(500).json({
      ok: false,
      error: `Missing LinkedIn publishing environment variables: ${missingEnv.join(', ')}`,
    })
  }

  const accessToken = getBearerToken(req)
  if (!accessToken) return res.status(401).json({ ok: false, error: 'Authentication required.' })

  const body = parseRequestBody(req.body)
  const validationError = validatePayload(body)
  if (validationError) return res.status(400).json({ ok: false, error: validationError })

  const client = createServiceClient()
  const authenticated = await client.auth.getUser(accessToken)
  const user = authenticated.data?.user
  if (authenticated.error || !user) {
    return res.status(401).json({ ok: false, error: 'The session is invalid or expired.' })
  }

  const variant = await client
    .from('content_variants')
    .select('id, workspace_id, campaign_id, code, locale, status')
    .eq('id', body.content_variant_id)
    .maybeSingle()

  if (variant.error) return databaseError(res, variant.error)
  if (!variant.data) return res.status(404).json({ ok: false, error: 'Content variant not found.' })

  const membership = await client
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', variant.data.workspace_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membership.error) return databaseError(res, membership.error)
  if (!membership.data) {
    return res.status(403).json({ ok: false, error: 'You are not an active member of this workspace.' })
  }

  if (variant.data.status !== 'exported') {
    return res.status(409).json({
      ok: false,
      error: 'The content variant must be exported before it can be published.',
    })
  }

  const [campaign, exportVersion] = await Promise.all([
    client
      .from('campaigns')
      .select('id, channel_id, code, title')
      .eq('id', variant.data.campaign_id)
      .eq('workspace_id', variant.data.workspace_id)
      .maybeSingle(),
    client
      .from('content_variant_exports')
      .select('id, version, caption_text, export_reference')
      .eq('content_variant_id', variant.data.id)
      .eq('workspace_id', variant.data.workspace_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (campaign.error) return databaseError(res, campaign.error)
  if (exportVersion.error) return databaseError(res, exportVersion.error)
  if (!campaign.data || !exportVersion.data) {
    return res.status(409).json({ ok: false, error: 'The exported content handoff is incomplete.' })
  }

  // The export version is the revision component: a corrected export gets a new key.
  const idempotencyKey = `linkedin:v1:${variant.data.id}:export:${exportVersion.data.version}`
  const runInput = {
    platform: PLATFORM,
    content_variant_id: variant.data.id,
    campaign_id: campaign.data.id,
    export_version_id: exportVersion.data.id,
    export_version: exportVersion.data.version,
    idempotency_key: idempotencyKey,
    caption: exportVersion.data.caption_text,
    link: exportVersion.data.export_reference,
  }

  const queued = await client
    .from('agent_runs')
    .insert({
      workspace_id: variant.data.workspace_id,
      command_level: 'execute',
      agent_key: LINKEDIN_PUBLISH_AGENT_KEY,
      status: 'running',
      input: runInput,
      started_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select('id')
    .single()

  if (queued.error) return databaseError(res, queued.error)

  const payload = {
    content_variant_id: variant.data.id,
    campaign_id: campaign.data.id,
    caption: exportVersion.data.caption_text,
    link: exportVersion.data.export_reference,
    platform: PLATFORM,
    idempotency_key: idempotencyKey,
    agent_run_id: queued.data.id,
  }

  try {
    await invokeN8n(payload)
    return res.status(202).json({ ok: true, agent_run_id: queued.data.id })
  } catch (error) {
    const message = safeErrorMessage(error)
    const failed = await updateRun(client, queued.data.id, {
      status: 'failed',
      output: null,
      error_message: message,
    })
    if (failed.error) return databaseError(res, failed.error)
    return res.status(502).json({ ok: false, error: message, agent_run_id: queued.data.id })
  }
}

function createServiceClient() {
  return createClient(
    process.env.GENERATION_SUPABASE_URL,
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function getMissingEnv() {
  const missing = []
  if (!process.env.GENERATION_SUPABASE_URL) missing.push('GENERATION_SUPABASE_URL')
  if (!process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY) missing.push('GENERATION_SUPABASE_SERVICE_ROLE_KEY')
  if (!process.env.N8N_PUBLISH_WEBHOOK_URL) missing.push('N8N_PUBLISH_WEBHOOK_URL')
  if (!process.env.N8N_PUBLISH_WEBHOOK_SECRET) missing.push('N8N_PUBLISH_WEBHOOK_SECRET')
  return missing
}

function getBearerToken(req) {
  const value = req.headers?.authorization
  if (typeof value !== 'string') return ''
  return value.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || ''
}

function parseRequestBody(body) {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof body === 'object' && !Array.isArray(body) ? body : {}
}

function validatePayload(body) {
  if (!UUID_PATTERN.test(body.content_variant_id || '')) return 'A valid content_variant_id is required.'
  if (body.platform !== PLATFORM) return 'platform must be linkedin.'
  return ''
}

async function invokeN8n(payload) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), LINKEDIN_PUBLISH_TIMEOUT_MS)

  try {
    const response = await fetch(process.env.N8N_PUBLISH_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cws-n8n-secret': process.env.N8N_PUBLISH_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`n8n publish webhook returned HTTP ${response.status}.`)
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('n8n publish webhook timed out.')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function updateRun(client, id, values) {
  return client.from('agent_runs').update(values).eq('id', id).select('id, status').single()
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : ''
  return message && message.length <= 1000 ? message : 'n8n publish webhook failed.'
}

function databaseError(res, error) {
  return res.status(502).json({ ok: false, error: error?.message || 'LinkedIn publishing database request failed.' })
}
