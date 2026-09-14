export const OBLIGATION_TYPES = ['deposit', 'milestone', 'final_payment', 'recurring', 'other']
export const OBLIGATION_STATUSES = ['expected', 'waived', 'cancelled']
export const PAYMENT_METHODS = ['zelle', 'square', 'check', 'cash', 'bank_transfer', 'other']
export const RECURRING_PROVIDERS = ['square', 'manual', 'other']
export const RECURRING_STATUSES = ['active', 'paused', 'ended']
export const USD = 'USD'

const ACTIVE_OBLIGATION_STATUS = 'expected'

export function buildAccountingReadModel({ workspaceId, obligations = [], receipts = [], recurringRevenue = [], clients = [], operationsProjects = [], now = new Date() } = {}) {
  const today = localDate(now)
  const clientById = new Map((clients || [])
    .filter((client) => client?.workspace_id === workspaceId)
    .map((client) => [client.id, client]))
  const projectById = new Map((operationsProjects || [])
    .filter((project) => project?.workspace_id === workspaceId)
    .map((project) => [project.id, project]))
  const receiptsByObligation = new Map()

  for (const receipt of receipts || []) {
    if (!receipt || receipt.workspace_id !== workspaceId || !positiveCents(receipt.amount_cents)) continue
    const rows = receiptsByObligation.get(receipt.financial_obligation_id) || []
    rows.push(receipt)
    receiptsByObligation.set(receipt.financial_obligation_id, rows)
  }

  const obligationRows = (obligations || [])
    .filter((obligation) => obligation?.workspace_id === workspaceId)
    .map((obligation) => obligationReadModel({
      obligation,
      receipts: receiptsByObligation.get(obligation.id) || [],
      client: clientById.get(obligation.client_id) || null,
      project: projectById.get(obligation.operations_project_id) || null,
      today,
    }))
    .sort(compareObligations)

  const recurringRows = (recurringRevenue || [])
    .filter((item) => item?.workspace_id === workspaceId)
    .map((item) => recurringReadModel({ item, client: clientById.get(item.client_id) || null, today }))
    .sort(compareRecurring)

  const receiptRows = [...receiptsByObligation.values()]
    .flat()
    .map((receipt) => receiptReadModel({ receipt, obligation: obligationRows.find((row) => row.id === receipt.financial_obligation_id) || null }))
    .sort((left, right) => String(right.received_at).localeCompare(String(left.received_at)) || left.id.localeCompare(right.id))

  const activeObligations = obligationRows.filter((row) => row.status === ACTIVE_OBLIGATION_STATUS)
  const outstanding = activeObligations.reduce((sum, row) => sum + row.outstanding_amount_cents, 0)
  const overdue = activeObligations.filter((row) => row.financial_state === 'payment_overdue')
  const projection = [
    ...activeObligations
      .filter((row) => ['payment_due', 'payment_overdue'].includes(row.financial_state))
      .map(financialProjection),
    ...recurringRows
      .filter((row) => row.financial_state === 'recurring_attention')
      .map((row) => recurringProjection(row, today)),
  ].sort(compareProjection)

  return {
    currency: USD,
    summary: {
      expected_amount_cents: activeObligations.reduce((sum, row) => sum + row.amount_cents, 0),
      received_amount_cents: receiptRows.reduce((sum, row) => sum + row.amount_cents, 0),
      outstanding_amount_cents: outstanding,
      overdue_amount_cents: overdue.reduce((sum, row) => sum + row.outstanding_amount_cents, 0),
      monthly_recurring_revenue_cents: recurringRows
        .filter((row) => row.status === 'active' && row.cadence === 'monthly')
        .reduce((sum, row) => sum + row.amount_cents, 0),
    },
    obligations: obligationRows,
    outstanding_obligations: activeObligations.filter((row) => row.outstanding_amount_cents > 0),
    overdue_obligations: overdue,
    recent_receipts: receiptRows.slice(0, 10),
    recurring_revenue: recurringRows,
    ceo_projection: projection,
  }
}

export function obligationReadModel({ obligation, receipts = [], client = null, project = null, today = localDate(new Date()) }) {
  const amountCents = numericCents(obligation.amount_cents)
  const receivedCents = receipts.reduce((sum, receipt) => sum + numericCents(receipt.amount_cents), 0)
  const active = obligation.status === ACTIVE_OBLIGATION_STATUS
  const outstandingCents = active ? Math.max(0, amountCents - receivedCents) : 0
  const financialState = obligationFinancialState({ status: obligation.status, dueDate: obligation.due_date, amountCents, receivedCents, outstandingCents, today })
  return {
    id: obligation.id,
    workspace_id: obligation.workspace_id,
    client_id: obligation.client_id,
    operations_project_id: obligation.operations_project_id || null,
    description: obligation.description,
    amount_cents: amountCents,
    currency: obligation.currency || USD,
    obligation_type: obligation.obligation_type,
    due_date: obligation.due_date || null,
    status: obligation.status,
    created_at: obligation.created_at,
    updated_at: obligation.updated_at,
    client: client ? { id: client.id, name: client.name } : null,
    project: project ? { id: project.id, name: project.name } : null,
    received_amount_cents: receivedCents,
    outstanding_amount_cents: outstandingCents,
    financial_state: financialState,
    receipt_count: receipts.length,
  }
}

