// MCP-READ-001 (DEC-041): AUTO-only tools. Every tool reads; none writes, drafts, or sends.
import { z } from 'zod'
import * as defaultReads from './reads.js'

const SECRET_KEY = /(^|_)token$|_token_|^token_|^signature$|service_key|provider_reference|response_input|input_snapshot|register_snapshot/i

// Deep copy without signing tokens, provider references, or raw review snapshots.
export function stripSecrets(value) {
  if (Array.isArray(value)) return value.map(stripSecrets)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !SECRET_KEY.test(key))
      .map(([key, item]) => [key, stripSecrets(item)]))
  }
  return value
}

const pick = (row, keys) => Object.fromEntries(keys.filter(key => row?.[key] !== undefined).map(key => [key, row[key]]))

export function summarizeCeoToday(data) {
  const actions = (data.actions || []).map(item => ({
    ...pick(item, ['department', 'business_priority', 'human_action', 'why_now', 'href', 'cta_label', 'actionable_on', 'lifecycle_stage']),
    why_now: item.next_move?.why?.text || item.why_now,
    laya: item.evaluation ? pick(item.evaluation, ['verdict', 'next_action', 'missing_data']) : null,
  }))
  const pace = data.goal_pace
  return stripSecrets({
    business_date: pace?.business_date || null,
    time_zone: 'America/Chicago',
    money: data.money || { available: false },
    goal_pace: pace ? pick(pace, ['verdict', 'goal', 'checkpoint', 'verified', 'next_action', 'missing_data', 'forecast_note']) : null,
    do_next: actions,
    recent_leads: data.recent_leads?.available === false
      ? { available: false }
      : { available: true, since: data.recent_leads?.since, total: data.recent_leads?.total ?? 0 },
    note: 'Read-only snapshot of CWS OS CEO Today. Act in /admin; nothing here changes records.',
  })
}

function jsonContent(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] }
}

function errorContent(message) {
  return { isError: true, content: [{ type: 'text', text: message }] }
}

// deps.loadCeoToday(context) → { data, error } with move visibility already applied.
export function registerTools(server, context, deps) {
  server.registerTool('get_ceo_today', {
    title: 'CEO Today',
    description: 'Today\'s ordered priorities (urgent → GET MONEY → Marketing → DELIVER), money totals, Negocio Listo goal pace, and recent lead count. Read-only.',
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => {
    try {
      const loaded = await deps.loadCeoToday(context)
      if (loaded.error) return errorContent(loaded.error)
      return jsonContent(summarizeCeoToday(loaded.data))
    } catch {
      return errorContent('CEO Today is unavailable right now.')
    }
  })

  const reads = deps.reads || defaultReads
  const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  const register = (name, title, description, inputSchema, run) => server.registerTool(name, { title, description, inputSchema, annotations: readOnly }, async (args = {}) => {
    try {
      const result = await run(args)
      return result?.error ? errorContent(result.error) : jsonContent(stripSecrets(result))
    } catch {
      return errorContent(`${title} is unavailable right now.`)
    }
  })

  register('list_leads', 'Leads', 'Live (non-test) Sales leads, newest first. Contact details are omitted unless include_contact is true. Read-only; never contacts anyone.', {
    status: z.enum(['new', 'contacted', 'responded', 'won', 'lost', 'unresponsive']).optional(),
    response_state: z.enum(['no_response', 'warm', 'neutral']).optional(),
    include_contact: z.boolean().optional().describe('Include email and phone. Default false.'),
    limit: z.number().int().min(1).max(100).optional().describe('Default 50.'),
  }, args => reads.readLeads(context, { ...args, limit: args.limit ?? 50 }))

  register('list_promised_actions', 'Promised follow-ups', 'Open Sales promises ("I said I\'d call Friday") with due dates in Chicago time, excluding test leads. Read-only.', {
    overdue_only: z.boolean().optional(),
  }, args => reads.readPromisedActions(context, args))

  register('list_projects', 'Projects', 'Delivery projects with readiness, blockers, who they are waiting on, and hours. Closed (completed/paused) projects are hidden unless include_closed is true. Read-only.', {
    delivery_state: z.enum(['waiting_on_client', 'waiting_on_cws', 'ready_to_work', 'completed', 'paused']).optional(),
    include_closed: z.boolean().optional(),
  }, args => reads.readProjects(context, args))

  register('get_project', 'Project', 'One project with every requirement and its status. Use an id from list_projects. Read-only.', {
    project_id: z.string().uuid(),
  }, args => reads.readProject(context, args))

  register('get_accounting_summary', 'Accounting', 'Ledger totals, overdue and outstanding bills, recent receipts, and recurring revenue. Amounts are USD cents. Read-only; never charges or refunds.', {},
    () => reads.readAccounting(context))

  register('list_compliance_due', 'Compliance', 'Active compliance requirements that are overdue, due, approaching, unverified, or due within the window. Read-only.', {
    within_days: z.number().int().min(1).max(90).optional().describe('Default 30.'),
  }, args => reads.readComplianceDue(context, { within_days: args.within_days ?? 30 }))
}

export const TOOL_NAMES = ['get_ceo_today', 'list_leads', 'list_promised_actions', 'list_projects', 'get_project', 'get_accounting_summary', 'list_compliance_due']
