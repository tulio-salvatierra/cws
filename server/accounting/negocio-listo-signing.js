/* global process */
// "Signed" for Negocio Listo (DEC-040): one owner action that records the deal in
// Accounting and, if asked, creates the matching Square subscription.
//   setup $300 paid at signing -> monthly plan starts 14 days later -> 12 months.
import { NEGOCIO_LISTO } from '../../src/data/negocioListo.js'
import { businessToday } from '../../src/lib/businessExpenses.js'
import { PAYMENT_METHODS } from './read-model.js'
import { cleanText, dateOnly, validUuid } from './shared.js'
import { createSquareClient, squareConfigured } from './square.js'

export const SIGN_ACTION = 'sign_negocio_listo'
export const SETUP_CENTS = 30000
export const BILLING_DELAY_DAYS = 14
export const TERM_MONTHS = 12

export function negocioListoPlans() {
  return NEGOCIO_LISTO.en.plans.items.map((plan) => ({ id: plan.id, name: plan.name, monthly_cents: plan.price * 100 }))
}

export function addDays(day, days) {
  const date = new Date(`${day}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function validateSigning(body, today = businessToday()) {
  const plan = negocioListoPlans().find((item) => item.id === body.plan)
  const setupPaidOn = dateOnly(body.setup_paid_on)
  const name = cleanText(body.client_name, 200)
  const email = cleanText(body.client_email, 254)?.toLowerCase() || null
  const phone = cleanText(body.client_phone, 50) || null
  if (!validUuid(body.signing_id) || !validUuid(body.receipt_id)) return { error: 'Missing signing identifiers; reload and try again.' }
  if (!plan) return { error: 'Choose Básico, Crecer or Destacado.' }
  if (body.client_id ? !validUuid(body.client_id) : !name) return { error: 'Choose an existing client or enter the business name.' }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Enter a valid client email.' }
  if (!setupPaidOn || setupPaidOn > today || setupPaidOn < addDays(today, -60)) return { error: 'Enter the date the $300 setup was paid (today or up to 60 days ago).' }
  if (!PAYMENT_METHODS.includes(body.setup_method)) return { error: 'Choose how the setup was paid.' }
  if (body.lead_id && !validUuid(body.lead_id)) return { error: 'Invalid lead.' }
  if (body.create_square_subscription && !email && !body.client_id) return { error: 'Square needs the client email to send monthly invoices.' }
  return { value: { plan, setupPaidOn, billingStart: addDays(setupPaidOn, BILLING_DELAY_DAYS), name, email, phone, clientId: body.client_id || null, leadId: body.lead_id || null, method: body.setup_method, square: Boolean(body.create_square_subscription), signingId: body.signing_id, receiptId: body.receipt_id } }
}

async function resolveClient(context, input) {
  if (input.clientId) {
    const found = await context.client.from('clients').select('id, name, contact_email, contact_phone, status').eq('id', input.clientId).eq('workspace_id', context.workspaceId).maybeSingle()
    if (found.error || !found.data || found.data.status !== 'active') throw new Error('Choose an active client.')
    return found.data
  }
  const existing = await context.client.from('clients').select('id, name, contact_email, contact_phone, status').eq('workspace_id', context.workspaceId).eq('status', 'active').ilike('name', input.name).limit(1)
  if (existing.error) throw new Error(existing.error.message)
  if (existing.data?.[0]) return existing.data[0]
  const created = await context.client.from('clients').insert({ workspace_id: context.workspaceId, name: input.name, contact_email: input.email, contact_phone: input.phone, created_by: context.user.id }).select('id, name, contact_email, contact_phone, status').single()
  if (created.error) throw new Error(created.error.message)
  return created.data
}

async function rpc(context, name, params) {
  const result = await context.client.rpc(name, { p_workspace_id: context.workspaceId, p_user_id: context.user.id, ...params })
  if (result.error) throw new Error(`${name}: ${result.error.message}`)
  return result.data
}

export async function signNegocioListo(context, body, res, { square = null, env = process.env, today = businessToday() } = {}) {
  const checked = validateSigning(body, today)
  if (checked.error) return res.status(400).json({ ok: false, error: checked.error })
  const input = checked.value
  let client, setupObligationId
  try {
    client = await resolveClient(context, input)
    const productName = `Negocio Listo — ${input.plan.name}`
    await rpc(context, 'create_client_service_agreement', { p_id: input.signingId, p_client_id: client.id, p_offer_id: null, p_product_name: productName, p_setup_cents: SETUP_CENTS, p_monthly_cents: input.plan.monthly_cents, p_term_months: TERM_MONTHS, p_setup_obligation_id: null })
    const setup = await context.client.from('agreement_installments').select('financial_obligation_id').eq('agreement_id', input.signingId).eq('installment', 0).single()
    if (setup.error) throw new Error(setup.error.message)
    setupObligationId = setup.data.financial_obligation_id
    await rpc(context, 'record_agreement_payment', { p_obligation_id: setupObligationId, p_receipt_id: input.receiptId, p_amount_cents: SETUP_CENTS, p_received_at: `${input.setupPaidOn}T12:00:00.000Z`, p_method: input.method, p_note: 'Negocio Listo setup (paid at signing)' })
    await rpc(context, 'schedule_client_service_agreement_billing', { p_id: input.signingId, p_billing_start_date: input.billingStart })
    if (input.leadId) {
      const won = await context.client.from('leads').update({ status: 'won' }).eq('id', input.leadId).eq('workspace_id', context.workspaceId)
      if (won.error) throw new Error(won.error.message)
    }
  } catch (error) {
    return res.status(409).json({ ok: false, error: `The agreement could not be recorded: ${error.message}` })
  }

  const result = { ok: true, agreement_id: input.signingId, client_id: client.id, plan: input.plan.id, monthly_cents: input.plan.monthly_cents, setup_paid_on: input.setupPaidOn, billing_start_date: input.billingStart, square: { requested: input.square } }
  if (!input.square) return res.status(200).json(result)
  const email = input.email || client.contact_email
  if (!squareConfigured(env)) return res.status(200).json({ ...result, square: { requested: true, ok: false, error: 'SQUARE_ACCESS_TOKEN is not set on the server.' } })
  if (!email) return res.status(200).json({ ...result, square: { requested: true, ok: false, error: 'The client has no email, so Square cannot send invoices.' } })
  try {
    const sq = square || createSquareClient({ token: env.SQUARE_ACCESS_TOKEN })
    const locationId = await sq.locationId()
    const customerId = await sq.findOrCreateCustomer({ name: client.name, email, phone: input.phone || client.contact_phone, idempotencyKey: `${input.signingId}-customer` })
    const planVariationId = await sq.planVariationId({ planName: `Negocio Listo — ${input.plan.name} ($${input.plan.monthly_cents / 100}/mo)`, monthlyCents: input.plan.monthly_cents, idempotencyKey: `nl-${input.plan.id}-${input.plan.monthly_cents}` })
    const subscriptionId = await sq.createSubscription({ idempotencyKey: `${input.signingId}-subscription`, locationId, planVariationId, customerId, startDate: input.billingStart })
    const saved = await context.client.from('client_service_agreements').update({ square_subscription_reference: subscriptionId }).eq('id', input.signingId).eq('workspace_id', context.workspaceId)
    if (saved.error) throw new Error(`Square subscription ${subscriptionId} was created but not saved on the agreement: ${saved.error.message}`)
    return res.status(200).json({ ...result, square: { requested: true, ok: true, subscription_id: subscriptionId, customer_id: customerId, start_date: input.billingStart } })
  } catch (error) {
    return res.status(200).json({ ...result, square: { requested: true, ok: false, error: error.message } })
  }
}
