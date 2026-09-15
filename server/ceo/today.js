import { buildSalesCommandQueue, chicagoDate } from '../sales/queue.js'
import { buildMarketingOccurrencePlan, marketingLocalDate } from '../../src/marketing/weeklySlots.js'

export const CEO_ACTION_LIMIT = 5

const TIER = {
  urgent: 1,
  sales: 2,
  marketing: 3,
  deliver: 4,
  controlMoney: 5,
  protect: 6,
}

const OPERATIONS_STATE_ORDER = {
  waiting_on_cws: 1,
  ready_to_work: 2,
  waiting_on_client: 3,
}

const ACCOUNTING_STATE_ORDER = {
  payment_overdue: 1,
  payment_due: 2,
  recurring_attention: 3,
}

const COMPLIANCE_STATE_ORDER = {
  compliance_due: 1,
  compliance_approaching: 2,
  compliance_needs_verification: 3,
}

// CEO Today deliberately owns only this pure, read-side projection. The
// underlying Sales and Marketing records remain the systems of record.
export function buildCeoToday({
  leads = [],
  promisedActions = [],
  outreachSends = [],
  marketingAttempts = [],
  marketingResolutions = [],
  operationsProjects = [],
  accountingProjection = [],
  complianceProjection = [],
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
    ...operationsActions(operationsProjects),
    ...accountingActions(accountingProjection),
    ...complianceActions(complianceProjection),
  ].sort(compareActions)

  const visibleActions = actions.slice(0, CEO_ACTION_LIMIT)
  return {
    actions: visibleActions.length ? visibleActions : [fallbackAction()],
    all_actions: actions,
    sales_summary: salesQueue.summary,
  }
}

function complianceActions(projection) {
  const byRequirementId = new Map()

  for (const row of projection || []) {
    if (!row?.requirement_id || !row?.title) continue
    const overdue = row.compliance_state === 'compliance_overdue'
    const complianceOrder = COMPLIANCE_STATE_ORDER[row.compliance_state]
    if (!overdue && !complianceOrder) continue

    const verifying = row.compliance_state === 'compliance_needs_verification'
    const candidate = action({
      id: `compliance:${row.requirement_id}`,
      department: 'COMPLIANCE',
      businessPriority: 'PROTECT',
      humanAction: verifying ? `Verify ${row.title}` : `Review Compliance: ${row.title}`,
      whyNow: complianceReason(row),
      href: '/admin/compliance',
      ctaLabel: 'Review Compliance',
      tier: overdue ? TIER.urgent : TIER.protect,
      actionableOn: row.next_due_date || '',
      sourceTimestamp: row.source_timestamp || '',
      sourceType: 'compliance_requirement',
      complianceOrder: overdue ? 0 : complianceOrder,
    })

    const current = byRequirementId.get(row.requirement_id)
    if (!current || compareComplianceActions(candidate, current) < 0) byRequirementId.set(row.requirement_id, candidate)
  }

  return [...byRequirementId.values()]
}

function complianceReason(row) {
  if (row.compliance_state === 'compliance_needs_verification') {
    return row.human_reason || `Confirm whether ${row.title} applies to CWS.`
  }
  return row.human_reason || 'Compliance status requires owner review.'
}

function compareComplianceActions(left, right) {
  return left.compliance_order - right.compliance_order
    || String(left.actionable_on || '9999-12-31').localeCompare(String(right.actionable_on || '9999-12-31'))
    || String(left.source_timestamp).localeCompare(String(right.source_timestamp))
    || left.id.localeCompare(right.id)
}

