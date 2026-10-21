import { Buffer } from 'node:buffer'

const fields = 'id,decision_id,evaluator,subject_type,subject_id,response,reason,created_at,input_snapshot,evaluation'
const pageSize = 30
const types = ['all', 'decision_review', 'goal_pace', 'deal_fit', 'lifecycle']
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const chicagoClock = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
function midnight(day) {
  const target = Date.parse(`${day}T00:00:00Z`)
  let instant = target
  for (let i = 0; i < 3; i += 1) {
    const parts = Object.fromEntries(chicagoClock.formatToParts(instant).map(part => [part.type, part.value]))
    const local = new Date(0)
    local.setUTCFullYear(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
    local.setUTCHours(Number(parts.hour), Number(parts.minute), Number(parts.second), 0)
    instant += target - local.getTime()
  }
  return new Date(instant).toISOString()
}
function date(value) {
  if (value === undefined || value === '') return ''
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000') || !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) !== value) throw new Error('Invalid history date. Use YYYY-MM-DD.')
  return value
}
function filters(options = {}) {
  const response = options.response === undefined ? 'all' : options.response
  if (!['all', 'act', 'dismiss'].includes(response)) throw new Error('Invalid history response.')
  const from = date(options.from), to = date(options.to)
  if (from && to && from > to) throw new Error('History start date must be on or before end date.')
  const rawSearch = options.search === undefined ? '' : options.search
  if (typeof rawSearch !== 'string' || rawSearch.length > 80 || Array.from(rawSearch).some(char => char.codePointAt(0) < 32 || char.codePointAt(0) === 127)) throw new Error('History search must be at most 80 characters without control characters.')
  const search = rawSearch.trim()
  return { response, from, to, search }
}

// Cursors are read positions, never authorization. Every query is owner-gated
// by the handler and independently scoped to the authenticated workspace.
export function parseHistoryPosition(type = 'all', cursor = null, workspaceId, options = {}) {
  if (!types.includes(type)) throw new Error('Invalid history type.')
  const selected = filters(options)
  if (!cursor) return { type, ...selected, cursor: null }
  if (typeof cursor !== 'string' || cursor.length > 1600 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error('Invalid history cursor.')
  let value
  try { value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) } catch { throw new Error('Invalid history cursor.') }
  if (!value || value.type !== type || value.workspace !== workspaceId || (value.response ?? 'all') !== selected.response || (value.from ?? '') !== selected.from || (value.to ?? '') !== selected.to || (value.search ?? '') !== selected.search || !uuid.test(value.id) || typeof value.at !== 'string' || !timestamp.test(value.at) || !Number.isFinite(Date.parse(value.at))) throw new Error('Invalid history cursor.')
  return { type, ...selected, cursor: value }
}

export async function loadResponseHistory(context, position = { type: 'all', cursor: null }) {
  let query = context.client.from('laya_evaluations').select(fields).eq('workspace_id', context.workspaceId)
  const selected = filters(position)
  if (selected.search) {
    // PostgreSQL q treats the rest as literal text; imatch supplies case folding.
    // JSON string quoting protects PostgREST's OR grammar, including quotes,
    // backslashes and commas. No user pattern or live source join is accepted.
    const literal = JSON.stringify(`(?q)${selected.search}`)
    const columns = ['reason', 'subject_id', 'subject_type', 'input_snapshot->decision->>title', 'input_snapshot->decision->>decision', 'input_snapshot->inputs->lead->>name', 'input_snapshot->inputs->lead->>company', 'input_snapshot->inputs->agreement->>product_name']
    query = query.or(columns.map(column => `${column}.imatch.${literal}`).join(','))
  }
  if (selected.response !== 'all') query = query.eq('response', selected.response)
  if (selected.from) query = query.gte('created_at', midnight(selected.from))
  if (selected.to) {
    const nextDay = new Date(`${selected.to}T00:00:00Z`)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    query = query.lt('created_at', midnight(nextDay.toISOString().split('T')[0]))
  }
  if (position.type !== 'all') query = query.eq('evaluator', position.type)
  if (position.cursor) {
    const { at, id } = position.cursor
    query = query.or(`created_at.lt.${at},and(created_at.eq.${at},id.lt.${id})`)
  }
  const result = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(pageSize + 1)
  const items = result.error ? [] : (result.data || []).slice(0, pageSize)
  const last = items.at(-1)
  const next = !result.error && result.data?.length > pageSize
    ? Buffer.from(JSON.stringify({ at: last.created_at, id: last.id, type: position.type, ...selected, workspace: context.workspaceId })).toString('base64url') : null
  return { ...selected, can_view: true, available: !result.error, items, limit: pageSize, type: position.type, next_cursor: next }
}
