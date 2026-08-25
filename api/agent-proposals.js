/* global process */

import { createClient } from '@supabase/supabase-js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (req.method === 'GET') return listProposals(req, res)
  if (req.method === 'PATCH') return markProposalDiscussed(req, res)

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}

async function listProposals(req, res) {
  const missingEnv = getMissingReadEnv()
  if (missingEnv.length) {
    return res.status(500).json({
      ok: false,
      error: `Missing agent proposal environment variables: ${missingEnv.join(', ')}`,
    })
  }

  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Authentication required.' })

  const client = createUserClient(token)
  const authenticated = await client.auth.getUser(token)
  const user = authenticated.data?.user
  if (authenticated.error || !user) {
    return res.status(401).json({ ok: false, error: 'The session is invalid or expired.' })
  }

  const membership = await client
    .from('workspace_members')
    .select('workspace_id')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membership.error) return databaseError(res, membership.error)

  if (!membership.data) {
    return res.status(200).json({ ok: true, workspace_id: null, proposals: [] })
  }

  const proposals = await client
    .from('agent_runs')
    .select('id, agent_key, created_at, output')
    .eq('workspace_id', membership.data.workspace_id)
    .eq('command_level', 'propose')
    .eq('status', 'needs_review')
    .order('created_at', { ascending: false })

  if (proposals.error) return databaseError(res, proposals.error)

  return res.status(200).json({
    ok: true,
    workspace_id: membership.data.workspace_id,
    proposals: proposals.data || [],
  })
}

async function markProposalDiscussed(req, res) {
  const missingEnv = getMissingWriteEnv()
  if (missingEnv.length) {
    return res.status(500).json({
      ok: false,
      error: `Missing agent proposal environment variables: ${missingEnv.join(', ')}`,
    })
  }

  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Authentication required.' })

  const body = parseRequestBody(req.body)
  const proposalId = body.proposal_id || body.id
  if (!UUID_PATTERN.test(proposalId || '')) {
    return res.status(400).json({ ok: false, error: 'A valid proposal_id is required.' })
  }

  const client = createServiceClient()
  const authenticated = await client.auth.getUser(token)
  const user = authenticated.data?.user
  if (authenticated.error || !user) {
    return res.status(401).json({ ok: false, error: 'The session is invalid or expired.' })
  }

  const membership = await client
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membership.error) return databaseError(res, membership.error)
  if (!membership.data) {
    return res.status(403).json({ ok: false, error: 'No active workspace membership was found.' })
  }

  const updated = await client
    .from('agent_runs')
    .update({ status: 'completed' })
    .eq('id', proposalId)
    .eq('workspace_id', membership.data.workspace_id)
    .eq('command_level', 'propose')
    .eq('status', 'needs_review')
    .select('id, agent_key, status, created_at, output')
    .maybeSingle()

  if (updated.error) return databaseError(res, updated.error)
  if (!updated.data) {
    return res.status(404).json({ ok: false, error: 'Pending proposal not found.' })
  }

  return res.status(200).json({ ok: true, proposal: updated.data })
}

function createUserClient(token) {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

function createServiceClient() {
  return createClient(
    getWriteSupabaseUrl(),
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
}

function getWriteSupabaseUrl() {
  return process.env.GENERATION_SUPABASE_URL || getSupabaseUrl()
}

function getMissingReadEnv() {
  const missing = []
  if (!getSupabaseUrl()) missing.push('SUPABASE_URL or VITE_SUPABASE_URL')
  if (!getSupabaseAnonKey()) missing.push('SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY')
  return missing
}

function getMissingWriteEnv() {
  const missing = []
  if (!getWriteSupabaseUrl()) missing.push('GENERATION_SUPABASE_URL or SUPABASE_URL')
  if (!process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('GENERATION_SUPABASE_SERVICE_ROLE_KEY')
  }
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

function databaseError(res, error) {
  return res.status(500).json({
    ok: false,
    error: error?.message || 'Database request failed.',
  })
}
