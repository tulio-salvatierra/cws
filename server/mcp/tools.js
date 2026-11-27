// MCP-READ-001 (DEC-041): AUTO-only tools. Every tool reads; none writes, drafts, or sends.
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
}

export const TOOL_NAMES = ['get_ceo_today']
