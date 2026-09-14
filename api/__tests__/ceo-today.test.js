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

function activeOperationsProject(overrides = {}) {
  return {
    id: 'project-a', workspace_id: 'workspace-a', client_id: 'client-a', name: 'Ecclection Website',
    project_type: 'website_build', status: 'setup', created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z',
    ...overrides,
  }
}

function neededClientRequirement(overrides = {}) {
  return {
    id: 'requirement-a', workspace_id: 'workspace-a', project_id: 'project-a', requirement_key: 'project_specific_requirements',
    label: 'Project-specific requirements', category: 'project_specific', status: 'needed', timing: 'needed_now', responsible_party: 'client',
    notes: null, requested_at: '2026-09-01T15:00:00.000Z', received_at: null, created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z',
    ...overrides,
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

  it('reads only workspace-scoped durable department state without provider or reconciliation calls', async () => {
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
              : table === 'operations_projects'
                ? [activeOperationsProject(), { ...activeOperationsProject(), id: 'project-b', workspace_id: 'workspace-b' }]
          : table === 'project_requirements'
                  ? [neededClientRequirement(), { ...neededClientRequirement(), id: 'requirement-b', workspace_id: 'workspace-b', project_id: 'project-b' }]
                  : table === 'financial_obligations'
                    ? [{ id: 'obligation-a', workspace_id: 'workspace-a', client_id: 'client-a', operations_project_id: null, description: 'September website work', amount_cents: 75000, currency: 'USD', obligation_type: 'milestone', due_date: '2026-09-10', status: 'expected', created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z' }, { id: 'obligation-b', workspace_id: 'workspace-b', client_id: 'client-b', operations_project_id: null, description: 'Other workspace', amount_cents: 90000, currency: 'USD', obligation_type: 'milestone', due_date: '2026-09-10', status: 'expected', created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z' }]
                    : table === 'payment_receipts'
                      ? []
                      : table === 'recurring_revenue'
                        ? [{ id: 'recurring-a', workspace_id: 'workspace-a', client_id: 'client-a', description: 'Healthy care plan', amount_cents: 7000, currency: 'USD', cadence: 'monthly', status: 'active', provider: 'square', provider_reference: null, started_at: '2026-03-13', next_expected_at: '2026-10-04', ended_at: null, created_at: '2026-03-13T15:00:00.000Z', updated_at: '2026-03-13T15:00:00.000Z' }]
                  : table === 'clients'
                    ? [{ id: 'client-a', workspace_id: 'workspace-a', name: 'Ecclection', contact_email: null, contact_phone: null, status: 'active', created_at: '2026-09-01T15:00:00.000Z' }, { id: 'client-b', workspace_id: 'workspace-b', name: 'Other', contact_email: null, contact_phone: null, status: 'active', created_at: '2026-09-01T15:00:00.000Z' }]
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
      expect.objectContaining({ department: 'OPERATIONS', human_action: 'Review Ecclection Website', href: '/admin/operations/project-a' }),
    ]))
    expect(queries.map(({ table }) => table)).toEqual([
      'leads',
      'sales_promised_actions',
      'outreach_sends',
      'marketing_publish_attempts',
      'marketing_slot_resolutions',
      'operations_projects',
      'project_requirements',
      'clients',
      'financial_obligations',
      'payment_receipts',
      'recurring_revenue',
      'marketing_publish_destination_results',
    ])
    for (const { table, current } of queries) {
      if (table !== 'marketing_publish_destination_results') expect(current.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
      expect(table).not.toContain('bundle')
    }
    expect(queries.find(({ table }) => table === 'marketing_publish_destination_results').current.in).toHaveBeenCalledWith('attempt_id', ['attempt-a'])
    expect(queries.find(({ table }) => table === 'operations_projects').current.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(queries.find(({ table }) => table === 'project_requirements').current.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(queries.find(({ table }) => table === 'clients').current.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(res.json.mock.calls[0][0].all_actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'operations:project-a', source_type: 'operations_delivery' }),
      expect.objectContaining({ id: 'accounting:financial_obligation:obligation-a', department: 'ACCOUNTING', business_priority: 'CONTROL MONEY', href: '/admin/accounting' }),
    ]))
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
