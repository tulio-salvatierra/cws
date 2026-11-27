// MCP-READ-001 (DEC-041): owner-issued, hash-only, manually revoked personal tokens.
import { createHash, randomBytes } from 'node:crypto'
import { createOutreachClient } from '../outreach/shared.js'

export const TOKEN_PREFIX = 'cws_mcp_'
const TOKEN_PATTERN = /^cws_mcp_[A-Za-z0-9_-]{43}$/
const TOKEN_FIELDS = 'id, label, token_prefix, created_at, last_used_at, revoked_at'

export function generateToken() {
  return `${TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`
}

export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex')
}

export function bearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || ''
  const match = /^Bearer\s+(\S+)$/i.exec(String(header))
  return match ? match[1] : null
}

// Returns the same { client, user, workspaceId } context the other handlers use.
export async function authenticateMcpToken(req, { client = createOutreachClient(), now = new Date() } = {}) {
  const token = bearerToken(req)
  if (!token || !TOKEN_PATTERN.test(token)) return { error: 'A CWS MCP token is required.', status: 401 }

  const found = await client.from('mcp_tokens').select('id, workspace_id, user_id, revoked_at')
    .eq('token_hash', hashToken(token)).maybeSingle()
  if (found.error) return { error: 'The token could not be verified.', status: 502 }
  if (!found.data || found.data.revoked_at) return { error: 'The token is invalid or revoked.', status: 401 }

  const owner = await client.from('workspace_members').select('role').eq('workspace_id', found.data.workspace_id)
    .eq('user_id', found.data.user_id).eq('status', 'active').maybeSingle()
  if (owner.error) return { error: 'Ownership could not be verified.', status: 502 }
  if (owner.data?.role !== 'owner') return { error: 'The token owner is no longer an active workspace owner.', status: 403 }

  // Auth bookkeeping only. A failed timestamp update never blocks the read.
  await Promise.resolve(client.from('mcp_tokens').update({ last_used_at: now.toISOString() }).eq('id', found.data.id)).catch(() => {})

  return { client, user: { id: found.data.user_id }, workspaceId: found.data.workspace_id, membershipRole: 'owner', tokenId: found.data.id }
}

// Owner actions. Callers must have verified the active owner already.
export async function listMcpTokens(context) {
  const rows = await context.client.from('mcp_tokens').select(TOKEN_FIELDS)
    .eq('workspace_id', context.workspaceId).order('created_at', { ascending: false }).limit(50)
  if (rows.error) return { error: 'MCP tokens are unavailable.', status: 502 }
  return { tokens: rows.data || [] }
}

export async function createMcpToken(context, body) {
  const label = String(body?.label || '').trim()
  if (!label || label.length > 80) return { error: 'Enter a label of 1–80 characters.', status: 400 }
  const token = generateToken()
  const inserted = await context.client.from('mcp_tokens').insert({
    workspace_id: context.workspaceId,
    user_id: context.user.id,
    token_hash: hashToken(token),
    token_prefix: token.slice(0, TOKEN_PREFIX.length + 6),
    label,
  }).select(TOKEN_FIELDS).single()
  if (inserted.error) return { error: 'The token could not be created.', status: 502 }
  // The plaintext token is returned once and never stored.
  return { token, record: inserted.data }
}

export async function revokeMcpToken(context, body, now = new Date()) {
  const id = String(body?.token_id || '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: 'token_id must be a valid identifier.', status: 400 }
  const updated = await context.client.from('mcp_tokens').update({ revoked_at: now.toISOString() })
    .eq('id', id).eq('workspace_id', context.workspaceId).is('revoked_at', null).select('id')
  if (updated.error) return { error: 'The token could not be revoked.', status: 502 }
  if (!updated.data?.length) return { error: 'The token was not found or is already revoked.', status: 404 }
  return { revoked: id }
}
