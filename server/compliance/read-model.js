export const COMPLIANCE_CATEGORIES = ['business_registration', 'license', 'tax', 'filing', 'insurance', 'employment', 'privacy', 'other']
export const APPLICABILITY_STATUSES = ['needs_verification', 'applies', 'not_applicable']
export const RECURRENCE_TYPES = ['none', 'one_time', 'annual', 'quarterly', 'monthly', 'custom']
export const COMPLIANCE_STATUSES = ['active', 'retired']
export const APPROACHING_WINDOW_DAYS = 30

export function buildComplianceReadModel({ workspaceId, requirements = [], completions = [], now = new Date() } = {}) {
  const today = localDate(now)
  const completionsByRequirement = new Map()
  for (const completion of completions || []) {
    if (!completion || completion.workspace_id !== workspaceId) continue
    const rows = completionsByRequirement.get(completion.compliance_requirement_id) || []
    rows.push(completion)
    completionsByRequirement.set(completion.compliance_requirement_id, rows)
  }

  const rows = (requirements || [])
    .filter((requirement) => requirement?.workspace_id === workspaceId)
    .map((requirement) => requirementReadModel({
      requirement,
      completions: completionsByRequirement.get(requirement.id) || [],
      today,
    }))
    .sort(compareRequirements)

  const activeRows = rows.filter((row) => row.status === 'active')
  const count = (state) => activeRows.filter((row) => row.compliance_state === state).length
  const summary = {
    verified_requirements: activeRows.filter((row) => row.applicability_status === 'applies').length,
    needs_verification: count('unverified'),
    approaching: count('approaching'),
    due: count('due'),
    overdue: count('overdue'),
  }

  return {
    summary: {
      ...summary,
      attention_message: attentionMessage(summary),
    },
    requirements: rows,
    recent_completions: activeRows
      .flatMap((row) => row.completions.map((completion) => ({ ...completion, requirement_id: row.id, requirement_title: row.title })))
      .sort((left, right) => String(right.completed_at).localeCompare(String(left.completed_at)) || String(right.created_at).localeCompare(String(left.created_at)) || left.id.localeCompare(right.id)),
    ceo_projection: buildCeoProjection(activeRows),
  }
}

export function requirementReadModel({ requirement, completions = [], today = localDate(new Date()) }) {
  const completionRows = [...completions]
    .sort((left, right) => String(right.completed_at).localeCompare(String(left.completed_at)) || String(right.created_at).localeCompare(String(left.created_at)) || left.id.localeCompare(right.id))
  const state = complianceState({ requirement, today })
  return {
    id: requirement.id,
    workspace_id: requirement.workspace_id,
    title: requirement.title,
    category: requirement.category,
    authority_name: requirement.authority_name,
    source_url: requirement.source_url || null,
    jurisdiction: requirement.jurisdiction || null,
    description: requirement.description,
    applicability_status: requirement.applicability_status,
    verified_by_owner_at: requirement.verified_by_owner_at || null,
    verified_source_at: requirement.verified_source_at || null,
    recurrence_type: requirement.recurrence_type,
    recurrence_interval: requirement.recurrence_interval || null,
    last_completed_at: requirement.last_completed_at || null,
    next_due_date: requirement.next_due_date || null,
    status: requirement.status,
    notes: requirement.notes || null,
    created_at: requirement.created_at,
    updated_at: requirement.updated_at,
    compliance_state: state,
    human_reason: complianceReason({ requirement, state }),
    completions: completionRows.map((completion) => ({
      id: completion.id,
      completed_at: completion.completed_at,
      notes: completion.notes || null,
      created_at: completion.created_at,
    })),
  }
}

