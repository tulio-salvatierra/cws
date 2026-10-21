import { chicagoDate } from '../sales/queue.js'

// Approved product context, not an activated business decision. Agreement,
// launch and payment records cannot establish signatures or subscription status.
export function buildGoalPace({ workspaceId, agreements = [], available = true, now = new Date() }) {
  const today = chicagoDate(now)
  const rows = available ? agreements.filter(row => row.workspace_id === workspaceId && /^negocio listo(?:\s|$|[—-])/i.test(String(row.product_name || '').trim())) : []
  const target = (count, deadline) => ({ target: count, deadline, recorded: null, remaining: null,
    days_remaining: Math.round((Date.parse(deadline) - Date.parse(today)) / 86400000) })
  return {
    evaluator: 'goal_pace', policy_version: 'goal-pace-v1',
    subject: { type: 'negocio_listo_goal', workspace_id: workspaceId },
    verdict: 'needs_data', business_date: today, time_zone: 'America/Chicago',
    evaluated_at: now.toISOString(),
    goal: target(10, '2026-12-31'), checkpoint: target(4, '2026-11-15'),
    recorded_agreements: available ? rows.length : null,
    next_action: 'Verify signed dates and current subscription status for Negocio Listo, including completeness of the records, before assessing pace.',
    why: rows.map(row => ({ claim: 'A Negocio Listo agreement is recorded; this does not establish a signature or active subscription.',
      source: { table: 'client_service_agreements', id: row.id, workspace_id: workspaceId,
        fields: { product_name: row.product_name, created_at: row.created_at, launch_date: row.launch_date } } })),
    target_source: { document: 'docs/product-definition.md', section: '1a', version: 3 },
    assumptions: [],
    missing_data: [
      ...(!available ? ['Agreement records are unavailable.'] : []),
      'Verified signature dates are not recorded in the current agreement schema.',
      'Current subscription status linked to Negocio Listo is not recorded.',
      'Completeness of signed and active subscription records is unverified; missing records cannot be counted as zero.',
      'A pace baseline is not recorded; no on-track forecast or required weekly rate is inferred.',
    ],
    money_at_stake: null, related_decisions: [],
  }
}