export function obligationFinancialState({ status, dueDate, amountCents, receivedCents, outstandingCents, today }) {
  if (status === 'waived') return 'waived'
  if (status === 'cancelled') return 'cancelled'
  if (receivedCents >= amountCents && amountCents > 0) return 'received'
  if (outstandingCents <= 0) return 'received'
  if (!validDate(dueDate)) return 'expected'
  if (dueDate < today) return 'payment_overdue'
  if (dueDate === today) return 'payment_due'
  return 'expected'
}

function recurringReadModel({ item, client = null, today }) {
  const nextExpected = item.next_expected_at || null
  const attention = item.status === 'active' && validDate(nextExpected) && nextExpected <= today
  return {
    id: item.id,
    workspace_id: item.workspace_id,
    client_id: item.client_id,
    description: item.description,
    amount_cents: numericCents(item.amount_cents),
    currency: item.currency || USD,
    cadence: item.cadence,
    status: item.status,
    provider: item.provider,
    provider_reference: item.provider_reference || null,
    started_at: item.started_at,
    next_expected_at: nextExpected,
    ended_at: item.ended_at || null,
    created_at: item.created_at,
    updated_at: item.updated_at,
    client: client ? { id: client.id, name: client.name } : null,
    financial_state: attention ? 'recurring_attention' : 'recurring_ok',
  }
}

function receiptReadModel({ receipt, obligation }) {
  return {
    id: receipt.id,
    financial_obligation_id: receipt.financial_obligation_id,
    amount_cents: numericCents(receipt.amount_cents),
    received_at: receipt.received_at,
    payment_method: receipt.payment_method,
    reference_note: receipt.reference_note || null,
    created_at: receipt.created_at,
    obligation_description: obligation?.description || 'Financial obligation',
    client_name: obligation?.client?.name || 'Client unavailable',
  }
}

function financialProjection(row) {
  const overdue = row.financial_state === 'payment_overdue'
  const datePhrase = row.due_date ? ` due ${row.due_date}` : ''
  return {
    id: `financial_obligation:${row.id}`,
    financial_obligation_id: row.id,
    client_name: row.client?.name || 'Client unavailable',
    project_name: row.project?.name || null,
    amount_outstanding_cents: row.outstanding_amount_cents,
    currency: row.currency,
    due_date: row.due_date,
    source_timestamp: row.created_at,
    financial_state: row.financial_state,
    human_reason: overdue
      ? `${row.client?.name || 'Client'} has an overdue payment for ${row.description}${datePhrase}.`
      : `${row.client?.name || 'Client'} has a payment due for ${row.description}${datePhrase}.`,
  }
}

function recurringProjection(row, today) {
  const overdue = row.next_expected_at < today
  return {
    id: `recurring_revenue:${row.id}`,
    recurring_revenue_id: row.id,
    client_name: row.client?.name || 'Client unavailable',
    project_name: null,
    amount_outstanding_cents: row.amount_cents,
    currency: row.currency,
    due_date: row.next_expected_at,
    source_timestamp: row.created_at,
    financial_state: 'recurring_attention',
    human_reason: overdue
      ? `Recurring revenue for ${row.client?.name || 'this client'} needs owner review; its expected date was ${row.next_expected_at}.`
      : `Recurring revenue for ${row.client?.name || 'this client'} is expected today.`,
  }
}

function compareObligations(left, right) {
  const order = { payment_overdue: 1, payment_due: 2, expected: 3, received: 4, waived: 5, cancelled: 6 }
  return (order[left.financial_state] || 9) - (order[right.financial_state] || 9)
    || String(left.due_date || '9999-12-31').localeCompare(String(right.due_date || '9999-12-31'))
    || String(left.created_at).localeCompare(String(right.created_at))
    || left.id.localeCompare(right.id)
}

function compareRecurring(left, right) {
  const order = { recurring_attention: 1, recurring_ok: 2 }
  return (order[left.financial_state] || 9) - (order[right.financial_state] || 9)
    || String(left.next_expected_at || '9999-12-31').localeCompare(String(right.next_expected_at || '9999-12-31'))
    || left.id.localeCompare(right.id)
}

function compareProjection(left, right) {
  const order = { payment_overdue: 1, payment_due: 2, recurring_attention: 3 }
  return (order[left.financial_state] || 9) - (order[right.financial_state] || 9)
    || String(left.due_date || '').localeCompare(String(right.due_date || ''))
    || left.id.localeCompare(right.id)
}

export function localDate(now) {
  return chicagoDate(now)
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function numericCents(value) {
  return positiveCents(value) ? Number(value) : 0
}

function positiveCents(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0
}
import { chicagoDate } from '../sales/queue.js'
