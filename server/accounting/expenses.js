import { cents, cleanText, dateOnly, validUuid } from './shared.js'
import { businessToday } from '../../src/lib/businessExpenses.js'

export const EXPENSE_ACTIONS = ['mark_project_cost_paid', 'save_expense_subscription', 'create_business_expense', 'pay_business_expense']

export async function expenseAction(context, body, res) {
  const fail = (message) => res.status(400).json({ ok: false, error: message })
  if (body.action === 'mark_project_cost_paid') {
    const date = dateOnly(body.paid_on)
    if (!validUuid(body.id) || !date || date > businessToday()) return fail('Choose a project cost and a valid payment date no later than today.')
    const linked = await context.client.from('business_expenses').select('id').eq('workspace_id', context.workspaceId).eq('project_cost_id', body.id).maybeSingle()
    if (linked.error) return res.status(502).json({ ok: false, error: 'The linked expense could not be checked.' })
    if (linked.data) return res.status(409).json({ ok: false, error: 'This cost is already tracked by its business expense.' })
    const result = await context.client.from('project_costs').update({ paid_on: date }).eq('workspace_id', context.workspaceId).eq('id', body.id).is('paid_on', null).select('id').maybeSingle()
    if (result.error) return res.status(502).json({ ok: false, error: 'The payment date could not be saved.' })
    if (!result.data) return res.status(409).json({ ok: false, error: 'Cost not found or already confirmed. Refresh Accounting.' })
    return res.status(200).json({ ok: true })
  }
  if (body.action === 'pay_business_expense') {
    const paidOn = dateOnly(body.paid_on)
    if (!validUuid(body.id) || !cents(body.amount_cents) || !paidOn || paidOn > businessToday() || !['subscription', 'expense'].includes(body.kind)) return fail('Choose an expense, a positive actual amount, and a payment date no later than today.')
    if (body.kind === 'subscription' && (!Number.isInteger(body.cycle) || body.cycle < 0)) return fail('The billing cycle is invalid.')
    const result = await context.client.rpc('pay_business_expense', {
      p_workspace_id: context.workspaceId, p_id: body.id, p_kind: body.kind,
      p_cycle: body.cycle ?? null, p_amount_cents: cents(body.amount_cents), p_paid_on: paidOn, p_user_id: context.user.id,
    })
    if (result.error) return res.status(409).json({ ok: false, error: 'Payment could not be recorded. Refresh and check whether this bill was already paid or changed.' })
    return res.status(200).json({ ok: true })
  }
  const name = cleanText(body.name, 200)
  const category = cleanText(body.category, 80)
  const amount = cents(body.amount_cents)
  const projectId = body.operations_project_id || null
  if (!name || !category || !amount || (projectId && !validUuid(projectId))) return fail('Name, category, and a positive amount are required.')
  if (projectId) {
    const project = await context.client.from('operations_projects').select('id').eq('workspace_id', context.workspaceId).eq('id', projectId).maybeSingle()
    if (project.error) return res.status(502).json({ ok: false, error: 'The project could not be verified.' })
    if (!project.data) return fail('Choose a project in this workspace.')
  }
  const values = { name, category, amount_cents: amount, operations_project_id: projectId }
  let result
  if (body.action === 'save_expense_subscription') {
    if (!['monthly', 'annual'].includes(body.cadence) || !['active', 'paused', 'canceled'].includes(body.status) || typeof body.variable !== 'boolean') return fail('Choose a billing frequency, status, and amount type.')
    const anchor = dateOnly(body.billing_anchor)
    if (!anchor || anchor < '2000-01-01' || anchor > '2100-01-01') return fail('Choose a valid first billing date between 2000 and 2100.')
    Object.assign(values, { status: body.status, variable: body.variable })
    if (body.id) {
      if (!validUuid(body.id)) return fail('Subscription is invalid.')
      // The anchor is immutable after creation; price/status changes affect unpaid forecasts only.
      result = await context.client.from('expense_subscriptions').update(values).eq('id', body.id).eq('workspace_id', context.workspaceId).select('id').maybeSingle()
    } else {
      result = await context.client.from('expense_subscriptions').insert({ ...values, cadence: body.cadence, billing_anchor: anchor, workspace_id: context.workspaceId, created_by: context.user.id }).select('id').maybeSingle()
    }
  } else {
    const due = dateOnly(body.due_on)
    if (!due) return fail('Choose a valid due date.')
    result = await context.client.from('business_expenses').insert({ ...values, due_on: due, workspace_id: context.workspaceId, created_by: context.user.id }).select('id').maybeSingle()
  }
  if (result.error) return res.status(502).json({ ok: false, error: 'The expense could not be saved.' })
  if (!result.data) return res.status(404).json({ ok: false, error: 'Expense not found.' })
  return res.status(200).json({ ok: true })
}