export function complianceState({ requirement, today }) {
  if (requirement.status === 'retired') return 'retired'
  if (requirement.applicability_status === 'needs_verification') return 'unverified'
  if (requirement.applicability_status === 'not_applicable') return 'not_applicable'
  if (!requirement.verified_by_owner_at) return 'unverified'
  if (!validDate(requirement.next_due_date)) return 'ok'
  const days = daysBetween(today, requirement.next_due_date)
  if (days < 0) return 'overdue'
  if (days === 0) return 'due'
  if (days <= APPROACHING_WINDOW_DAYS) return 'approaching'
  return 'ok'
}

export function buildCeoProjection(rows = []) {
  return rows
    .filter((row) => ['unverified', 'approaching', 'due', 'overdue'].includes(row.compliance_state))
    .map((row) => ({
      requirement_id: row.id,
      title: row.title,
      compliance_state: `compliance_${row.compliance_state === 'unverified' ? 'needs_verification' : row.compliance_state}`,
      next_due_date: row.next_due_date || null,
      authority_name: row.authority_name,
      human_reason: row.compliance_state === 'unverified'
        ? `Verify whether ${row.title} applies. Authority to review: ${row.authority_name}.`
        : row.human_reason,
      source_timestamp: row.created_at,
    }))
    .sort(compareProjection)
}

function complianceReason({ requirement, state }) {
  if (state === 'unverified') return `Owner verification is required before this can be treated as a CWS obligation.`
  if (state === 'not_applicable') return `Owner reviewed this requirement and marked it not applicable.`
  if (state === 'retired') return `This requirement is retained as history and is no longer active.`
  if (!requirement.next_due_date) return requirement.last_completed_at
    ? `Owner verified this requirement. Last completed ${requirement.last_completed_at}; no next due date is recorded.`
    : `Owner verified this requirement. No next due date is recorded.`
  if (state === 'overdue') return `Owner-verified requirement was due ${requirement.next_due_date}.`
  if (state === 'due') return `Owner-verified requirement is due today (${requirement.next_due_date}).`
  if (state === 'approaching') return `Owner-verified requirement is due ${requirement.next_due_date}.`
  return `Owner-verified requirement is next due ${requirement.next_due_date}.`
}

function attentionMessage(summary) {
  if (summary.needs_verification) return `${summary.needs_verification} requirement${summary.needs_verification === 1 ? ' needs' : 's need'} owner verification.`
  if (summary.overdue) return `${summary.overdue} verified requirement${summary.overdue === 1 ? ' is' : 's are'} overdue.`
  if (summary.due) return `${summary.due} verified requirement${summary.due === 1 ? ' is' : 's are'} due today.`
  if (summary.approaching) return `${summary.approaching} verified requirement${summary.approaching === 1 ? ' is' : 's are'} approaching.`
  return 'No verified Compliance deadlines currently require attention.'
}

function compareRequirements(left, right) {
  const order = { overdue: 0, due: 1, approaching: 2, unverified: 3, ok: 4, not_applicable: 5, retired: 6 }
  return (order[left.compliance_state] - order[right.compliance_state])
    || String(left.next_due_date || '9999-12-31').localeCompare(String(right.next_due_date || '9999-12-31'))
    || String(left.created_at).localeCompare(String(right.created_at))
    || left.id.localeCompare(right.id)
}

function compareProjection(left, right) {
  const order = { compliance_overdue: 0, compliance_due: 1, compliance_approaching: 2, compliance_needs_verification: 3 }
  return (order[left.compliance_state] - order[right.compliance_state])
    || String(left.next_due_date || '9999-12-31').localeCompare(String(right.next_due_date || '9999-12-31'))
    || String(left.source_timestamp).localeCompare(String(right.source_timestamp))
    || left.requirement_id.localeCompare(right.requirement_id)
}

function daysBetween(left, right) {
  const leftDate = new Date(`${left}T00:00:00.000Z`)
  const rightDate = new Date(`${right}T00:00:00.000Z`)
  return Math.round((rightDate.getTime() - leftDate.getTime()) / 86400000)
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
}

export function localDate(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now)
  return date.toISOString().slice(0, 10)
}
