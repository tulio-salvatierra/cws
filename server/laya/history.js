import { Buffer } from 'node:buffer'

const fields = 'id,decision_id,evaluator,subject_type,subject_id,response,reason,created_at,input_snapshot,evaluation'
const pageSize = 30
const types = ['all', 'decision_review', 'goal_pace', 'deal_fit']
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Cursors are read positions, never authorization. Every query is owner-gated
// by the handler and independently scoped to the authenticated workspace.
export function parseHistoryPosition(type = 'all', cursor = null, workspaceId) {
  if (!types.includes(type)) throw new Error('Invalid history type.')
  if (!cursor) return { type, cursor: null }
  if (typeof cursor !== 'string' || cursor.length > 700 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error('Invalid history cursor.')
  let value
  try { value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) } catch { throw new Error('Invalid history cursor.') }
  if (!value || value.type !== type || value.workspace !== workspaceId || !uuid.test(value.id) || typeof value.at !== 'string' || !timestamp.test(value.at) || !Number.isFinite(Date.parse(value.at))) throw new Error('Invalid history cursor.')
  return { type, cursor: value }
}

export async function loadResponseHistory(context, position = { type: 'all', cursor: null }) {
  let query = context.client.from('laya_evaluations').select(fields).eq('workspace_id', context.workspaceId)
  if (position.type !== 'all') query = query.eq('evaluator', position.type)
  if (position.cursor) {
    const { at, id } = position.cursor
    query = query.or(`created_at.lt.${at},and(created_at.eq.${at},id.lt.${id})`)
  }
  const result = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(pageSize + 1)
  const items = result.error ? [] : (result.data || []).slice(0, pageSize)
  const last = items.at(-1)
  const next = !result.error && result.data?.length > pageSize
    ? Buffer.from(JSON.stringify({ at: last.created_at, id: last.id, type: position.type, workspace: context.workspaceId })).toString('base64url') : null
  return { can_view: true, available: !result.error, items, limit: pageSize, type: position.type, next_cursor: next }
}
