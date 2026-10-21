import { loadResponseHistory, parseHistoryPosition } from '../server/laya/history.js'
import { buildDealFits } from '../server/laya/deal-fit.js'
import { buildGoalPace } from '../server/ceo/goal-pace.js'
import { authenticateWorkspace, missingOutreachEnv, parseBody } from '../server/outreach/shared.js'
import { createResponseToken, createEvaluationResponseToken, saveOwnerResponse } from '../server/laya/responses.js'
import { buildDecisionReviews } from '../server/decisions/reviews.js'
import { buildNegocioListoLifecycle } from '../server/lifecycle/negocio-listo.js'
import { buildCeoToday } from '../server/ceo/today.js'
import { loadReviewSummary } from '../server/laya/marketing.js'
import { buildOperationsReadModel } from '../server/operations/readiness.js'
import { buildAccountingReadModel } from '../server/accounting/read-model.js'
import { buildComplianceReadModel } from '../server/compliance/read-model.js'

const complianceRequirementFields = 'id, workspace_id, title, category, authority_name, source_url, jurisdiction, description, applicability_status, verified_by_owner_at, verified_by_owner_id, verified_source_at, recurrence_type, recurrence_interval, last_completed_at, next_due_date, status, notes, created_at, updated_at'
const complianceCompletionFields = 'id, workspace_id, compliance_requirement_id, completed_at, notes, created_at'

