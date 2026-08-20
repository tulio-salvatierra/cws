/* global process */

import { createClient } from '@supabase/supabase-js'

export function createOutreachClient() {
  return createClient(
    process.env.GENERATION_SUPABASE_URL,
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export function missingOutreachEnv(...names) {
  const required = ['GENERATION_SUPABASE_URL', 'GENERATION_SUPABASE_SERVICE_ROLE_KEY', ...names]
  return required.filter((name) => !process.env[name])
}

export function getBearerToken(req) {
  const value = req.headers?.authorization
  return typeof value === 'string' ? value.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '' : ''
}

export function parseBody(body) {
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

export function cleanText(value, maxLength) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

export async function authenticateWorkspace(req) {
  const token = getBearerToken(req)
  if (!token) return { error: 'Authentication required.', status: 401 }

  const client = createOutreachClient()
  const authenticated = await client.auth.getUser(token)
  const user = authenticated.data?.user
  if (authenticated.error || !user) return { error: 'The session is invalid or expired.', status: 401 }

  const membership = await client
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membership.error) return { error: membership.error.message, status: 502 }
  if (!membership.data) return { error: 'No active workspace membership was found.', status: 403 }
  return { client, user, workspaceId: membership.data.workspace_id }
}

export function interpolateTemplate(value, lead) {
  return value
    .replaceAll('{{name}}', lead.name || 'there')
    .replaceAll('{{company}}', lead.company || 'your business')
}
