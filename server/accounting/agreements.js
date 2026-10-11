import { cents, cleanText, dateOnly, receiptTimestamp, validUuid } from './shared.js'
import { businessToday } from '../../src/lib/businessExpenses.js'
import { PAYMENT_METHODS } from './read-model.js'
export const AGREEMENT_ACTIONS = ['create_client_agreement', 'launch_client_agreement', 'record_agreement_payment']
export async function agreementAction(context, body, res) {
  const base = { p_workspace_id: context.workspaceId, p_user_id: context.user.id }
  let name, params
  if (body.action === 'create_client_agreement') {
    const setup = Number(body.setup_cents), term = Number(body.term_months)
    if (!validUuid(body.id) || !validUuid(body.client_id) || (body.offer_id && !validUuid(body.offer_id)) || (body.setup_obligation_id && !validUuid(body.setup_obligation_id)) || !cleanText(body.product_name, 200) || !Number.isSafeInteger(setup) || setup < 0 || setup > 1000000000 || !cents(body.monthly_cents) || !Number.isInteger(term) || term < 1 || term > 60) return res.status(400).json({ ok: false, error: 'Choose a customer, product, setup amount, monthly amount, and term of 1–60 months.' })
    name = 'create_client_service_agreement'
    params = { ...base, p_id: body.id, p_client_id: body.client_id, p_offer_id: body.offer_id || null, p_product_name: cleanText(body.product_name, 200), p_setup_cents: setup, p_monthly_cents: cents(body.monthly_cents), p_term_months: term, p_setup_obligation_id: body.setup_obligation_id || null }
  } else if (body.action === 'launch_client_agreement') {
    const date = dateOnly(body.launch_date)
    if (!validUuid(body.id) || !date || date > businessToday()) return res.status(400).json({ ok: false, error: 'Choose the actual website launch date, today or earlier.' })
    name = 'launch_client_service_agreement'
    params = { ...base, p_id: body.id, p_launch_date: date }
  } else {
    const received = receiptTimestamp(body.received_at)
    if (!validUuid(body.financial_obligation_id) || !validUuid(body.receipt_id) || !cents(body.amount_cents) || !received || String(body.received_at).slice(0, 10) > businessToday() || !PAYMENT_METHODS.includes(body.payment_method)) return res.status(400).json({ ok: false, error: 'Choose a bill, positive payment amount, actual date, and payment method.' })
    name = 'record_agreement_payment'
    params = { ...base, p_obligation_id: body.financial_obligation_id, p_receipt_id: body.receipt_id, p_amount_cents: cents(body.amount_cents), p_received_at: received, p_method: body.payment_method, p_note: cleanText(body.reference_note, 500) || null }
  }
  const result = await context.client.rpc(name, params)
  if (result.error) return res.status(409).json({ ok: false, error: 'Agreement change could not be saved. Check the customer, existing setup payment, and dates; refresh before retrying.' })
  return res.status(200).json({ ok: true, id: result.data })
}
