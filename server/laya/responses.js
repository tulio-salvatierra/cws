import { REASON_CATEGORIES } from '../../shared/laya-feedback.js'
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

export function createEvaluationResponseToken(context, inputs, evaluation, now = Date.now()) {
  if(evaluation.evaluator==='priority_review' && !['fallback','marketing_ready','marketing_missed','marketing_delivery_failure'].includes(inputs?.action?.source_type) && !inputs?.principal)return null
  const input_snapshot = { subject: evaluation.subject, inputs, evaluated_at: evaluation.evaluated_at, business_date: evaluation.business_date, time_zone: evaluation.time_zone }
  const payload = { v: 2, purpose: 'laya_owner_response', id: randomUUID(), workspace_id: context.workspaceId,
    user_id: context.user.id, expires_at: now + lifetime, input_snapshot, evaluation }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const token = `${encoded}.${sign(encoded)}`
  // Do not truncate evidence to fit a token. Withhold responses instead.
  return token.length <= 100000 ? token : null
}

export function readResponseToken(token, context, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 100000) return null
  const [encoded, signature, extra] = token.split('.')
  if (!encoded || !signature || extra) return null
  const expected = Buffer.from(sign(encoded)); const received = Buffer.from(signature)
  if (received.length !== expected.length || !timingSafeEqual(expected, received)) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (![1,2].includes(payload.v) || payload.purpose !== 'laya_owner_response' || payload.workspace_id !== context.workspaceId
      || payload.user_id !== context.user.id || !Number.isFinite(payload.expires_at) || payload.expires_at <= now
      || payload.expires_at > now + lifetime || payload.evaluation?.subject?.workspace_id !== context.workspaceId) return null
    if(payload.v===1) {
      if(payload.evaluation?.evaluator!=='decision_review' || payload.evaluation.subject.id!==payload.input_snapshot?.decision?.id) return null
    } else {
      const evaluation=payload.evaluation, snapshot=payload.input_snapshot, subject=evaluation?.subject
      if(!snapshot?.inputs || snapshot.inputs.workspaceId!==context.workspaceId || JSON.stringify(snapshot.subject)!==JSON.stringify(subject)
        || snapshot.evaluated_at!==evaluation.evaluated_at || snapshot.business_date!==evaluation.business_date || snapshot.time_zone!==evaluation.time_zone
        || snapshot.inputs.now!==evaluation.evaluated_at) return null
      if(evaluation.evaluator==='priority_review') {
        if(subject.type!=='ceo_priority' || subject.id!==snapshot.inputs.action?.id || !Array.isArray(snapshot.inputs.sources))return null
        if(snapshot.inputs.sources.some(s=>s.table==='marketing_publish_destination_results' ? !snapshot.inputs.sources.some(a=>a.table==='marketing_publish_attempts' && a.row.id===s.row.attempt_id && a.row.workspace_id===context.workspaceId) : s.row?.workspace_id!==context.workspaceId))return null
      } else if(evaluation.evaluator==='goal_pace') {
        if(subject.type!=='negocio_listo_goal' || subject.id!=='negocio-listo-2026-12-31')return null
      } else if(['deal_fit','lifecycle'].includes(evaluation.evaluator)) {
        const row=subject.type==='lead'?snapshot.inputs.lead:subject.type==='client_service_agreement'?snapshot.inputs.agreement:null
        if(!row || row.id!==subject.id || row.workspace_id!==context.workspaceId)return null
        if(evaluation.evaluator==='lifecycle' && (subject.type==='lead' ? String(row.source || '').split('|')[0]!=='negocio-listo' : !/^negocio listo(?:\s|$|[—-])/i.test(String(row.product_name || '').trim())))return null
      } else return null
    }
    return payload
  } catch { return null }
}

export async function saveOwnerResponse(context, body) {
  const response = body.response
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (!['act', 'dismiss'].includes(response) || !reason || reason.length > 2000) {
    return { status: 400, error: 'Choose Act or Dismiss and enter a reason (1–2,000 characters).' }
  }
  const category = body.reason_category == null || body.reason_category === '' ? null : body.reason_category
  const alternative = body.alternative_action == null ? null : typeof body.alternative_action === 'string' ? body.alternative_action.trim() || null : body.alternative_action
  if ((category !== null && (typeof category !== 'string' || !Object.hasOwn(REASON_CATEGORIES, category)))
    || (alternative !== null && (typeof alternative !== 'string' || alternative.length > 2000))) {
    return { status: 400, error: 'Choose a valid reason category and keep the alternative action within 2,000 characters.' }
  }
  const reviewed = readResponseToken(body.review_token, context)
  if (!reviewed) return { status: 409, error: 'This review expired or is invalid. Reload CEO Today and review it again.' }
  const values = { id: reviewed.id, workspace_id: context.workspaceId, decision_id: reviewed.evaluation.evaluator==='decision_review'?reviewed.input_snapshot.decision.id:null,
    evaluator: reviewed.evaluation.evaluator, policy_version: reviewed.evaluation.policy_version,
    input_snapshot: reviewed.input_snapshot, evaluation: reviewed.evaluation, response, reason, reason_category: category, alternative_action: alternative, created_by: context.user.id }
  const saved = await context.client.from('laya_evaluations').insert(values).select('id').single()
  if (!saved.error) return { status: 200, id: saved.data.id }
  if (saved.error.code === '23505') {
    const previous = await context.client.from('laya_evaluations').select('id,response,reason,reason_category,alternative_action,created_by')
      .eq('id', reviewed.id).eq('workspace_id', context.workspaceId).maybeSingle()
    if (!previous.error && previous.data?.created_by === context.user.id && previous.data.response === response && previous.data.reason === reason
      && (previous.data.reason_category ?? null) === category && (previous.data.alternative_action ?? null) === alternative) {
      return { status: 200, id: previous.data.id }
    }
    return { status: 409, error: 'A different response was already saved for this review. Reload to see it.' }
  }
  return { status: 502, error: 'Your response could not be saved. You can retry this same review.' }
}
