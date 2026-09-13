import {
  OBLIGATION_TYPES,
  PAYMENT_METHODS,
  RECURRING_PROVIDERS,
  USD,
  buildAccountingReadModel,
} from './read-model.js'
import {
  authenticateAccountingOwner,
  authenticateWorkspace,
  cents,
  cleanText,
  dateOnly,
  missingAccountingEnv,
  parseBody,
  receiptTimestamp,
  validUuid,
} from './shared.js'

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  const missing = missingAccountingEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing Accounting environment variables: ${missing.join(', ')}` })
  return req.method === 'GET' ? loadAccounting(req, res) : runOwnerAction(req, res)
}

async function loadAccounting(req, res) {
  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  const [obligations, receipts, recurringRevenue, clients, projects] = await Promise.all([
    context.client.from('financial_obligations')
      .select('id, workspace_id, client_id, operations_project_id, description, amount_cents, currency, obligation_type, due_date, status, created_at, updated_at')
      .eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('payment_receipts')
      .select('id, workspace_id, financial_obligation_id, amount_cents, received_at, payment_method, reference_note, created_at')
      .eq('workspace_id', context.workspaceId).order('received_at', { ascending: false }),
    context.client.from('recurring_revenue')
      .select('id, workspace_id, client_id, description, amount_cents, currency, cadence, status, provider, provider_reference, started_at, next_expected_at, ended_at, created_at, updated_at')
      .eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('clients')
      .select('id, workspace_id, name, status').eq('workspace_id', context.workspaceId).eq('status', 'active').order('name', { ascending: true }),
    context.client.from('operations_projects')
      .select('id, workspace_id, client_id, name, status').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
  ])
  const failed = [obligations, receipts, recurringRevenue, clients, projects].find((result) => result.error)
  if (failed) return res.status(502).json({ ok: false, error: failed.error.message })

  return res.status(200).json({
    ok: true,
    accounting: buildAccountingReadModel({
      workspaceId: context.workspaceId,
      obligations: obligations.data || [],
      receipts: receipts.data || [],
      recurringRevenue: recurringRevenue.data || [],
      clients: clients.data || [],
      operationsProjects: projects.data || [],
    }),
    clients: clients.data || [],
    operations_projects: projects.data || [],
  })
}

async function runOwnerAction(req, res) {
  const context = await authenticateAccountingOwner(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const body = parseBody(req.body)
  if (body.action === 'create_financial_obligation') return createFinancialObligation(context, body, res)
  if (body.action === 'record_payment_receipt') return recordPaymentReceipt(context, body, res)
  if (body.action === 'resolve_financial_obligation') return resolveFinancialObligation(context, body, res)
  if (body.action === 'create_recurring_revenue') return createRecurringRevenue(context, body, res)
  if (body.action === 'set_recurring_revenue_status') return setRecurringRevenueStatus(context, body, res)
  return res.status(400).json({ ok: false, error: 'Unknown Accounting action.' })
}

async function createFinancialObligation(context, body, res) {
  const values = {
    clientId: cleanText(body.client_id, 50),
    projectId: cleanText(body.operations_project_id, 50) || null,
    description: cleanText(body.description, 500),
    amountCents: cents(body.amount_cents),
    obligationType: cleanText(body.obligation_type, 50),
    dueDate: dateOnly(body.due_date),
  }
  if (!validUuid(values.clientId) || !values.description || !values.amountCents || !OBLIGATION_TYPES.includes(values.obligationType) || (body.due_date && !values.dueDate)) {
    return res.status(400).json({ ok: false, error: 'Client, description, amount, and obligation type are required.' })
  }
  if (values.projectId && !validUuid(values.projectId)) return res.status(400).json({ ok: false, error: 'The linked Operations project is invalid.' })

  const linked = await validateClientAndProject(context, values.clientId, values.projectId)
  if (linked.error) return res.status(linked.status).json({ ok: false, error: linked.error })

  const result = await context.client.from('financial_obligations').insert({
    workspace_id: context.workspaceId,
    client_id: values.clientId,
    operations_project_id: values.projectId,
    description: values.description,
    amount_cents: values.amountCents,
    currency: USD,
    obligation_type: values.obligationType,
    due_date: values.dueDate,
    status: 'expected',
    created_by: context.user.id,
  }).select('id, workspace_id, client_id, operations_project_id, description, amount_cents, currency, obligation_type, due_date, status, created_at, updated_at').maybeSingle()
  if (result.error) return res.status(502).json({ ok: false, error: 'The expected payment could not be saved.' })
  return res.status(201).json({ ok: true, obligation: result.data })
}

async function recordPaymentReceipt(context, body, res) {
  const obligationId = cleanText(body.financial_obligation_id, 50)
  const amountCents = cents(body.amount_cents)
  const paymentMethod = cleanText(body.payment_method, 50)
  const receivedAt = receiptTimestamp(body.received_at)
  const referenceNote = cleanText(body.reference_note, 500) || null
  if (!validUuid(obligationId) || !amountCents || !PAYMENT_METHODS.includes(paymentMethod) || !receivedAt) {
    return res.status(400).json({ ok: false, error: 'Obligation, positive receipt amount, received date, and payment method are required.' })
  }
  const obligation = await context.client.from('financial_obligations')
    .select('id, workspace_id, amount_cents, status').eq('id', obligationId).eq('workspace_id', context.workspaceId).maybeSingle()
  if (obligation.error) return res.status(502).json({ ok: false, error: 'The financial obligation could not be loaded.' })
  if (!obligation.data) return res.status(404).json({ ok: false, error: 'Financial obligation not found.' })
  if (obligation.data.status !== 'expected') return res.status(409).json({ ok: false, error: 'A receipt can only be recorded for an expected payment.' })

  const existing = await context.client.from('payment_receipts')
    .select('amount_cents').eq('financial_obligation_id', obligationId).eq('workspace_id', context.workspaceId)
  if (existing.error) return res.status(502).json({ ok: false, error: 'Existing payment receipts could not be loaded.' })
  const receivedCents = (existing.data || []).reduce((sum, receipt) => sum + Number(receipt.amount_cents || 0), 0)
  if (receivedCents + amountCents > Number(obligation.data.amount_cents)) {
    return res.status(409).json({ ok: false, error: 'The receipt amount exceeds the outstanding payment.' })
  }

  const result = await context.client.from('payment_receipts').insert({
    workspace_id: context.workspaceId,
    financial_obligation_id: obligationId,
    amount_cents: amountCents,
    received_at: receivedAt,
    payment_method: paymentMethod,
    reference_note: referenceNote,
    recorded_by: context.user.id,
  }).select('id, workspace_id, financial_obligation_id, amount_cents, received_at, payment_method, reference_note, created_at').maybeSingle()
  if (result.error) return res.status(409).json({ ok: false, error: 'The receipt could not be recorded. It may exceed the outstanding payment.' })
  return res.status(201).json({ ok: true, receipt: result.data })
}

async function resolveFinancialObligation(context, body, res) {
  const obligationId = cleanText(body.financial_obligation_id, 50)
  const status = cleanText(body.status, 50)
  if (!validUuid(obligationId) || !['waived', 'cancelled'].includes(status)) {
    return res.status(400).json({ ok: false, error: 'A financial obligation and valid resolution are required.' })
  }
  const result = await context.client.from('financial_obligations')
    .update({ status }).eq('id', obligationId).eq('workspace_id', context.workspaceId)
    .select('id, status, updated_at').maybeSingle()
  if (result.error) return res.status(502).json({ ok: false, error: 'The expected payment could not be resolved.' })
  if (!result.data) return res.status(404).json({ ok: false, error: 'Financial obligation not found.' })
  return res.status(200).json({ ok: true, obligation: result.data })
}

async function createRecurringRevenue(context, body, res) {
  const values = {
    clientId: cleanText(body.client_id, 50),
    description: cleanText(body.description, 500),
    amountCents: cents(body.amount_cents),
    provider: cleanText(body.provider, 50),
    providerReference: cleanText(body.provider_reference, 500) || null,
    startedAt: dateOnly(body.started_at, { required: true }),
    nextExpectedAt: dateOnly(body.next_expected_at),
  }
  if (!validUuid(values.clientId) || !values.description || !values.amountCents || !RECURRING_PROVIDERS.includes(values.provider) || !values.startedAt || (body.next_expected_at && !values.nextExpectedAt)) {
    return res.status(400).json({ ok: false, error: 'Client, description, amount, provider, and start date are required.' })
  }
  const linked = await validateClientAndProject(context, values.clientId, null)
  if (linked.error) return res.status(linked.status).json({ ok: false, error: linked.error })
  const result = await context.client.from('recurring_revenue').insert({
    workspace_id: context.workspaceId,
    client_id: values.clientId,
    description: values.description,
    amount_cents: values.amountCents,
    currency: USD,
    cadence: 'monthly',
    status: 'active',
    provider: values.provider,
    provider_reference: values.providerReference,
    started_at: values.startedAt,
    next_expected_at: values.nextExpectedAt,
    created_by: context.user.id,
  }).select('id, workspace_id, client_id, description, amount_cents, currency, cadence, status, provider, provider_reference, started_at, next_expected_at, ended_at, created_at, updated_at').maybeSingle()
  if (result.error) return res.status(502).json({ ok: false, error: 'Recurring revenue could not be saved.' })
  return res.status(201).json({ ok: true, recurring_revenue: result.data })
}

async function setRecurringRevenueStatus(context, body, res) {
  const recurringId = cleanText(body.recurring_revenue_id, 50)
  const status = cleanText(body.status, 50)
  if (!validUuid(recurringId) || !['paused', 'ended'].includes(status)) {
    return res.status(400).json({ ok: false, error: 'Recurring revenue and a valid status are required.' })
  }
  const endedAt = status === 'ended' ? dateOnly(body.ended_at, { required: true }) : null
  if (status === 'ended' && !endedAt) return res.status(400).json({ ok: false, error: 'An end date is required when ending recurring revenue.' })
  const update = status === 'ended' ? { status, ended_at: endedAt } : { status }
  const result = await context.client.from('recurring_revenue').update(update)
    .eq('id', recurringId).eq('workspace_id', context.workspaceId)
    .select('id, status, ended_at, updated_at').maybeSingle()
  if (result.error) return res.status(502).json({ ok: false, error: 'Recurring revenue could not be updated.' })
  if (!result.data) return res.status(404).json({ ok: false, error: 'Recurring revenue not found.' })
  return res.status(200).json({ ok: true, recurring_revenue: result.data })
}

async function validateClientAndProject(context, clientId, projectId) {
  const client = await context.client.from('clients')
    .select('id, workspace_id').eq('id', clientId).eq('workspace_id', context.workspaceId).eq('status', 'active').maybeSingle()
  if (client.error) return { error: 'The client could not be verified.', status: 502 }
  if (!client.data) return { error: 'Client not found in this workspace.', status: 404 }
  if (!projectId) return { data: { client: client.data, project: null } }
  const project = await context.client.from('operations_projects')
    .select('id, workspace_id, client_id').eq('id', projectId).eq('workspace_id', context.workspaceId).maybeSingle()
  if (project.error) return { error: 'The Operations project could not be verified.', status: 502 }
  if (!project.data || project.data.client_id !== clientId) return { error: 'The Operations project must belong to the selected client.', status: 400 }
  return { data: { client: client.data, project: project.data } }
}
