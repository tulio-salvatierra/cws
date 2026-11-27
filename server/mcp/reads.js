// MCP-READ-002 (DEC-041): workspace-scoped reads for the MCP tools. SELECT only.
import { buildOperationsReadModel } from '../operations/readiness.js'
import { buildAccountingReadModel } from '../accounting/read-model.js'
import { buildComplianceReadModel } from '../compliance/read-model.js'

const ROW_CAP = 1000
const chicagoDate = (now) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
const addDays = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10)
const unavailable = (what) => ({ error: `${what} could not be loaded.` })
const complete = (...results) => results.every(result => (result.data || []).length < ROW_CAP)

export async function readLeads(context, { status, response_state, include_contact = false, limit = 50 } = {}) {
  let query = context.client.from('leads')
    .select('id, name, company, source, status, sales_classification, response_state, locality, email, phone, last_contacted_at, created_at')
    .eq('workspace_id', context.workspaceId).eq('is_test', false)
  if (status) query = query.eq('status', status)
  if (response_state) query = query.eq('response_state', response_state)
  const rows = await query.order('created_at', { ascending: false }).limit(limit)
  if (rows.error) return unavailable('Leads')
  return {
    leads: (rows.data || []).map(({ email, phone, ...lead }) => include_contact ? { ...lead, email, phone } : lead),
    returned: (rows.data || []).length,
    limit,
    contact_details: include_contact ? 'included' : 'omitted (pass include_contact: true)',
  }
}

export async function readPromisedActions(context, { overdue_only = false } = {}, now = new Date()) {
  const today = chicagoDate(now)
  let query = context.client.from('sales_promised_actions').select('id, lead_id, action_text, due_on, created_at')
    .eq('workspace_id', context.workspaceId).is('completed_at', null)
  if (overdue_only) query = query.lt('due_on', today)
  const promises = await query.order('due_on', { ascending: true }).limit(200)
  if (promises.error) return unavailable('Promised actions')
  const leadIds = [...new Set((promises.data || []).map(row => row.lead_id).filter(Boolean))]
  const leads = leadIds.length
    ? await context.client.from('leads').select('id, name, company, is_test').eq('workspace_id', context.workspaceId).in('id', leadIds)
    : { data: [] }
  if (leads.error) return unavailable('Promised actions')
  const leadById = new Map((leads.data || []).map(lead => [lead.id, lead]))
  const items = (promises.data || [])
    .filter(row => !leadById.get(row.lead_id)?.is_test)
    .map(row => {
      const lead = leadById.get(row.lead_id)
      return {
        action: row.action_text, due_on: row.due_on,
        state: !row.due_on ? 'no_date' : row.due_on < today ? 'overdue' : row.due_on === today ? 'due_today' : 'upcoming',
        lead: lead ? { id: lead.id, name: lead.name, company: lead.company } : null,
      }
    })
  return { business_date: today, open_count: items.length, promised_actions: items }
}

async function loadOperations(context, projectId) {
  let projects = context.client.from('operations_projects')
    .select('id, workspace_id, client_id, name, project_type, status, service_agreement_id, actual_hours, created_at, updated_at')
    .eq('workspace_id', context.workspaceId)
  if (projectId) projects = projects.eq('id', projectId)
  let requirements = context.client.from('project_requirements')
    .select('id, workspace_id, project_id, requirement_key, label, category, status, timing, responsible_party, notes, requested_at, received_at, created_at, updated_at')
    .eq('workspace_id', context.workspaceId)
  if (projectId) requirements = requirements.eq('project_id', projectId)
  const [projectRows, requirementRows, clients] = await Promise.all([
    projects.order('created_at', { ascending: true }),
    requirements.order('created_at', { ascending: true }),
    context.client.from('clients').select('id, workspace_id, name, status').eq('workspace_id', context.workspaceId),
  ])
  if (projectRows.error || requirementRows.error || clients.error) return null
  return {
    model: buildOperationsReadModel({ workspaceId: context.workspaceId, projects: projectRows.data || [], requirements: requirementRows.data || [], clients: clients.data || [] }),
    complete: complete(projectRows, requirementRows, clients),
  }
}

const projectSummary = (project) => ({
  id: project.id, name: project.name, client: project.client?.name || null, project_type: project.project_type,
  status: project.status, delivery_state: project.delivery_state, readiness: project.readiness,
  blocker_count: project.blocker_count, current_blocker: project.current_blocker?.label || null,
  oldest_blocker_since: project.oldest_blocker_since, actual_hours: project.actual_hours, human_reason: project.human_reason,
})

