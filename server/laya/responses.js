/* global process */
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'

const lifetime = 15 * 60 * 1000
const sign = encoded => createHmac('sha256', process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY).update(encoded).digest('base64url')

export function createResponseToken(context, decision, evaluation, now = Date.now()) {
  const snapshot = { decision, evaluated_at: evaluation.evaluated_at, business_date: evaluation.business_date, time_zone: evaluation.time_zone }
  const payload = { v: 1, purpose: 'laya_owner_response', id: randomUUID(), workspace_id: context.workspaceId,
    user_id: context.user.id, expires_at: now + lifetime, input_snapshot: snapshot, evaluation }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

export function readResponseToken(token, context, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 100000) return null
  const [encoded, signature, extra] = token.split('.')
  if (!encoded || !signature || extra) return null
  const expected = Buffer.from(sign(encoded)); const received = Buffer.from(signature)
  if (received.length !== expected.length || !timingSafeEqual(expected, received)) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (payload.v !== 1 || payload.purpose !== 'laya_owner_response' || payload.workspace_id !== context.workspaceId
      || payload.user_id !== context.user.id || !Number.isFinite(payload.expires_at) || payload.expires_at <= now
      || payload.expires_at > now + lifetime || payload.evaluation?.subject?.id !== payload.input_snapshot?.decision?.id
      || payload.evaluation?.subject?.workspace_id !== context.workspaceId) return null
    return payload
  } catch { return null }
}

export async function saveOwnerResponse(context, body) {
  const response = body.response
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (!['act', 'dismiss'].includes(response) || !reason || reason.length > 2000) {
    return { status: 400, error: 'Choose Act or Dismiss and enter a reason (1–2,000 characters).' }
  }
  const reviewed = readResponseToken(body.review_token, context)
  if (!reviewed) return { status: 409, error: 'This review expired or is invalid. Reload CEO Today and review it again.' }
  const values = { id: reviewed.id, workspace_id: context.workspaceId, decision_id: reviewed.input_snapshot.decision.id,
    evaluator: reviewed.evaluation.evaluator, policy_version: reviewed.evaluation.policy_version,
    input_snapshot: reviewed.input_snapshot, evaluation: reviewed.evaluation, response, reason, created_by: context.user.id }
  const saved = await context.client.from('laya_evaluations').insert(values).select('id').single()
  if (!saved.error) return { status: 200, id: saved.data.id }
  if (saved.error.code === '23505') {
    const previous = await context.client.from('laya_evaluations').select('id,response,reason,created_by')
      .eq('id', reviewed.id).eq('workspace_id', context.workspaceId).maybeSingle()
    if (!previous.error && previous.data?.created_by === context.user.id && previous.data.response === response && previous.data.reason === reason) {
      return { status: 200, id: previous.data.id }
    }
    return { status: 409, error: 'A different response was already saved for this review. Reload to see it.' }
  }
  return { status: 502, error: 'Your response could not be saved. You can retry this same review.' }
}
