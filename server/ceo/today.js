import { buildSalesCommandQueue, chicagoDate } from '../sales/queue.js'
import { buildMarketingOccurrencePlan, marketingLocalDate } from '../../src/marketing/weeklySlots.js'

export const CEO_ACTION_LIMIT = 5

const TIER = {
  urgent: 1,
  sales: 2,
  marketing: 3,
}

// CEO Today deliberately owns only this pure, read-side projection. The
// underlying Sales and Marketing records remain the systems of record.
export function buildCeoToday({
  leads = [],
  promisedActions = [],
  outreachSends = [],
  marketingAttempts = [],
  marketingResolutions = [],
  now = new Date(),
} = {}) {
  const today = chicagoDate(now)
  const salesQueue = buildSalesCommandQueue({ leads, promisedActions, outreachSends, now })
  const marketingPlan = buildMarketingOccurrencePlan({
    attempts: marketingAttempts,
    resolutions: marketingResolutions,
    now,
  })

  const actions = [
    ...salesActions(salesQueue.items, today),
    ...marketingActions(marketingPlan, now),
  ].sort(compareActions)

  const visibleActions = actions.slice(0, CEO_ACTION_LIMIT)
  return {
    actions: visibleActions.length ? visibleActions : [fallbackAction()],
    sales_summary: salesQueue.summary,
  }
}

function salesActions(items, today) {
  const byLeadId = new Map()

  for (const [salesOrder, item] of items.entries()) {
    const leadId = item.lead?.id
    if (!leadId) continue

    const overduePromise = item.category === 'promised' && item.actionableOn < today
    const candidate = action({
      id: `sales:${item.id}`,
      department: 'SALES',
      businessPriority: 'GET MONEY',
      humanAction: salesHumanAction(item),
      whyNow: item.reason,
      href: '/admin/sales',
      ctaLabel: 'Go to Sales',
      tier: overduePromise ? TIER.urgent : TIER.sales,
      actionableOn: item.actionableOn,
      sourceTimestamp: item.promisedAction?.created_at || item.lead.created_at,
      sourceType: 'sales_command',
      salesOrder,
    })
    const current = byLeadId.get(leadId)
    if (!current || compareSalesLeadActions(candidate, current) < 0) byLeadId.set(leadId, candidate)
  }

  return [...byLeadId.values()]
}

function compareSalesLeadActions(left, right) {
  if (left.priority_tier !== right.priority_tier) return left.priority_tier - right.priority_tier
  return left.sales_order - right.sales_order || left.id.localeCompare(right.id)
}

function marketingActions(plan, now) {
  const today = marketingLocalDate(now)
  const missed = plan.missedSlots.map((slot) => action({
    id: `marketing:missed:${slot.slotKey}`,
    department: 'MARKETING',
    businessPriority: 'GET MONEY',
    humanAction: 'Resolve missed Marketing post',
    whyNow: `${slot.label} was scheduled for ${slot.slotDate} and needs an owner decision.`,
    href: '/admin/marketing',
    ctaLabel: 'Go to Marketing',
    tier: TIER.urgent,
    actionableOn: slot.slotDate,
    sourceTimestamp: slot.slotDate,
    sourceType: 'marketing_missed',
  }))

  const currentSlots = plan.currentWeekSlots || []
  const failures = currentSlots
    .filter(hasMarketingDeliveryFailure)
    .map((slot) => action({
      id: `marketing:failure:${slot.slotKey}`,
      department: 'MARKETING',
      businessPriority: 'GET MONEY',
      humanAction: 'Review Marketing delivery',
      whyNow: `${slot.label} has a delivery failure that requires review. CEO Today will not retry or republish it.`,
      href: '/admin/marketing',
      ctaLabel: 'Go to Marketing',
      tier: TIER.urgent,
      actionableOn: slot.slotDate,
      sourceTimestamp: slot.attempt?.updated_at || slot.attempt?.created_at || slot.slotDate,
      sourceType: 'marketing_delivery_failure',
    }))

  const ready = plan.missedSlots.length
    ? []
    : currentSlots
      .filter((slot) => slot.state === 'ready' && slot.slotDate === today)
      .map((slot) => action({
        id: `marketing:ready:${slot.slotKey}`,
        department: 'MARKETING',
        businessPriority: 'GET MONEY',
        humanAction: 'Review Marketing post',
        whyNow: `Today’s ${slot.label} is ready for owner review.`,
        href: '/admin/marketing',
        ctaLabel: 'Go to Marketing',
        tier: TIER.marketing,
        actionableOn: slot.slotDate,
        sourceTimestamp: slot.slotDate,
        sourceType: 'marketing_ready',
      }))

  return [...missed, ...failures, ...ready]
}

function hasMarketingDeliveryFailure(slot) {
  if (!slot?.attempt) return false
  if (slot.attempt.provider_status === 'error') return true
  return (slot.destinationResults || []).some((result) => result.provider_status === 'error')
}

function salesHumanAction(item) {
  const business = item.lead.company || item.lead.name || 'Sales lead'
  if (item.category === 'promised') {
    const description = item.promisedAction?.action_text || 'promised action'
    return `Complete ${description} for ${business}`
  }
  return `${item.recommendation} ${business}`
}

function action({
  id,
  department,
  businessPriority,
  humanAction,
  whyNow,
  href,
  ctaLabel,
  tier,
  actionableOn,
  sourceTimestamp,
  sourceType,
  salesOrder = null,
}) {
  return {
    id,
    department,
    business_priority: businessPriority,
    human_action: humanAction,
    why_now: whyNow,
    href,
    cta_label: ctaLabel,
    priority_tier: tier,
    actionable_on: actionableOn,
    source_timestamp: sourceTimestamp,
    source_type: sourceType,
    sales_order: salesOrder,
  }
}

function fallbackAction() {
  return action({
    id: 'sales:fallback:find-next-customer',
    department: 'SALES',
    businessPriority: 'GET MONEY',
    humanAction: 'Find the next customer',
    whyNow: 'No urgent owner action is due right now.',
    href: '/admin/sales',
    ctaLabel: 'Go to Sales',
    tier: TIER.sales,
    actionableOn: '',
    sourceTimestamp: '',
    sourceType: 'fallback',
  })
}

function compareActions(left, right) {
  if (left.priority_tier !== right.priority_tier) return left.priority_tier - right.priority_tier

  // Tier-two Sales cards retain the frozen S1 order exactly, even when their
  // actionable dates differ across categories.
  if (left.priority_tier === TIER.sales && left.sales_order !== null && right.sales_order !== null) {
    return left.sales_order - right.sales_order || left.id.localeCompare(right.id)
  }

  return String(left.actionable_on).localeCompare(String(right.actionable_on))
    || String(left.source_timestamp).localeCompare(String(right.source_timestamp))
    || left.id.localeCompare(right.id)
}