export async function readProjects(context, { delivery_state, include_closed = false } = {}) {
  const loaded = await loadOperations(context)
  if (!loaded) return unavailable('Projects')
  const projects = loaded.model.projects
    .filter(project => include_closed || !['completed', 'paused'].includes(project.status))
    .filter(project => !delivery_state || project.delivery_state === delivery_state)
  return { complete: loaded.complete, projects: projects.map(projectSummary) }
}

export async function readProject(context, { project_id }) {
  const loaded = await loadOperations(context, project_id)
  if (!loaded) return unavailable('The project')
  const project = loaded.model.projects[0]
  if (!project) return { error: 'No project with that id in this workspace.' }
  return {
    ...projectSummary(project),
    requirements: project.requirements.map(row => ({
      label: row.label, category: row.category, status: row.status, timing: row.timing,
      responsible_party: row.responsible_party, requested_at: row.requested_at, received_at: row.received_at, notes: row.notes,
    })),
  }
}

export async function readAccounting(context, now = new Date()) {
  const [obligations, receipts, recurring, clients, projects] = await Promise.all([
    context.client.from('financial_obligations').select('id, workspace_id, client_id, operations_project_id, description, amount_cents, currency, obligation_type, due_date, status, created_at, updated_at').eq('workspace_id', context.workspaceId),
    context.client.from('payment_receipts').select('id, workspace_id, financial_obligation_id, amount_cents, received_at, payment_method, created_at').eq('workspace_id', context.workspaceId),
    context.client.from('recurring_revenue').select('id, workspace_id, client_id, description, amount_cents, currency, cadence, status, started_at, next_expected_at, ended_at, created_at, updated_at').eq('workspace_id', context.workspaceId),
    context.client.from('clients').select('id, workspace_id, name, status').eq('workspace_id', context.workspaceId),
    context.client.from('operations_projects').select('id, workspace_id, name').eq('workspace_id', context.workspaceId),
  ])
  if ([obligations, receipts, recurring, clients, projects].some(result => result.error)) return unavailable('Accounting')
  const model = buildAccountingReadModel({
    workspaceId: context.workspaceId, obligations: obligations.data || [], receipts: receipts.data || [],
    recurringRevenue: recurring.data || [], clients: clients.data || [], operationsProjects: projects.data || [], now,
  })
  const obligation = (row) => ({
    description: row.description, client: row.client?.name || null, project: row.project?.name || null, obligation_type: row.obligation_type,
    due_date: row.due_date, amount_cents: row.amount_cents, received_amount_cents: row.received_amount_cents,
    outstanding_amount_cents: row.outstanding_amount_cents, financial_state: row.financial_state,
  })
  return {
    currency: model.currency,
    complete: complete(obligations, receipts, recurring, clients, projects),
    summary: model.summary,
    summary_note: 'Ledger totals from Accounting. The CEO Today monthly-recurring tile also counts active Negocio Listo agreements.',
    overdue: model.overdue_obligations.map(obligation),
    outstanding: model.outstanding_obligations.map(obligation),
    recent_receipts: model.recent_receipts.map(row => ({ amount_cents: row.amount_cents, received_at: row.received_at, payment_method: row.payment_method, for: row.obligation_description || null })),
    recurring_revenue: model.recurring_revenue.map(row => ({ description: row.description, client: row.client?.name || null, amount_cents: row.amount_cents, cadence: row.cadence, status: row.status, next_expected_at: row.next_expected_at })),
  }
}

export async function readComplianceDue(context, { within_days = 30 } = {}, now = new Date()) {
  const today = chicagoDate(now)
  const horizon = addDays(today, within_days)
  const [requirements, completions] = await Promise.all([
    context.client.from('compliance_requirements').select('id, workspace_id, title, category, authority_name, source_url, jurisdiction, description, applicability_status, verified_by_owner_at, verified_source_at, recurrence_type, recurrence_interval, last_completed_at, next_due_date, status, notes, created_at, updated_at').eq('workspace_id', context.workspaceId),
    context.client.from('compliance_completions').select('id, workspace_id, compliance_requirement_id, completed_at, notes, created_at').eq('workspace_id', context.workspaceId),
  ])
  if (requirements.error || completions.error) return unavailable('Compliance')
  const model = buildComplianceReadModel({ workspaceId: context.workspaceId, requirements: requirements.data || [], completions: completions.data || [], now })
  const items = model.requirements
    .filter(row => row.status === 'active')
    .filter(row => ['overdue', 'due', 'approaching', 'unverified'].includes(row.compliance_state) || (row.next_due_date && row.next_due_date <= horizon))
    .map(row => ({
      title: row.title, category: row.category, authority: row.authority_name, jurisdiction: row.jurisdiction,
      next_due_date: row.next_due_date, compliance_state: row.compliance_state, human_reason: row.human_reason,
      last_completed_at: row.last_completed_at, source_url: row.source_url,
    }))
  return { business_date: today, within_days, through: horizon, summary: model.summary, items }
}