function accountingActions(projection) {
  const bySourceId = new Map()

  for (const row of projection || []) {
    const stateOrder = ACCOUNTING_STATE_ORDER[row?.financial_state]
    if (!row?.id || !stateOrder) continue

    const overdue = row.financial_state === 'payment_overdue'
    const clientName = row.client_name || 'Client'
    const candidate = action({
      id: `accounting:${row.id}`,
      department: 'ACCOUNTING',
      businessPriority: 'CONTROL MONEY',
      humanAction: overdue ? `Review overdue payment for ${clientName}` : `Review Accounting for ${clientName}`,
      whyNow: accountingReason(row),
      href: '/admin/accounting',
      ctaLabel: 'Review Accounting',
      tier: overdue ? TIER.urgent : TIER.controlMoney,
      actionableOn: row.due_date || '',
      sourceTimestamp: row.source_timestamp || '',
      sourceType: 'accounting_financial',
      accountingOrder: stateOrder,
    })
    const current = bySourceId.get(row.id)
    if (!current || compareAccountingActions(candidate, current) < 0) bySourceId.set(row.id, candidate)
  }

  return [...bySourceId.values()]
}

function compareAccountingActions(left, right) {
  return left.accounting_order - right.accounting_order
    || String(left.actionable_on || '9999-12-31').localeCompare(String(right.actionable_on || '9999-12-31'))
    || String(left.source_timestamp).localeCompare(String(right.source_timestamp))
    || left.id.localeCompare(right.id)
}

function accountingReason(row) {
  const amount = usdAmount(row.amount_outstanding_cents)
  if (row.financial_state === 'payment_overdue') {
    return row.due_date ? `${amount} is overdue since ${row.due_date}.` : `${amount} is overdue.`
  }
  if (row.financial_state === 'payment_due') {
    return row.due_date ? `${amount} is due ${row.due_date}.` : `${amount} is due.`
  }
  return row.human_reason || 'Recurring revenue record requires review.'
}

function usdAmount(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100)
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

function operationsActions(projects) {
  const byProjectId = new Map()

  for (const project of projects || []) {
    if (!project?.project_id || ['completed', 'paused'].includes(project.status)) continue
    if (!OPERATIONS_STATE_ORDER[project.delivery_state]) continue
    if (project.delivery_state === 'waiting_on_client' && Number(project.blocker_count) < 1) continue

    const candidate = action({
      id: `operations:${project.project_id}`,
      department: 'OPERATIONS',
      businessPriority: 'DELIVER',
      humanAction: operationsHumanAction(project),
      whyNow: operationsReason(project),
      href: `/admin/operations/${project.project_id}`,
      ctaLabel: project.delivery_state === 'waiting_on_client' ? 'Review project' : 'Open project',
      tier: TIER.deliver,
      actionableOn: '',
      sourceTimestamp: project.oldest_blocker_since || '',
      sourceType: 'operations_delivery',
      operationsOrder: OPERATIONS_STATE_ORDER[project.delivery_state],
    })

    const current = byProjectId.get(project.project_id)
    if (!current || compareOperationsActions(candidate, current) < 0) byProjectId.set(project.project_id, candidate)
  }

  return [...byProjectId.values()]
}

function operationsHumanAction(project) {
  const projectName = project.project_name || 'Client project'
  return project.delivery_state === 'waiting_on_client' ? `Review ${projectName}` : `Open ${projectName}`
}

function operationsReason(project) {
  if (project.delivery_state === 'ready_to_work') return 'All needed-now inputs are available; work can continue.'
  return project.human_reason || 'Operations readiness needs review.'
}

function compareOperationsActions(left, right) {
  return left.operations_order - right.operations_order
    || String(left.source_timestamp).localeCompare(String(right.source_timestamp))
    || left.id.localeCompare(right.id)
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
  operationsOrder = null,
  accountingOrder = null,
  complianceOrder = null,
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
    operations_order: operationsOrder,
    accounting_order: accountingOrder,
    compliance_order: complianceOrder,
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

  if (left.priority_tier === TIER.deliver && left.operations_order !== null && right.operations_order !== null) {
    return compareOperationsActions(left, right)
  }

  if (left.priority_tier === TIER.controlMoney && left.accounting_order !== null && right.accounting_order !== null) {
    return compareAccountingActions(left, right)
  }

  if (left.priority_tier === TIER.protect && left.compliance_order !== null && right.compliance_order !== null) {
    return compareComplianceActions(left, right)
  }

  return String(left.actionable_on).localeCompare(String(right.actionable_on))
    || String(left.source_timestamp).localeCompare(String(right.source_timestamp))
    || left.id.localeCompare(right.id)
}
