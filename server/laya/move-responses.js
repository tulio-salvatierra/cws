/* global process */
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { chicagoDate } from '../sales/queue.js'
import { recommendation, review30Days, sourceVersion } from './next-move.js'

const sign = text => createHmac('sha256', process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY).update(text).digest('base64url')
const lifetime = 15 * 60 * 1000
export function moveToken(context, item, now = new Date()) {
  const payload = { purpose: 'next_move_choice_v1', id: randomUUID(), workspace: context.workspaceId, owner: context.user.id,
    expires: now.getTime() + lifetime, card: { id: item.id, title: item.human_action, href: item.href },
    source_version: sourceVersion(item), recommendation: item.next_move || recommendation(item, now), evaluation: item.evaluation }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const token = `${encoded}.${sign(encoded)}`
  return token.length <= 100000 ? token : null
}
export function readMoveToken(token, context, now = new Date()) {
  if (typeof token !== 'string' || token.length > 100000) return null
  const [encoded, signature, extra] = token.split('.')
  if (!encoded || !signature || extra) return null
  const expected = Buffer.from(sign(encoded)), actual = Buffer.from(signature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
  try {
    const value = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    return value.purpose === 'next_move_choice_v1' && value.workspace === context.workspaceId && value.owner === context.user.id
      && Number.isFinite(value.expires) && value.expires > now.getTime() && value.expires <= now.getTime() + lifetime ? value : null
  } catch { return null }
}

function validScope(scope) {
  return scope && typeof scope === 'object' && !Array.isArray(scope)
    && typeof scope.agreement_reference === 'string' && scope.agreement_reference.trim().length > 0 && scope.agreement_reference.length <= 1000
    && typeof scope.request === 'string' && scope.request.trim().length > 0 && scope.request.length <= 2000
    && ['addition', 'revision', 'unknown'].includes(scope.inclusion)
    && ['revisions_used', 'revision_allowance', 'estimated_hours', 'proposed_fee_cents'].every(k => scope[k] === null || Number.isSafeInteger(scope[k]) && scope[k] >= 0 && scope[k] <= 100000000)
}

export async function saveMove(context, body, now = new Date()) {
  if (!['do', 'later', 'handoff', 'close', 'drop', 'scope'].includes(body.choice)) return { status: 400, error: 'Choose a valid next-move action.' }
  if (body.choice === 'close' && !['yes', 'no', 'not_yet', 'skip'].includes(body.outcome)) return { status: 400, error: 'Choose Yes, No, Not yet, or Skip.' }
  if (body.choice === 'scope' && !validScope(body.scope)) return { status: 400, error: 'Record the agreement, request, and valid scope fields.' }
  const reviewed = readMoveToken(body.review_token, context, now)
  if (!reviewed) return { status: 409, error: 'This card review expired or is invalid. Reload CEO Today.' }
  const date = new Date(chicagoDate(now) + 'T12:00:00Z')
  date.setUTCDate(date.getUTCDate() + 2)
  const scope = body.choice === 'scope' ? Object.fromEntries(['agreement_reference','request','inclusion','revisions_used','revision_allowance','estimated_hours','proposed_fee_cents'].map(k => [k, body.scope[k]])) : null
  const values = { id: reviewed.id, workspace_id: context.workspaceId, created_by: context.user.id, card_id: reviewed.card.id,
    title: reviewed.card.title, action: body.choice, outcome: body.choice === 'close' ? body.outcome : null,
    defer_until: body.choice === 'later' ? date.toISOString().slice(0,10) : null, scope_evidence: scope,
    source_version: reviewed.source_version, recommendation: reviewed.recommendation, evaluation: reviewed.evaluation || {}, created_at: now.toISOString() }
  const saved = await context.client.from('laya_move_choices').insert(values).select('id').single()
  if (!saved.error) return { status: 200, id: saved.data.id }
  if (saved.error.code === '23505') {
    const old = await context.client.from('laya_move_choices').select('id,created_by,action,outcome,scope_evidence').eq('workspace_id', context.workspaceId).eq('id', reviewed.id).maybeSingle()
    if (!old.error && old.data?.created_by === context.user.id && old.data.action === values.action && old.data.outcome === values.outcome && JSON.stringify(old.data.scope_evidence) === JSON.stringify(values.scope_evidence)) return { status: 200, id: old.data.id }
    return { status: 409, error: 'A different choice already exists for this card review. Reload CEO Today.' }
  }
  return { status: 502, error: 'Choice could not be saved. Retry this same card review.' }
}

export async function loadMoves(context, now = new Date()) {
  // A capped or failed read cannot be mistaken for a complete review or empty choice history.
  const result = await context.client.from('laya_move_choices').select('*').eq('workspace_id', context.workspaceId)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(1000)
  if (result.error || !Array.isArray(result.data) || result.data.length >= 1000) return { available: false, events: [], review: null }
  return { available: true, events: result.data, review: review30Days(result.data, now) }
}
