import { assessDraftSafely } from './assess.js'

export const ASSESSMENT_KEY = 'marketing-laya-assessment'
export const REVIEW_KEY = 'marketing-laya-review'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function loadAssessments(client, workspaceId) {
  const runs = await client.from('agent_runs').select('id,input,output,created_at')
    .eq('workspace_id', workspaceId).eq('agent_key', ASSESSMENT_KEY)
    .order('created_at', { ascending: false }).limit(100)
  if (runs.error) throw new Error('Assessment history could not load.')
  if (!runs.data?.length) return []
  const reviews = await client.from('agent_runs').select('input,created_at')
    .eq('workspace_id', workspaceId).eq('agent_key', REVIEW_KEY)
    .in('input->>assessment_id', runs.data.map(run => run.id))
  if (reviews.error) throw new Error('Review history could not load.')
  const reviewed = new Set((reviews.data || []).map(run => run.input.assessment_id))
  return runs.data.map(run => ({ ...run, reviewed: reviewed.has(run.id) }))
}

export async function loadReviewSummary(client, workspaceId) {
  try {
    const runs = await loadAssessments(client, workspaceId)
    return { available: true, recent_window: 100, pending: runs.filter(run => !run.reviewed).map(run => ({ id: run.id, title: run.input.topic, available: run.output?.laya?.available === true })) }
  } catch {
    return { available: false, pending: [] }
  }
}

// The caller must authenticate the owner before reaching this handler.
export async function handleMarketingAssessment(req, res, client, context, body = {}) {
  try {
    if (req.method === 'GET') {
      const [assessments, briefs] = await Promise.all([
        loadAssessments(client, context.workspaceId),
        client.from('channel_brief').select('id,channel_id,language,version,audience,tone,topics_allowed,topics_forbidden,cta,geography,example_good,example_bad,channels(name)')
          .eq('workspace_id', context.workspaceId).eq('is_active', true),
      ])
      if (briefs.error) throw new Error('Active business briefs could not load.')
      return res.status(200).json({ ok: true, assessments, briefs: briefs.data || [] })
    }
    if (body.action === 'review_laya_assessment') {
      if (!UUID.test(body.assessment_id || '')) return res.status(400).json({ ok: false, error: 'Select a saved assessment.' })
      const run = await client.from('agent_runs').select('id').eq('workspace_id', context.workspaceId)
        .eq('agent_key', ASSESSMENT_KEY).eq('id', body.assessment_id).maybeSingle()
      if (run.error) throw new Error('Assessment could not be checked.')
      if (!run.data) return res.status(404).json({ ok: false, error: 'Assessment not found.' })
      const receipt = await saveRun(client, context, REVIEW_KEY, { assessment_id: run.data.id }, { decision: 'reviewed_only', publishes: false })
      return res.status(201).json({ ok: true, receipt_id: receipt.id })
    }
    const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
    const draft = typeof body.draft === 'string' ? body.draft.trim() : ''
    if (!topic || topic.length > 300 || !draft || draft.length > 12000 || !UUID.test(body.brief_id || '')) {
      return res.status(400).json({ ok: false, error: 'Choose an active brief, enter a title (up to 300 characters) and asset text (up to 12,000 characters).' })
    }
    const brief = await client.from('channel_brief').select('*').eq('workspace_id', context.workspaceId)
      .eq('id', body.brief_id).eq('is_active', true).maybeSingle()
    if (brief.error) throw new Error('Business brief could not load.')
    if (!brief.data) return res.status(404).json({ ok: false, error: 'That active brief is not available.' })
    const laya = await assessDraftSafely({ topic, draft, brief: brief.data })
    const run = await saveRun(client, context, ASSESSMENT_KEY, { topic, draft, brief_snapshot: brief.data }, { laya })
    return res.status(201).json({ ok: true, assessment: { ...run, reviewed: false } })
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message || 'Assessment could not be saved.' })
  }
}

async function saveRun(client, context, agentKey, input, output) {
  const now = new Date().toISOString()
  const result = await client.from('agent_runs').insert({ workspace_id: context.workspaceId, created_by: context.userId,
    command_level: 'ask', agent_key: agentKey, status: 'completed', input, output, started_at: now, finished_at: now,
  }).select('id,input,output,created_at').single()
  if (result.error) throw new Error('Assessment record could not be saved. No content was approved or published.')
  return result.data
}
