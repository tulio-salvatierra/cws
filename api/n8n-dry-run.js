/* global process */

import { createClient } from '@supabase/supabase-js'

export const N8N_BRIDGE_SECRET_HEADER = 'x-cws-n8n-secret'
export const N8N_DRY_RUN_AGENT_KEY = 'n8n-dry-run-bridge'
export const N8N_DRY_RUN_TIMEOUT_MS = 10_000

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const missingEnv = getMissingEnv()
  if (missingEnv.length) {
    return res.status(500).json({
      ok: false,
      error: `Missing n8n bridge environment variables: ${missingEnv.join(', ')}`,
    })
  }

  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Authentication required.' })

  const body = parseRequestBody(req.body)
  if (!UUID_PATTERN.test(body.variant_id || '')) {
    return res.status(400).json({ ok: false, error: 'A valid variant_id is required.' })
  }

  const client = createServiceClient()
  const authenticated = await client.auth.getUser(token)
  const user = authenticated.data?.user
  if (authenticated.error || !user) {
    return res.status(401).json({ ok: false, error: 'The session is invalid or expired.' })
  }

  const membership = await client
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membership.error) return databaseError(res, membership.error)
  if (!membership.data || membership.data.role !== 'owner') {
    return res.status(403).json({ ok: false, error: 'An active workspace owner must run the n8n bridge test.' })
  }

  const workspaceId = membership.data.workspace_id
  const variant = await client
    .from('content_variants')
    .select('id, workspace_id, campaign_id, code, locale, working_title, status, is_test, test_archived')
    .eq('id', body.variant_id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (variant.error) return databaseError(res, variant.error)
  if (!variant.data) return res.status(404).json({ ok: false, error: 'Content variant not found.' })
  if (!variant.data.is_test || !variant.data.test_archived) {
    return res.status(409).json({
      ok: false,
      error: 'The first n8n bridge cycle is restricted to archived test variants.',
    })
  }
  if (variant.data.status !== 'exported') {
    return res.status(409).json({ ok: false, error: 'The test variant must be exported before handoff.' })
  }

  const [campaign, exportVersion] = await Promise.all([
    client
      .from('campaigns')
      .select('id, channel_id, code, title')
      .eq('id', variant.data.campaign_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle(),
    client
      .from('content_variant_exports')
      .select('id, version, caption_text, export_reference, exported_at')
      .eq('content_variant_id', variant.data.id)
      .eq('workspace_id', workspaceId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (campaign.error) return databaseError(res, campaign.error)
  if (exportVersion.error) return databaseError(res, exportVersion.error)
  if (!campaign.data || !exportVersion.data) {
    return res.status(409).json({ ok: false, error: 'The exported test handoff is incomplete.' })
  }

  const queued = await client
    .from('agent_runs')
    .insert({
      workspace_id: workspaceId,
      command_level: 'propose',
      agent_key: N8N_DRY_RUN_AGENT_KEY,
      status: 'queued',
      input: {
        mode: 'dry_run',
        content_variant_id: variant.data.id,
        export_version_id: exportVersion.data.id,
        export_version: exportVersion.data.version,
      },
      created_by: user.id,
    })
    .select('id')
    .single()

  if (queued.error) return databaseError(res, queued.error)

  const running = await updateRun(client, queued.data.id, { status: 'running' })
  if (running.error) return databaseError(res, running.error)

  const bridgePayload = {
    mode: 'dry_run',
    correlation_id: queued.data.id,
    workspace_id: workspaceId,
    channel_id: campaign.data.channel_id,
    campaign_id: campaign.data.id,
    campaign_code: campaign.data.code,
    content_variant_id: variant.data.id,
    variant_code: variant.data.code,
    locale: variant.data.locale,
    working_title: variant.data.working_title,
    export_version: exportVersion.data.version,
    caption_text: exportVersion.data.caption_text,
    export_reference: exportVersion.data.export_reference,
  }

  try {
    const bridgeResult = await invokeBridge(bridgePayload)
    const completed = await updateRun(client, queued.data.id, {
      status: 'completed',
      output: {
        mode: 'dry_run',
        workflow: bridgeResult.workflow,
        correlation_id: bridgeResult.correlation_id,
        received: bridgeResult.received || null,
      },
      error_message: null,
    })

    if (completed.error) return databaseError(res, completed.error)
    return res.status(200).json({
      ok: true,
      mode: 'dry_run',
      run_id: queued.data.id,
      bridge: bridgeResult,
    })
  } catch (error) {
    const message = safeErrorMessage(error)
    const failed = await updateRun(client, queued.data.id, {
      status: 'failed',
      output: null,
      error_message: message,
    })
    if (failed.error) return databaseError(res, failed.error)
    return res.status(502).json({ ok: false, error: message, run_id: queued.data.id })
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
  if (!process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('GENERATION_SUPABASE_SERVICE_ROLE_KEY')
  }
  if (!process.env.N8N_DRY_RUN_WEBHOOK_URL) missing.push('N8N_DRY_RUN_WEBHOOK_URL')
  if (!process.env.N8N_DRY_RUN_WEBHOOK_SECRET) missing.push('N8N_DRY_RUN_WEBHOOK_SECRET')
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

async function invokeBridge(payload) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), N8N_DRY_RUN_TIMEOUT_MS)

  try {
    const response = await fetch(process.env.N8N_DRY_RUN_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [N8N_BRIDGE_SECRET_HEADER]: process.env.N8N_DRY_RUN_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const text = await response.text()
    if (!response.ok) throw new Error(`n8n bridge returned HTTP ${response.status}.`)
    if (text.length > 20_000) throw new Error('n8n bridge response exceeded the safe size limit.')

    let result
    try {
      result = JSON.parse(text)
    } catch {
      throw new Error('n8n bridge returned an invalid JSON response.')
    }

    if (
      result?.ok !== true
      || result.mode !== 'dry_run'
      || result.correlation_id !== payload.correlation_id
    ) {
      throw new Error('n8n bridge returned an invalid dry-run acknowledgement.')
    }

    return result
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('n8n bridge timed out.')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function updateRun(client, id, values) {
  return client.from('agent_runs').update(values).eq('id', id).select('id, status').single()
}

function safeErrorMessage(error) {
  return error instanceof Error ? error.message.slice(0, 1000) : 'n8n bridge failed.'
}

function databaseError(res, error) {
  return res.status(502).json({
    ok: false,
    error: error?.message || 'n8n bridge database request failed.',
  })
}
