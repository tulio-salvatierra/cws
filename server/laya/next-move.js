import { createHash } from 'node:crypto'
import { chicagoDate } from '../sales/queue.js'

export const MOVE_POLICY = 'laya-decision-rules-v1'
const validDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v
const populated = v => typeof v === 'string' && v.trim().length > 0

// Five templates; every interpolation retains the exact source field underneath More.
export function evidenceWhy(fields) {
  const { due, status, updated, lane, client, onlyOpen, projectStatus, task, lastAction, actionDate } = fields
  if (validDate(due) && populated(lastAction) && validDate(actionDate) && populated(task)) return { template: 5, text: `${task} is due ${due}; the last recorded action was ${lastAction} on ${actionDate}.` }
  if (validDate(due) && onlyOpen === true && populated(lane) && populated(client)) return { template: 3, text: `Due ${due}; the only open ${lane} task for ${client}.` }
  if (validDate(due) && populated(status)) return { template: 1, text: `Due ${due}; still marked ${status}.` }
  if (populated(projectStatus) && populated(client) && populated(task) && fields.open === true) return { template: 4, text: `${client}'s project is ${projectStatus}; ${task} remains open.` }
  if (validDate(updated) && populated(status)) return { template: 2, text: `Last updated ${updated}; currently ${status}.` }
  return { template: null, text: 'Required source fields are missing; review the recorded evidence.' }
}

export function recommendation(item, now = new Date(), events = []) {
  const today = chicagoDate(now)
  const claims = item.evaluation?.why || []
  const source = claims.find(c => c.source?.id === item.obligation_id || c.source?.id === item.project_id || c.source?.id === item.lead_id)?.source || claims[0]?.source
  const row = source?.fields || {}
  // No note-text parsing, guessed dates, or invented deadlines.
  const dueSource = claims.find(c => [c.source?.fields?.due_on, c.source?.fields?.due_date, c.source?.fields?.next_due_date].some(d => validDate(d) && d === item.actionable_on))?.source
  const dueRow = dueSource?.fields || row
  const due = [dueRow.due_on, dueRow.due_date, dueRow.next_due_date].find(validDate) || null
  const status = row.status || row.response_state || null
  const updated = populated(row.updated_at) && validDate(row.updated_at.slice(0, 10)) && Number.isFinite(Date.parse(row.updated_at)) ? chicagoDate(new Date(row.updated_at)) : null
  const last = events.filter(e => e.card_id === item.id && ['do','later','handoff','drop'].includes(e.action) && Date.parse(e.created_at) <= now.getTime()).sort((a,b) => b.created_at.localeCompare(a.created_at))[0]
  const project = claims.find(c => c.source?.table === 'operations_projects')?.source
  const client = claims.find(c => c.source?.table === 'clients' && c.source.fields?.id === project?.fields?.client_id)?.source
  const fields = { due, status, updated, task: item.human_action,
    projectStatus: project?.fields?.status || null, client: client?.fields?.name || null,
    open: project ? ['setup','in_progress','waiting_on_client','waiting_on_cws'].includes(project.fields.status) : false,
    lastAction: last?.action || null, actionDate: last ? chicagoDate(new Date(last.created_at)) : null }

  const why = evidenceWhy(fields)
  let type = null
  if (item.priority_tier === 1 && due && due <= today) type = 'urgent_deadline'
  else if (item.business_priority === 'GET MONEY' && due && due <= today && item.source_type !== 'fallback') type = 'money_follow_up'
  else if (item.department === 'MARKETING' && validDate(item.actionable_on)) type = 'marketing_action'
  else if (item.department === 'OPERATIONS' && (due && due < today || claims.some(c => c.source?.table === 'project_requirements' && c.source.fields?.status === 'needed'))) type = 'delivery_blocker'
  return { type, rule: type ? `${MOVE_POLICY}:${type}` : null, why, fields, source: source || null, due_source: dueSource || null, action_source: last ? { id: last.id, action: last.action, created_at: last.created_at } : null }
}

