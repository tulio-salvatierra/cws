import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleMarketingAssessment, loadReviewSummary, ASSESSMENT_KEY, REVIEW_KEY } from './marketing.js'
import { assessDraftSafely } from './assess.js'

vi.mock('./assess.js', () => ({ assessDraftSafely: vi.fn() }))
const id = '11111111-1111-4111-8111-111111111111'
const context = { workspaceId: 'workspace-a', userId: 'owner-a' }
function db(results) {
  const chains = []
  const client = { from: vi.fn(table => {
    const result = results.shift() || { data: [], error: null }
    const chain = { table }
    for (const name of ['select', 'eq', 'order', 'limit', 'in', 'insert', 'maybeSingle', 'single']) chain[name] = vi.fn(() => chain)
    chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
    chains.push(chain)
    return chain
  }) }
  return { client, chains }
}
function response() {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) }
  return res
}
afterEach(() => vi.clearAllMocks())
describe('Marketing assessments', () => {
  it('saves an immutable business-context snapshot and only an ask run', async () => {
    const brief = { id, workspace_id: context.workspaceId, version: 2, audience: 'Local businesses' }
    const { client, chains } = db([{ data: brief }, { data: { id } }])
    assessDraftSafely.mockResolvedValue({ available: false, status: 'unavailable' })
    const res = response()
    await handleMarketingAssessment({ method: 'POST' }, res, client, context, { action: 'assess_marketing_asset', topic: 'Tips', draft: 'Text', brief_id: id })
    expect(chains[0].eq).toHaveBeenCalledWith('workspace_id', context.workspaceId)
    expect(chains[0].eq).toHaveBeenCalledWith('is_active', true)
    expect(assessDraftSafely).toHaveBeenCalledWith({ topic: 'Tips', draft: 'Text', brief })
    expect(chains[1].insert).toHaveBeenCalledWith(expect.objectContaining({ command_level: 'ask', agent_key: ASSESSMENT_KEY, created_by: 'owner-a', input: { topic: 'Tips', draft: 'Text', brief_snapshot: brief }, output: { laya: { available: false, status: 'unavailable' } } }))
    expect(res.status).toHaveBeenCalledWith(201)
    expect(client.from.mock.calls.map(([table]) => table)).toEqual(['channel_brief', 'agent_runs'])
  })
  it('rejects a brief from outside the authenticated workspace without calling Laya', async () => {
    const { client } = db([{ data: null }])
    const res = response()
    await handleMarketingAssessment({ method: 'POST' }, res, client, context, { topic: 'Tips', draft: 'Text', brief_id: id })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(assessDraftSafely).not.toHaveBeenCalled()
  })
  it('rejects oversized input without database reads or inference', async () => {
    const { client } = db([])
    const res = response()
    await handleMarketingAssessment({ method: 'POST' }, res, client, context, { topic: 'Tips', draft: 'x'.repeat(12001), brief_id: id })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(client.from).not.toHaveBeenCalled()
  })
  it('records review as a separate receipt, never a publishing action', async () => {
    const { client, chains } = db([{ data: { id } }, { data: { id: 'receipt' } }])
    const res = response()
    await handleMarketingAssessment({ method: 'POST' }, res, client, context, { action: 'review_laya_assessment', assessment_id: id })
    expect(chains[0].eq).toHaveBeenCalledWith('workspace_id', context.workspaceId)
    expect(chains[0].eq).toHaveBeenCalledWith('agent_key', ASSESSMENT_KEY)
    expect(chains[1].insert).toHaveBeenCalledWith(expect.objectContaining({ agent_key: REVIEW_KEY, output: { decision: 'reviewed_only', publishes: false } }))
    expect(assessDraftSafely).not.toHaveBeenCalled()
  })
  it('does not acknowledge a missing or other-workspace assessment', async () => {
    const { client } = db([{ data: null }])
    const res = response()
    await handleMarketingAssessment({ method: 'POST' }, res, client, context, { action: 'review_laya_assessment', assessment_id: id })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(client.from).toHaveBeenCalledTimes(1)
  })
  it('returns only unreviewed assessments to CEO Today without model calls', async () => {
    const { client, chains } = db([{ data: [{ id, input: { topic: 'Done' } }, { id: 'pending', input: { topic: 'Tips' }, output: { laya: { available: false } } }] }, { data: [{ input: { assessment_id: id } }] }])
    expect(await loadReviewSummary(client, context.workspaceId)).toEqual({ available: true, recent_window: 100, pending: [{ id: 'pending', title: 'Tips', available: false }] })
    for (const chain of chains) expect(chain.eq).toHaveBeenCalledWith('workspace_id', context.workspaceId)
    expect(assessDraftSafely).not.toHaveBeenCalled()
  })
  it('isolates history failure from the CEO projection', async () => {
    const { client } = db([{ error: { message: 'database failure' } }])
    expect(await loadReviewSummary(client, context.workspaceId)).toEqual({ available: false, pending: [] })
  })
})
