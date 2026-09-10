import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authenticateWorkspace: vi.fn(),
  missingOutreachEnv: vi.fn(() => []),
}))

vi.mock('../../server/outreach/shared.js', () => ({
  authenticateWorkspace: mocks.authenticateWorkspace,
  missingOutreachEnv: mocks.missingOutreachEnv,
}))

import handler from '../ceo-today.js'

function response() {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) }
  return res
}

function query(result) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    order: vi.fn(() => chain),
  }
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return chain
}

function activeLead() {
  return {
    id: 'lead-a', name: 'Ada', company: 'Ada Plumbing', email: null, phone: '+13125550123',
    status: 'contacted', sales_classification: 'prospect', response_state: 'no_response',
    locality: 'Chicago', last_contacted_at: null, created_at: '2026-09-09T15:00:00.000Z',
  }
}

describe('CEO Today endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.missingOutreachEnv.mockReturnValue([])
  })

  it('requires authenticated workspace access before reading any department state', async () => {
    mocks.authenticateWorkspace.mockResolvedValue({ error: 'Authentication required.', status: 401 })
    const res = response()

    await handler({ method: 'GET' }, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Authentication required.' })
  })

  it('reads only workspace-scoped durable Sales and Marketing state without provider or reconciliation calls', async () => {
    const queries = []
    const client = {
      from: vi.fn((table) => {
        const data = table === 'leads'
          ? [activeLead()]
          : table === 'marketing_publish_attempts'
            ? [{
                id: 'attempt-a', marketing_slot_key: '2026-09-07:post-a', asset_id: 'website-launch', asset_path: '/images/en-launch.png',
                destination: 'multi:cicero-web-studio', provider_status: 'posted', provider_error: null,
                created_at: '2026-09-08T15:00:00.000Z', updated_at: '2026-09-08T15:00:00.000Z',
              }]
            : table === 'marketing_publish_destination_results'
              ? ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'].map((platform) => ({ attempt_id: 'attempt-a', platform, provider_status: 'posted', provider_error: null }))
              : []
        const current = query({ data, error: null })
        queries.push({ table, current })
        return current
      }),
    }
    mocks.authenticateWorkspace.mockResolvedValue({ client, workspaceId: 'workspace-a' })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = response()

    await handler({ method: 'GET' }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toMatchObject({ ok: true })
    expect(res.json.mock.calls[0][0].actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ department: 'SALES', human_action: 'Call Ada Plumbing' }),
    ]))
    expect(queries.map(({ table }) => table)).toEqual([
      'leads',
      'sales_promised_actions',
      'outreach_sends',
      'marketing_publish_attempts',
      'marketing_slot_resolutions',
      'marketing_publish_destination_results',
    ])
    for (const { table, current } of queries) {
      if (table !== 'marketing_publish_destination_results') expect(current.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
      expect(table).not.toContain('bundle')
    }
    expect(queries.find(({ table }) => table === 'marketing_publish_destination_results').current.in).toHaveBeenCalledWith('attempt_id', ['attempt-a'])
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('rejects non-read methods without changing Sales or Marketing state', async () => {
    const res = response()

    await handler({ method: 'POST' }, res)

    expect(res.status).toHaveBeenCalledWith(405)
    expect(mocks.authenticateWorkspace).not.toHaveBeenCalled()
  })
})
