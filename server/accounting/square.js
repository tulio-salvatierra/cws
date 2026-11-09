/* global process */
// Minimal Square REST client for Negocio Listo subscriptions (DEC-040).
// Server-only: uses SQUARE_ACCESS_TOKEN. Never exposes card data; Square emails
// the invoices and holds any card the customer saves.
const SQUARE_API = 'https://connect.squareup.com/v2'
const SQUARE_VERSION = '2025-01-23'

export function squareConfigured(env = process.env) {
  return Boolean(env.SQUARE_ACCESS_TOKEN?.trim())
}

export function createSquareClient({ token = process.env.SQUARE_ACCESS_TOKEN, fetchImpl = fetch } = {}) {
  async function call(method, path, body) {
    const response = await fetchImpl(`${SQUARE_API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Square-Version': SQUARE_VERSION, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = payload.errors?.map((error) => error.detail || error.code).filter(Boolean).join('; ')
      throw new Error(`Square ${path.split('?')[0]}: ${detail || response.status}`)
    }
    return payload
  }
  return {
    async locationId() {
      const { locations = [] } = await call('GET', '/locations')
      const active = locations.find((location) => location.status === 'ACTIVE')
      if (!active) throw new Error('Square has no active location.')
      return active.id
    },
    async findOrCreateCustomer({ name, email, phone, idempotencyKey }) {
      const found = await call('POST', '/customers/search', { query: { filter: { email_address: { exact: email } } }, limit: 1 })
      if (found.customers?.[0]) return found.customers[0].id
      const created = await call('POST', '/customers', { idempotency_key: idempotencyKey, company_name: name, email_address: email, ...(phone ? { phone_number: phone } : {}) })
      return created.customer.id
    },
    async planVariationId({ planName, monthlyCents, idempotencyKey }) {
      const search = await call('POST', '/catalog/search', { object_types: ['SUBSCRIPTION_PLAN'], include_related_objects: true })
      const plan = search.objects?.find((object) => object.subscription_plan_data?.name === planName)
      const existing = plan?.subscription_plan_data?.subscription_plan_variations?.find((variation) => !variation.is_deleted && variation.subscription_plan_variation_data?.phases?.[0]?.pricing?.price_money?.amount === monthlyCents)
      if (existing) return existing.id
      const planId = plan?.id || (await call('POST', '/catalog/object', { idempotency_key: `${idempotencyKey}-plan`, object: { type: 'SUBSCRIPTION_PLAN', id: '#plan', subscription_plan_data: { name: planName } } })).catalog_object.id
      const price = { type: 'STATIC', price_money: { amount: monthlyCents, currency: 'USD' } }
      const variation = await call('POST', '/catalog/object', { idempotency_key: `${idempotencyKey}-variation`, object: { type: 'SUBSCRIPTION_PLAN_VARIATION', id: '#variation', subscription_plan_variation_data: { name: planName, subscription_plan_id: planId, phases: [{ cadence: 'MONTHLY', periods: 12, ordinal: 0, pricing: price }, { cadence: 'MONTHLY', ordinal: 1, pricing: price }] } } })
      return variation.catalog_object.id
    },
    async createSubscription({ idempotencyKey, locationId, planVariationId, customerId, startDate }) {
      const created = await call('POST', '/subscriptions', { idempotency_key: idempotencyKey, location_id: locationId, plan_variation_id: planVariationId, customer_id: customerId, start_date: startDate, timezone: 'America/Chicago' })
      return created.subscription.id
    },
  }
}