export default async function handler(req, res) {
  res.setHeader?.('Cache-Control', 'no-store')
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing CEO Today environment variables: ${missing.join(', ')}` })

  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  if (req.method === 'POST') {
    const owner = await context.client.from('workspace_members').select('role').eq('workspace_id', context.workspaceId)
      .eq('user_id', context.user.id).eq('status', 'active').maybeSingle()
    if (owner.error) return res.status(502).json({ ok: false, error: 'Ownership could not be verified.' })
    if (owner.data?.role !== 'owner') return res.status(403).json({ ok: false, error: 'Only the workspace owner can respond to Laya.' })
    const body = parseBody(req.body)
    if (body.action !== 'laya_response') return res.status(400).json({ ok: false, error: 'Unknown CEO Today action.' })
    const saved = await saveOwnerResponse(context, body)
    return res.status(saved.status).json(saved.error ? { ok: false, error: saved.error } : { ok: true, response_id: saved.id })
  }

  const params = new URL(req.url || '/api/ceo-today', 'http://localhost').searchParams
  const query = { ...Object.fromEntries(params), ...req.query }
  if (query.view === 'laya_history') {
    const owner = await context.client.from('workspace_members').select('role').eq('workspace_id', context.workspaceId)
      .eq('user_id', context.user.id).eq('status', 'active').maybeSingle()
    if (owner.error) return res.status(502).json({ ok: false, error: 'Ownership could not be verified.' })
    if (owner.data?.role !== 'owner') return res.status(403).json({ ok: false, error: 'Only the workspace owner can read Laya history.' })
    let position
    try { position = parseHistoryPosition(query.type, query.cursor, context.workspaceId, { response: query.response, from: query.from, to: query.to, search: query.search }) }
    catch (error) { return res.status(400).json({ ok: false, error: error.message }) }
    const history = await loadResponseHistory(context, position)
    return res.status(history.available ? 200 : 502).json(history.available
      ? { ok: true, laya_response_history: history }
      : { ok: false, error: 'Response history is unavailable. Try again.' })
  }

  const loaded = await loadCeoToday(context)
  if (loaded.error) return res.status(502).json({ ok: false, error: loaded.error })
  const [layaReviews, decisionRows, membership] = await Promise.all([
    loadReviewSummary(context.client, context.workspaceId),
    context.client.from('business_decisions').select('*').eq('workspace_id', context.workspaceId),
    context.user ? context.client.from('workspace_members').select('role').eq('workspace_id', context.workspaceId).eq('user_id', context.user.id).eq('status', 'active').maybeSingle() : Promise.resolve({ data: null }),
  ])
  const decisions = decisionRows.error
    ? { available: false, items: [], due_count: 0 }
    : buildDecisionReviews({ decisions: decisionRows.data || [], workspaceId: context.workspaceId })
  decisions.can_manage = !membership.error && membership.data?.role === 'owner'
  const historyPage = decisions.can_manage ? await loadResponseHistory(context) : { can_view: false }
  const history = { data: historyPage.items || [], error: historyPage.available === false }
  if(decisions.can_manage && decisions.available) {
    decisions.response_history_available=!history.error
    for(const row of decisions.items) {
      const source=decisionRows.data.find(item=>item.id===row.id)
      row.review_token=createResponseToken(context,source,row.evaluation)
      row.responses=(history.data || []).filter(item=>item.decision_id===row.id)
    }
  }
  const attachResponse=(evaluation,inputs)=>{
    if(!decisions.can_manage)return {can_respond:false}
    const token=createEvaluationResponseToken(context,inputs,evaluation)
    return {can_respond:Boolean(token),review_token:token,history_available:!history.error,
      unavailable_reason:token?null:'The exact evidence is too large to sign safely; no response can be saved for this view.',
      responses:(history.data || []).filter(item=>item.evaluator===evaluation.evaluator && item.subject_type===evaluation.subject.type && item.subject_id===evaluation.subject.id)}
  }
  loaded.data.goal_pace.owner_response=attachResponse(loaded.data.goal_pace,loaded.review_inputs.goal)
  for(const item of loaded.data.deal_fit?.items || []) {
    item.owner_response=attachResponse(item.evaluation,item.response_input)
    delete item.response_input
  }
  return res.status(200).json({ ok: true, ...loaded.data, laya_reviews: layaReviews, business_decisions: decisions, laya_response_history: historyPage })
}

export async function loadCeoToday(context, now = new Date()) {
  const [leads, promisedActions, outreachSends, attempts, resolutions, operationsProjects, operationsRequirements, operationsClients, obligations, receipts, recurringRevenue, complianceRequirements, complianceCompletions, goalEvidence, goalCompleteness, agreements, installments, dealBudgets, dealCosts] = await Promise.all([
    context.client.from('leads').select('id, workspace_id, source, name, email, company, status, sales_classification, response_state, phone, locality, last_contacted_at, created_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('sales_promised_actions').select('id, lead_id, action_text, due_on, completed_at, created_at').eq('workspace_id', context.workspaceId).is('completed_at', null).order('due_on', { ascending: true }).order('created_at', { ascending: true }),
    context.client.from('outreach_sends').select('id, lead_id, send_type, status, sent_at, created_at').eq('workspace_id', context.workspaceId).not('lead_id', 'is', null).order('created_at', { ascending: true }),
    context.client.from('marketing_publish_attempts').select('id, marketing_slot_key, asset_id, asset_path, destination, required_platforms, provider_status, provider_error, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: false }).limit(50),
    context.client.from('marketing_slot_resolutions').select('occurrence_slot_key, origin_slot_key, target_slot_key, action, asset_id, asset_path, caption, created_at, decided_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: false }),
    context.client.from('operations_projects').select('id, workspace_id, client_id, name, project_type, status, service_agreement_id, actual_hours, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('project_requirements').select('id, workspace_id, project_id, requirement_key, label, category, status, timing, responsible_party, notes, requested_at, received_at, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('clients').select('id, workspace_id, name, contact_email, contact_phone, status, created_at').eq('workspace_id', context.workspaceId).eq('status', 'active').order('name', { ascending: true }),
    context.client.from('financial_obligations').select('id, workspace_id, client_id, operations_project_id, description, amount_cents, currency, obligation_type, due_date, status, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('payment_receipts').select('id, workspace_id, financial_obligation_id, amount_cents, received_at, payment_method, reference_note, created_at').eq('workspace_id', context.workspaceId).order('received_at', { ascending: false }),
    context.client.from('recurring_revenue').select('id, workspace_id, client_id, description, amount_cents, currency, cadence, status, provider, provider_reference, started_at, next_expected_at, ended_at, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('compliance_requirements').select(complianceRequirementFields).eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('compliance_completions').select(complianceCompletionFields).eq('workspace_id', context.workspaceId).order('completed_at', { ascending: false }),
    context.client.from('negocio_listo_evidence').select('*').eq('workspace_id',context.workspaceId).order('revision',{ascending:false}).limit(1000),
    context.client.from('negocio_listo_completeness').select('*').eq('workspace_id',context.workspaceId).order('created_at',{ascending:false}).limit(10),
    context.client.from('client_service_agreements').select('id,workspace_id,client_id,product_name,setup_cents,monthly_cents,term_months,launch_date,created_at').eq('workspace_id',context.workspaceId),
    context.client.from('agreement_installments').select('id,workspace_id,agreement_id,installment,financial_obligation_id').eq('workspace_id',context.workspaceId),
    context.client.from('negocio_listo_deal_budgets').select('*').eq('workspace_id',context.workspaceId).order('revision',{ascending:false}).limit(1000),
    context.client.from('project_costs').select('id,workspace_id,operations_project_id,amount_cents,incurred_on,updated_at').eq('workspace_id',context.workspaceId).limit(1000),
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

  const lifecycle = agreements.error || installments.error
    ? {available:false,items:[]}
    : buildNegocioListoLifecycle({workspaceId:context.workspaceId,leads:leads.data || [],agreements:agreements.data || [],installments:installments.data || [],obligations:obligations.data || [],receipts:receipts.data || [],projects:operationsProjects.data || [],requirements:operationsRequirements.data || [],clients:operationsClients.data || [],now})
  const goalInput={workspaceId:context.workspaceId,agreements:agreements.data || [],evidence:goalEvidence.data || [],completeness:goalCompleteness.data || [],available:!agreements.error && !goalEvidence.error && !goalCompleteness.error && (agreements.data || []).length<1000 && (goalEvidence.data || []).length<1000,now}
  const dealInput={workspaceId:context.workspaceId,agreements:agreements.data || [],leads:leads.data || [],projects:operationsProjects.data || [],budgets:dealBudgets.data || [],costs:dealCosts.data || [],available:!agreements.error && !dealBudgets.error && !dealCosts.error && [agreements,leads,operationsProjects,dealBudgets,dealCosts].every(result=>(result.data || []).length<1000),now}
  const goalPace=buildGoalPace(goalInput)
  return {
    review_inputs:{goal:goalInput},
    data: buildCeoToday({
      dealFits: buildDealFits(dealInput),
      goalPace,
      lifecycle,
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
