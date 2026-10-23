import { buildNegocioListoLifecycle } from '../lifecycle/negocio-listo.js'
import { chicagoDate } from '../sales/queue.js'

const verdicts = { prospect: 'do', setup_payment_pending: 'do', payment_due: 'do', payment_overdue: 'do', waiting_on_cws: 'do', in_delivery: 'do', launch_record_pending: 'do', term_completed: 'do', waiting_on_client: 'hold', paused: 'hold', launched: 'hold', needs_data: 'needs_data' }
const tables = { projects: 'operations_projects', requirements: 'project_requirements', clients: 'clients', installments: 'agreement_installments', obligations: 'financial_obligations', receipts: 'payment_receipts' }
const realDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const cents = value => Number.isSafeInteger(value) && value >= 0

// These are the actual, minimal evaluator inputs, not a reconstructed snapshot
// of current facts at response-save time. All relationships use explicit IDs.
export function lifecycleInputs(input, item) {
  const own = key => (input[key] || []).filter(row => row.workspace_id === input.workspaceId)
  const lead = own('leads').find(row => row.id === item.lead_id) || null
  const agreement = own('agreements').find(row => row.id === item.agreement_id) || null
  const projects = agreement ? own('projects').filter(row => row.service_agreement_id === agreement.id && row.client_id === agreement.client_id) : []
  const installments = agreement ? own('installments').filter(row => row.agreement_id === agreement.id) : []
  const obligations = agreement ? own('obligations').filter(row => row.client_id === agreement.client_id && installments.some(i => i.financial_obligation_id === row.id)) : []
  return { workspaceId: input.workspaceId, lead, agreement, projects, installments, obligations,
    requirements: own('requirements').filter(row => projects.some(p => p.id === row.project_id)),
    receipts: own('receipts').filter(row => obligations.some(o => o.id === row.financial_obligation_id)),
    clients: agreement ? own('clients').filter(row => row.id === agreement.client_id) : [],
    available: input.available !== false, now: new Date(input.now).toISOString() }
}

