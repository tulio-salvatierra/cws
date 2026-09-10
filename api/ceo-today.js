import { authenticateWorkspace, missingOutreachEnv } from '../server/outreach/shared.js'
import { buildCeoToday } from '../server/ceo/today.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing CEO Today environment variables: ${missing.join(', ')}` })

  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  const loaded = await loadCeoToday(context)
  if (loaded.error) return res.status(502).json({ ok: false, error: loaded.error })
  return res.status(200).json({ ok: true, ...loaded.data })
}

export async function loadCeoToday(context, now = new Date()) {
  const [leads, promisedActions, outreachSends, attempts, resolutions] = await Promise.all([
    context.client.from('leads').select('id, name, email, company, status, sales_classification, response_state, phone, locality, last_contacted_at, created_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('sales_promised_actions').select('id, lead_id, action_text, due_on, completed_at, created_at').eq('workspace_id', context.workspaceId).is('completed_at', null).order('due_on', { ascending: true }).order('created_at', { ascending: true }),
    context.client.from('outreach_sends').select('id, lead_id, send_type, status, sent_at, created_at').eq('workspace_id', context.workspaceId).not('lead_id', 'is', null).order('created_at', { ascending: true }),
    context.client.from('marketing_publish_attempts').select('id, marketing_slot_key, asset_id, asset_path, destination, provider_status, provider_error, created_at, updated_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: false }).limit(50),
    context.client.from('marketing_slot_resolutions').select('occurrence_slot_key, origin_slot_key, target_slot_key, action, asset_id, asset_path, caption, created_at, decided_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: false }),
  ])
  const failed = [leads, promisedActions, outreachSends, attempts, resolutions].find((result) => result.error)
  if (failed) return { data: null, error: 'CEO Today could not load the current workspace state.' }

  const attemptRows = attempts.data || []
  const attemptIds = attemptRows.map((attempt) => attempt.id).filter(Boolean)
  let destinationResults = []
  if (attemptIds.length) {
    const results = await context.client.from('marketing_publish_destination_results')
      .select('attempt_id, provider_status, provider_error')
      .in('attempt_id', attemptIds)
    if (results.error) return { data: null, error: 'CEO Today could not load Marketing delivery state.' }
    destinationResults = results.data || []
  }

  const resultsByAttempt = new Map()
  for (const result of destinationResults) {
    const values = resultsByAttempt.get(result.attempt_id) || []
    values.push(result)
    resultsByAttempt.set(result.attempt_id, values)
  }

  return {
    data: buildCeoToday({
      leads: leads.data || [],
      promisedActions: promisedActions.data || [],
      outreachSends: outreachSends.data || [],
      marketingAttempts: attemptRows.map((attempt) => ({
        ...attempt,
        destination_results: resultsByAttempt.get(attempt.id) || [],
      })),
      marketingResolutions: resolutions.data || [],
      now,
    }),
    error: null,
  }
}
