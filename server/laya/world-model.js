/** Company context only: no verdicts, model calls, persistence or external actions. */
export const WORLD_MODEL_VERSION = 'company-world-v1'
export const WORLD_TABLES = {
  profile: 'company_profiles', state: 'company_state_snapshots', units: 'company_units',
  constraints: 'company_constraints', opportunities: 'company_opportunities',
  decisions: 'business_decisions', decision_contexts: 'company_decision_contexts', outcomes: 'company_outcomes',
}
export const STATE_SECTIONS = ['financial', 'sales_pipeline', 'clients_projects', 'marketing', 'capacity', 'blockers', 'unknowns']
const PROFILE_FIELDS = ['mission', 'objective', 'legal_structure', 'operating_geography', 'jurisdictions', 'human_capabilities', 'company_capabilities', 'strategic_principles']
const CAP = 1000
const RECENT = 20
const HISTORY = new Set(['decisions', 'decision_contexts', 'outcomes'])

/** Freshness is evidence-driven; absence of an expiry never implies current. */
export function evidenceFreshness(row, now) {
  const observed = Date.parse(row?.observed_at)
  const expires = Date.parse(row?.valid_until)
  if (!Number.isFinite(observed)) return 'unknown'
  if (observed > now.getTime()) return 'invalid_future'
  if (!Number.isFinite(expires)) return 'unbounded'
  return expires <= now.getTime() ? 'stale' : 'current'
}

/**
 * Pure assembler. Read envelopes distinguish failed/capped reads from known empty
 * registers. Recent history is explicitly a window, never a complete register.
 */
export function assembleWorldModel({ workspaceId, workspace, reads = {}, now = new Date() }) {
  if (!workspaceId || !Number.isFinite(now.getTime())) throw new Error('Workspace and valid clock required')
  const missing = []
  const freshness = []
  const coverage = {}
  const records = {}
  for (const key of Object.keys(WORLD_TABLES)) {
    const read = reads[key]
    const scoped = Array.isArray(read?.data) && read.data.every(row => row.workspace_id === workspaceId)
    const available = scoped && !read.error && !read.truncated
    coverage[key] = { available, windowed: HISTORY.has(key), has_more: Boolean(read?.has_more) }
    records[key] = available ? read.data : null
    if (!available) missing.push({ path: key, reason: read?.truncated ? 'truncated' : 'unavailable' })
    for (const row of records[key] || []) {
      const status = evidenceFreshness(row, now)
      freshness.push({ table: WORLD_TABLES[key], id: row.id, observed_at: row.observed_at ?? null, valid_until: row.valid_until ?? null, status })
      if (status !== 'current') missing.push({ path: `${key}.${row.id}.evidence`, reason: status })
    }
  }
  const profile = records.profile?.[0] ?? null
  const snapshot = records.state?.[0] ?? null
  const stateCurrent = snapshot && evidenceFreshness(snapshot, now) === 'current'
  const identity = workspace?.id === workspaceId ? { id: workspace.id, name: workspace.name, slug: workspace.slug } : null
  if (!identity) missing.push({ path: 'identity', reason: 'unavailable' })
  const identityProfile = Object.fromEntries(PROFILE_FIELDS.map(key => [key, profile?.[key] ?? null]))
  for (const key of PROFILE_FIELDS) if (identityProfile[key] === null) missing.push({ path: `profile.${key}`, reason: 'unknown' })
  const currentState = Object.fromEntries(STATE_SECTIONS.map(key => [key, stateCurrent ? snapshot[key] ?? null : null]))
  for (const key of STATE_SECTIONS) if (currentState[key] === null) missing.push({ path: `current_state.${key}`, reason: stateCurrent ? 'unknown' : 'no_current_evidence' })
  const findUnknowns = (value, path) => {
    if (value === null) missing.push({ path, reason: 'unknown' })
    else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) findUnknowns(child, `${path}.${key}`)
    }
  }
  for (const key of STATE_SECTIONS) {
    if (currentState[key] !== null) findUnknowns(currentState[key], `current_state.${key}`)
  }
  for (const key of ['units', 'constraints', 'opportunities']) {
    for (const row of records[key] || []) findUnknowns(row, `${key}.${row.id}`)
  }
  return {
    schema_version: WORLD_MODEL_VERSION, workspace_id: workspaceId, assembled_at: now.toISOString(),
    authority: 'context_only', identity, profile: { ...identityProfile, source: profile },
    objective: identityProfile.objective, current_state: currentState, latest_state_snapshot: snapshot,
    business_units: records.units, constraints: records.constraints,
    bottlenecks: currentState.blockers, opportunities: records.opportunities,
    risks: { constraints: records.constraints?.filter(row => row.status !== 'retired') ?? null, opportunities: records.opportunities?.filter(row => row.risk != null).map(row => ({ opportunity_id: row.id, risk: row.risk, confidence: row.confidence })) ?? null },
    recent_decisions: records.decisions, recent_decision_contexts: records.decision_contexts,
    recent_outcomes: records.outcomes,
    lessons: records.outcomes?.filter(row => row.lesson != null).map(row => ({ outcome_id: row.id, lesson: row.lesson, recommendation: row.recommendation })) ?? null,
    missing_information: missing, evidence_freshness: freshness, coverage,
  }
}

/** Call only after active-owner authorization; service-role reads are scoped here. */
export async function loadWorldModel({ client, workspaceId }, now = new Date()) {
  const reads = {}
  const workspaceRead = await client.from('workspaces').select('id,name,slug').eq('id', workspaceId).maybeSingle()
  await Promise.all(Object.entries(WORLD_TABLES).map(async ([key, table]) => {
    const limit = ['profile', 'state'].includes(key) ? 1 : HISTORY.has(key) ? RECENT + 1 : CAP
    try {
      let query = client.from(table).select('*').eq('workspace_id', workspaceId)
      if (key === 'state') query = query.order('observed_at', { ascending: false, nullsFirst: false })
      const result = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit)
      const rows = result.data
      reads[key] = { error: Boolean(result.error), data: HISTORY.has(key) ? rows?.slice(0, RECENT) : rows,
        truncated: limit === CAP && rows?.length >= CAP, has_more: HISTORY.has(key) && rows?.length > RECENT }
    } catch { reads[key] = { error: true, data: null } }
  }))
  return assembleWorldModel({ workspaceId, workspace: workspaceRead.error ? null : workspaceRead.data, reads, now })
}