export function evaluateLifecycle(inputs) {
  const { workspaceId, lead, agreement, available, now } = inputs
  const subject = { type: lead ? 'lead' : 'client_service_agreement', id: (lead || agreement)?.id, workspace_id: workspaceId }
  const today = chicagoDate(new Date(now))
  const projected = buildNegocioListoLifecycle({ ...inputs, leads: lead ? [lead] : [], agreements: agreement ? [agreement] : [] }).items[0]
  const missing = []
  if (!available) missing.push('Lifecycle source reads are unavailable or reached the completeness limit; no complete-state inference is safe.')
  if (!projected || (lead || agreement)?.workspace_id !== workspaceId) missing.push('A matching same-workspace Negocio Listo source is required.')
  if (projected?.stage === 'needs_data') missing.push(projected.why_now)
  if (agreement) {
    if (!cents(agreement.setup_cents) || !cents(agreement.monthly_cents) || !Number.isSafeInteger(agreement.term_months) || agreement.term_months < 1) missing.push('Agreement prices or term are missing or invalid.')
    if (agreement.launch_date && (!realDate(agreement.launch_date) || agreement.launch_date > today)) missing.push('The recorded launch date is invalid or in the future.')
    const indexes = inputs.installments.map(row => row.installment)
    if (new Set(indexes).size !== indexes.length || new Set(inputs.installments.map(row => row.financial_obligation_id)).size !== indexes.length || indexes.some(n => !Number.isSafeInteger(n) || n < 0 || n > agreement.term_months)) missing.push('Installment numbers are duplicate or inconsistent with the recorded term.')
    if (agreement.launch_date && (indexes.filter(n => n > 0).length !== agreement.term_months || (agreement.setup_cents > 0 && !indexes.includes(0)))) missing.push('The launched agreement does not have a complete recorded installment schedule.')
    for (const installment of inputs.installments) {
      const bill = inputs.obligations.find(row => row.id === installment.financial_obligation_id)
      const currentReceipts = inputs.receipts.filter(row => row.financial_obligation_id === bill?.id && cents(row.amount_cents) && Number.isFinite(Date.parse(row.received_at)) && Date.parse(row.received_at) <= Date.parse(now))
      const paid = currentReceipts.reduce((sum, row) => sum + row.amount_cents, 0)
      // A missing setup due date is irrelevant once valid recorded cash covers it.
      // Supplied dates and every monthly/unpaid obligation still require validation.
      const paidSetupWithoutDate = installment.installment === 0 && bill?.due_date == null && cents(bill?.amount_cents) && Number.isSafeInteger(paid) && paid >= bill.amount_cents
      if (!bill || bill.status !== 'expected' || !cents(bill.amount_cents) || bill.currency !== 'USD' || (!realDate(bill.due_date) && !paidSetupWithoutDate) || bill.amount_cents !== (installment.installment === 0 ? agreement.setup_cents : agreement.monthly_cents)) missing.push('A linked billing obligation is missing, void, non-USD or inconsistent with the agreement.')
    }
    if (inputs.receipts.some(row => !cents(row.amount_cents) || !Number.isFinite(Date.parse(row.received_at))) || !Number.isSafeInteger(inputs.receipts.reduce((sum, row) => sum + row.amount_cents, 0))) missing.push('A linked payment receipt has invalid amount or date evidence.')
    if (inputs.projects.some(row => row.actual_hours != null && (!Number.isSafeInteger(row.actual_hours) || row.actual_hours < 0))) missing.push('Recorded project hours must be whole nonnegative hours.')
  }
  const stage = projected?.stage || 'needs_data'
  const verdict = missing.length ? 'needs_data' : verdicts[stage] || 'needs_data'
  const rows = [...(lead ? [['leads', lead]] : []), ...(agreement ? [['client_service_agreements', agreement]] : []), ...Object.entries(tables).flatMap(([key, table]) => (inputs[key] || []).map(row => [table, row]))]
  const why = rows.map(([table, row]) => ({ claim: `Recorded ${table} evidence used for the ${stage.replaceAll('_', ' ')} review.`, source: { table, id: row.id, workspace_id: row.workspace_id, version: row.updated_at || row.created_at || null, fields: { ...row } } }))
  const bill = inputs.obligations.find(row => row.id === projected?.obligation_id)
  const paid = bill ? inputs.receipts.filter(row => row.financial_obligation_id === bill.id && Date.parse(row.received_at) <= Date.parse(now)).reduce((sum, row) => sum + row.amount_cents, 0) : 0
  const amount = bill ? Math.max(0, bill.amount_cents - paid) : null
  return { evaluator: 'lifecycle', policy_version: 'lifecycle-v2', subject, stage, verdict,
    next_action: verdict === 'needs_data' ? 'Review and complete the recorded lifecycle evidence before deciding the next move.' : verdict === 'hold' ? `Review the recorded ${stage.replaceAll('_', ' ')} state; no automatic follow-up or state change is authorized.` : projected.human_action,
    why, assumptions: ['Recorded launch and payment evidence do not prove signature or live provider subscription status.', 'Future-dated receipts are retained in the snapshot but excluded from current payment totals.', 'Act/Dismiss records advice review only; it performs no delivery, charge, send, publish, renewal or activation.'],
    missing_data: [...new Set(missing)], money_at_stake: verdict !== 'needs_data' && Number.isSafeInteger(amount) ? { amount_cents: amount, currency: 'USD' } : null,
    related_decisions: [], evaluated_at: new Date(now).toISOString(), business_date: today, time_zone: 'America/Chicago' }
}

export function evaluateLifecycleItems(lifecycle, input) {
  return { ...lifecycle, items: lifecycle.items.map(item => {
    const response_input = lifecycleInputs(input, item)
    return { ...item, evaluation: evaluateLifecycle(response_input), response_input }
  }) }
}
