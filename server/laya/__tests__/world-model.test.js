import { describe, expect, it, vi } from 'vitest'
import { assembleWorldModel, evidenceFreshness, loadWorldModel, WORLD_TABLES } from '../world-model.js'
const now = new Date('2026-11-01T12:00:00Z')
const row = (values = {}) => ({ id: 'r1', workspace_id: 'w1', observed_at: '2026-11-01T00:00:00Z', valid_until: '2026-11-02T00:00:00Z', ...values })
const input = (reads = {}) => ({ workspaceId: 'w1', workspace: { id: 'w1', name: 'Existing company', slug: 'existing' }, now, reads: Object.fromEntries(Object.keys(WORLD_TABLES).map(key => [key, reads[key] || { data: [] }])) })
describe('company world assembler', () => {
  it('reuses canonical identity and leaves absent facts null', () => {
    const result = assembleWorldModel(input())
    expect(result.identity.name).toBe('Existing company')
    expect(result.objective).toBeNull()
    expect(result.current_state.financial).toBeNull()
    expect(result.business_units).toEqual([])
    expect(result.authority).toBe('context_only')
  })
  it('preserves explicit zero, unknowns and proposed units', () => {
    const result = assembleWorldModel(input({ state: { data: [row({ financial: { cash_cents: 0, revenue_cents: null }, blockers: ['Capacity unverified'] })] }, units: { data: [row({ status: 'proposed', name: 'Media' })] } }))
    expect(result.current_state.financial).toEqual({ cash_cents: 0, revenue_cents: null })
    expect(result.business_units[0].status).toBe('proposed')
    expect(result.missing_information).toContainEqual({ path: 'current_state.financial.revenue_cents', reason: 'unknown' })
    expect(result.bottlenecks).toEqual(['Capacity unverified'])
  })
  it.each([
    [{}, 'unknown'], [{ observed_at: '2026-11-03' }, 'invalid_future'],
    [{ observed_at: '2026-10-01' }, 'unbounded'],
    [{ observed_at: '2026-10-01', valid_until: now.toISOString() }, 'stale'],
  ])('never treats undated, future or stale evidence as current', (dates, status) => {
    expect(evidenceFreshness(dates, now)).toBe(status)
    const snapshot = row({ observed_at: null, valid_until: null, ...dates, capacity: { available_hours: 5 } })
    const result = assembleWorldModel(input({ state: { data: [snapshot] } }))
    expect(result.current_state.capacity).toBeNull()
    expect(result.latest_state_snapshot).toEqual(snapshot)
  })
  it.each([{ error: true, data: [] }, { truncated: true, data: [row()] }, { data: [row({ workspace_id: 'foreign' })] }])('fails closed for incomplete or foreign registers', read => {
    const result = assembleWorldModel(input({ opportunities: read }))
    expect(result.opportunities).toBeNull()
    expect(result.coverage.opportunities.available).toBe(false)
  })
  it('keeps historical outcomes and their lessons linked', () => {
    const result = assembleWorldModel(input({ outcomes: { data: [row({ lesson: 'Synthetic lesson', recommendation: 'modify', decision_context_id: 'c1' })], has_more: true } }))
    expect(result.lessons).toEqual([{ outcome_id: 'r1', lesson: 'Synthetic lesson', recommendation: 'modify' }])
    expect(result.coverage.outcomes).toMatchObject({ windowed: true, has_more: true })
  })
  it('does not mutate inputs or return foreign identity', () => {
    const fixture = input(); fixture.workspace.id = 'foreign'
    const before = JSON.stringify(fixture)
    expect(assembleWorldModel(fixture).identity).toBeNull()
    expect(JSON.stringify(fixture)).toBe(before)
  })
})
function clientFor(data = {}) {
  const queries = []
  return { queries, from: vi.fn(table => {
    const q = { table, filters: [], orders: [], select: vi.fn(() => q), eq: vi.fn((...args) => { q.filters.push(args); return q }),
      order: vi.fn((...args) => { q.orders.push(args); return q }),
      limit: vi.fn(async () => data[table] || { data: [] }),
      maybeSingle: vi.fn(async () => ({ data: { id: 'w1', name: 'Canonical', slug: 'canonical' } })) }
    queries.push(q); return q
  }) }
}
describe('world model loader', () => {
  it('scopes every source and flags capped registers', async () => {
    const client = clientFor({ company_units: { data: Array.from({ length: 1000 }, () => row()) } })
    const result = await loadWorldModel({ client, workspaceId: 'w1' }, now)
    expect(result.business_units).toBeNull()
    for (const q of client.queries) expect(q.filters).toContainEqual([q.table === 'workspaces' ? 'id' : 'workspace_id', 'w1'])
    expect(client.queries.find(q => q.table === 'company_state_snapshots').orders[0]).toEqual(['observed_at', { ascending: false, nullsFirst: false }])
  })
  it('distinguishes failed reads from empty registers and recent history windows', async () => {
    const client = clientFor({ company_constraints: { error: { message: 'unavailable' } }, company_outcomes: { data: Array.from({ length: 21 }, () => row()) } })
    const result = await loadWorldModel({ client, workspaceId: 'w1' }, now)
    expect(result.constraints).toBeNull()
    expect(result.opportunities).toEqual([])
    expect(result.recent_outcomes).toHaveLength(20)
    expect(result.coverage.outcomes.has_more).toBe(true)
  })
})
