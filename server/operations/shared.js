/* global process */

import { cleanText, createOutreachClient, getBearerToken, parseBody } from '../outreach/shared.js'

export { cleanText, parseBody }

export function missingOperationsEnv() {
  const required = ['GENERATION_SUPABASE_URL', 'GENERATION_SUPABASE_SERVICE_ROLE_KEY']
  return required.filter((name) => !process.env[name])
}

export async function authenticateOperationsWorkspace(req) {
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

export async function authenticateOperationsOwner(req) {
  const context = await authenticateOperationsWorkspace(req)
  if (context.error) return context
  const membership = await context.client
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', context.workspaceId)
    .eq('user_id', context.user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (membership.error) return { error: 'Operations ownership could not be verified.', status: 502 }
  if (membership.data?.role !== 'owner') return { error: 'An active workspace owner is required for Operations changes.', status: 403 }
  return context
}
