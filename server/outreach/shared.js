/* global process */

import { createClient } from '@supabase/supabase-js'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'

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

export async function authenticateOwner(req) {
  const context = await authenticateWorkspace(req)
  if (context.error) return context
  const membership = await context.client.from('workspace_members').select('role').eq('workspace_id', context.workspaceId).eq('user_id', context.user.id).eq('status', 'active').maybeSingle()
  if (membership.error) return { error: 'Sales ownership could not be verified.', status: 502 }
  if (membership.data?.role !== 'owner') return { error: 'An active workspace owner must confirm a Sales send.', status: 403 }
  return context
}

export function draftHash(subject, body) { return createHash('sha256').update(`${subject}\n${body}`).digest('hex') }

export function createSalesConfirmationToken(context, values, now = Date.now()) {
  const payload = { v: 1, workspace_id: context.workspaceId, user_id: context.user.id, lead_id: values.leadId, recipient: values.recipient, template_id: values.templateId, send_type: values.sendType, draft_hash: draftHash(values.subject, values.body), expires_at: now + 10 * 60 * 1000 }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function validSalesConfirmationToken(token, context, values, now = Date.now()) {
  const [encoded, signature, extra] = String(token || '').split('.')
  if (!encoded || !signature || extra) return false
  const expected = createHmac('sha256', process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY).update(encoded).digest('base64url')
  const receivedBuffer = Buffer.from(signature); const expectedBuffer = Buffer.from(expected)
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return false
  try { const p = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); return p.v === 1 && p.workspace_id === context.workspaceId && p.user_id === context.user.id && p.lead_id === values.leadId && p.recipient === values.recipient && p.template_id === values.templateId && p.send_type === values.sendType && p.draft_hash === draftHash(values.subject, values.body) && Number.isFinite(p.expires_at) && p.expires_at > now } catch { return false }
}

export function interpolateTemplate(value, recipient = {}) {
  return value
    .replaceAll('{{name}}', recipient.name || 'there')
    .replaceAll('{{company}}', recipient.company || 'your business')
    .replaceAll('{{unsubscribe_url}}', recipient.unsubscribeUrl || '{{unsubscribe_url}}')
}
