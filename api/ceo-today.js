import { authenticateWorkspace, missingOutreachEnv } from '../server/outreach/shared.js'
import { buildCeoToday } from '../server/ceo/today.js'
import { loadReviewSummary } from '../server/laya/marketing.js'
import { buildOperationsReadModel } from '../server/operations/readiness.js'
import { buildAccountingReadModel } from '../server/accounting/read-model.js'
import { buildComplianceReadModel } from '../server/compliance/read-model.js'

const complianceRequirementFields = 'id, workspace_id, title, category, authority_name, source_url, jurisdiction, description, applicability_status, verified_by_owner_at, verified_by_owner_id, verified_source_at, recurrence_type, recurrence_interval, last_completed_at, next_due_date, status, notes, created_at, updated_at'
const complianceCompletionFields = 'id, workspace_id, compliance_requirement_id, completed_at, notes, created_at'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing CEO Today environment variables: ${missing.join(', ')}` })

  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  const loaded = await loadCeoToday(context)
  if (loaded.error) return res.status(502).json({ ok: false, error: loaded.error })
  const layaReviews = await loadReviewSummary(context.client, context.workspaceId)
  return res.status(200).json({ ok: true, ...loaded.data, laya_reviews: layaReviews })
}

export async function loadCeoToday(context, now = new Date()) {
  const [leads, promisedActions, outreachSends, attempts, resolutions, operationsProjects, operationsRequirements, operationsClients, obligations, receipts, recurringRevenue, complianceRequirements, complianceCompletions] = await Promise.all([
    context.client.from('leads').select('id, name, email, company, status, sales_classification, response_state, phone, locality, last_contacted_at, created_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('sales_promised_actions').select('id, lead_id, action_text, due_on, completed_at, created_at').eq('workspace_id', context.workspaceId).is('completed_at', null).order('due_on', { ascending: true }).order('created_at', { ascending: true }),
    context.client.from('outreach_sends').select('id, lead_id, send_type, status, sent_at, created_at').eq('workspace_id', context.workspaceId).not('lead_id', 'is', null).order('created_at', { ascending: true }),
    context.client.from('marketing_publish_attempts').select('id, marketing_slot_key, asset_id, asset_path, destination, provider_status, provider_error, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: false }).limit(50),
    context.client.from('marketing_slot_resolutions').select('occurrence_slot_key, origin_slot_key, target_slot_key, action, asset_id, asset_path, caption, created_at, decided_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: false }),
    context.client.from('operations_projects').select('id, workspace_id, client_id, name, project_type, status, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('project_requirements').select('id, workspace_id, project_id, requirement_key, label, category, status, timing, responsible_party, notes, requested_at, received_at, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('clients').select('id, workspace_id, name, contact_email, contact_phone, status, created_at').eq('workspace_id', context.workspaceId).eq('status', 'active').order('name', { ascending: true }),
    context.client.from('financial_obligations').select('id, workspace_id, client_id, operations_project_id, description, amount_cents, currency, obligation_type, due_date, status, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('payment_receipts').select('id, workspace_id, financial_obligation_id, amount_cents, received_at, payment_method, reference_note, created_at').eq('workspace_id', context.workspaceId).order('received_at', { ascending: false }),
    context.client.from('recurring_revenue').select('id, workspace_id, client_id, description, amount_cents, currency, cadence, status, provider, provider_reference, started_at, next_expected_at, ended_at, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('compliance_requirements').select(complianceRequirementFields).eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('compliance_completions').select(complianceCompletionFields).eq('workspace_id', context.workspaceId).order('completed_at', { ascending: false }),
  ])
  const failed = [leads, promisedActions, outreachSends, attempts, resolutions, operationsProjects, operationsRequirements, operationsClients, obligations, receipts, recurringRevenue, complianceRequirements, complianceCompletions].find((result) => result.error)
  if (failed) return { data: null, error: 'CEO Today could not load the current workspace state.' }

  const attemptRows = attempts.data || []
  const attemptIds = attemptRows.map((attempt) => attempt.id).filter(Boolean)
  let destinationResults = []
  if (attemptIds.length) {
    const results = await context.client.from('marketing_publish_destination_results')
      .select('attempt_id, provider_status, provider_error')
      .in('attempt_id', attemptIds)
    if (results.error) return { data: null, error: 'CEO Today could not load Marketing delivery state.' }
    destinationResults = results.data || []
  }

  const resultsByAttempt = new Map()
  for (const result of destinationResults) {
    const values = resultsByAttempt.get(result.attempt_id) || []
    values.push(result)
    resultsByAttempt.set(result.attempt_id, values)
  }

  const operations = buildOperationsReadModel({
    workspaceId: context.workspaceId,
    projects: operationsProjects.data || [],
    requirements: operationsRequirements.data || [],
    clients: operationsClients.data || [],
  })
  const accounting = buildAccountingReadModel({
    workspaceId: context.workspaceId,
    obligations: obligations.data || [],
    receipts: receipts.data || [],
    recurringRevenue: recurringRevenue.data || [],
    clients: operationsClients.data || [],
    operationsProjects: operationsProjects.data || [],
    now,
  })
  const compliance = buildComplianceReadModel({
    workspaceId: context.workspaceId,
    requirements: complianceRequirements.data || [],
    completions: complianceCompletions.data || [],
    now,
  })

  return {
    data: buildCeoToday({
      leads: leads.data || [],
      promisedActions: promisedActions.data || [],
      outreachSends: outreachSends.data || [],
      marketingAttempts: attemptRows.map((attempt) => ({
        ...attempt,
        destination_results: resultsByAttempt.get(attempt.id) || [],
      })),
      marketingResolutions: resolutions.data || [],
      operationsProjects: operations.ceo_projection,
      accountingProjection: accounting.ceo_projection,
      complianceProjection: compliance.ceo_projection,
      now,
    }),
    error: null,
  }
}