// Owner-recorded agreement comparison. Unknown means unknown, never "included".
export function scopeCheck(evidence) {
  const note = 'Review scope and additional effort before agreeing. Protect the $50/hour floor; no price or commitment is made.'
  if (!evidence || !populated(evidence.agreement_reference) || !populated(evidence.request)) return { status: 'needs_data', text: 'Compare the request with the agreement and revision allowance.', note }
  const { inclusion, revisions_used: used, revision_allowance: allowance, estimated_hours: hours, proposed_fee_cents: fee } = evidence
  const knownRevisions = Number.isSafeInteger(used) && used >= 0 && Number.isSafeInteger(allowance) && allowance >= 0
  const outside = inclusion === 'addition' || inclusion === 'revision' && knownRevisions && used >= allowance
  const belowFloor = Number.isSafeInteger(hours) && hours > 0 && Number.isSafeInteger(fee) && fee >= 0 && fee / hours < 5000
  return { status: outside ? 'likely_scope_change' : inclusion === 'revision' && knownRevisions ? 'included_revision' : 'needs_data',
    text: outside ? 'Likely scope change' : inclusion === 'revision' && knownRevisions ? 'Included revision within the recorded allowance' : 'Agreement comparison is incomplete', below_floor: belowFloor, note }
}

export function review30Days(rows, now = new Date()) {
  const end = now.getTime(), start = end - 30 * 864e5
  const groups = new Map()
  const latestOutcome = new Map()
  for (const row of rows) {
    if (row.action !== 'close' || !Number.isFinite(Date.parse(row.created_at)) || Date.parse(row.created_at) > end) continue
    const key = `${row.card_id}:${row.recommendation?.rule}`
    const old = latestOutcome.get(key)
    if (!old || row.created_at > old.created_at || row.created_at === old.created_at && row.id > old.id) latestOutcome.set(key, row)
  }
  for (const row of rows) {
    const time = Date.parse(row.created_at)
    if (!Number.isFinite(time) || time < start || time > end || !row.recommendation?.type) continue
    const key = row.recommendation.rule
    if (!groups.has(key)) groups.set(key, { rule: key, type: row.recommendation.type, accepted: 0, dropped: 0, deferred: 0, yes: 0, no: 0, pending: 0, skipped: 0 })
    const group = groups.get(key)
    if (row.action === 'do') group.accepted++
    if (row.action === 'drop') group.dropped++
    if (row.action === 'later') group.deferred++
    if (row.action === 'close' && latestOutcome.get(`${row.card_id}:${row.recommendation.rule}`) === row) {
      const field = { yes: 'yes', no: 'no', not_yet: 'pending', skip: 'skipped' }[row.outcome]
      if (field) group[field]++
    }
  }
  return [...groups.values()].map(g => ({ ...g, acceptance: g.accepted + g.dropped ? g.accepted / (g.accepted + g.dropped) : null }))
}

export function visibleMoves(items, events, now = new Date()) {
  const latest = new Map()
  for (const row of events) {
    if (!['later', 'close', 'drop', 'do'].includes(row.action)) continue
    const old = latest.get(row.card_id)
    if (!old || row.created_at > old.created_at || row.created_at === old.created_at && row.id > old.id) latest.set(row.card_id, row)
  }
  return items.filter(item => {
    const event = latest.get(item.id)
    if (!event) return true
    // Changed source evidence reopens a closed/dropped recommendation, never its source task.
    if (event.action !== 'later' && event.source_version !== sourceVersion(item)) return true
    if (event.action === 'close') return event.outcome === 'not_yet'
    if (event.action === 'drop') return false
    return event.action !== 'later' || event.defer_until <= chicagoDate(now)
  }).slice(0, 3)
}

export function sourceVersion(item) {
  return createHash('sha256').update(JSON.stringify([item.source_type, item.source_timestamp, item.actionable_on, (item.evaluation?.why || []).map(c => c.source)])).digest('hex')
}
