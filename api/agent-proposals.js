/* global process */

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const missingEnv = getMissingEnv()
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

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
}

function getMissingEnv() {
  const missing = []
  if (!getSupabaseUrl()) missing.push('SUPABASE_URL or VITE_SUPABASE_URL')
  if (!getSupabaseAnonKey()) missing.push('SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY')
  return missing
}

function getBearerToken(req) {
  const value = req.headers?.authorization
  if (typeof value !== 'string') return ''
  return value.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || ''
}

function databaseError(res, error) {
  return res.status(500).json({
    ok: false,
    error: error?.message || 'Database request failed.',
  })
}
