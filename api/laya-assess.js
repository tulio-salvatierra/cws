/* global process */

import { createClient } from '@supabase/supabase-js'
import { assessDraftSafely } from '../server/laya/assess.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const missingEnv = getMissingEnv()
  if (missingEnv.length) {
    return res.status(500).json({
      ok: false,
      error: `Missing Laya assessment environment variables: ${missingEnv.join(', ')}`,
    })
  }

  const accessToken = getBearerToken(req)
  if (!accessToken) return res.status(401).json({ ok: false, error: 'Authentication required.' })

  const body = parseRequestBody(req.body)
  const runId = body.run_id
  if (!runId && (typeof body.draft !== 'string' || !body.draft.trim() || body.draft.length > 20000 || typeof body.topic !== 'string' || !body.topic.trim() || body.topic.length > 500)) return res.status(400).json({ ok: false, error: 'Provide a topic and asset text (maximum 20,000 characters).' })
  if (runId && typeof runId !== 'string') return res.status(400).json({ ok: false, error: 'Invalid run_id.' })

  const client = createServiceClient()
  const authenticated = await client.auth.getUser(accessToken)
  const user = authenticated.data?.user
  if (authenticated.error || !user) return res.status(401).json({ ok: false, error: 'The session is invalid or expired.' })

  const membership = await client
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (membership.error) return databaseError(res, membership.error)
  if (!membership.data) return res.status(403).json({ ok: false, error: 'No active workspace membership was found.' })

  const run = runId ? await client
    .from('agent_runs')
    .select('id, input, output, updated_at')
    .eq('id', runId.trim())
    .eq('workspace_id', membership.data.workspace_id)
    .maybeSingle() : { data: { input: { topic: body.topic }, output: { draft_text: body.draft } } }
  if (run.error) return databaseError(res, run.error)
  if (!run.data) return res.status(404).json({ ok: false, error: 'Agent run not found.' })

  if (!runId) {
    const brief = await client.from('channel_brief').select('*').eq('workspace_id', membership.data.workspace_id).eq('channel_id', body.channel_id).eq('language', body.language || 'en').eq('is_active', true).maybeSingle()
    if (brief.error) return databaseError(res, brief.error)
    if (!brief.data) return res.status(400).json({ ok: false, error: 'No active brief for this channel and language.' })
    run.data.input.brief_snapshot = brief.data
  }

  const draft = typeof run.data.output?.draft_text === 'string' ? run.data.output.draft_text.trim() : ''
  if (!draft) return res.status(400).json({ ok: false, error: 'This agent run does not contain a draft to assess.' })

  const laya = await assessDraftSafely({
    topic: typeof run.data.input?.topic === 'string' ? run.data.input.topic : '',
    draft,
    brief: run.data.input?.brief_snapshot || {},
  })
  const now = new Date().toISOString()
  const updated = await client
    .from('agent_runs')
    .insert({ workspace_id: membership.data.workspace_id, created_by: user.id, agent_key: 'laya-asset-assessment', command_level: 'ask', status: 'completed', started_at: now, finished_at: now, input: { ...run.data.input, source_run_id: runId || null, draft_snapshot: draft }, output: { laya } })
    .select('id')
    .maybeSingle()
  if (updated.error) return databaseError(res, updated.error)
  if (!updated.data) return res.status(500).json({ ok: false, error: 'Assessment could not be saved.' })

  return res.status(200).json({ ok: true, laya })
}

function createServiceClient() {
  return createClient(
    process.env.GENERATION_SUPABASE_URL,
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function getMissingEnv() {
  return ['GENERATION_SUPABASE_URL', 'GENERATION_SUPABASE_SERVICE_ROLE_KEY'].filter((name) => !process.env[name]?.trim())
}

function getBearerToken(req) {
  const value = req.headers?.authorization
  return typeof value === 'string' ? value.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '' : ''
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

function databaseError(res, error) {
  return res.status(500).json({ ok: false, error: error.message || 'Database request failed.' })
}
