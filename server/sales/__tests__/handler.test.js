/* global process */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authenticateOwner: vi.fn(),
  authenticateWorkspace: vi.fn(),
  cleanText: vi.fn((value) => String(value || '').trim()),
  missingOutreachEnv: vi.fn(() => []),
  parseBody: vi.fn((value) => value),
  sendResendEmail: vi.fn(),
  discoverGooglePlaces: vi.fn(),
  diagnoseGooglePlaces: vi.fn(),
  inspectOfficialWebsite: vi.fn(),
  createDiscoveryCapability: vi.fn(),
  validateDiscoveryCapability: vi.fn(),
  createDiscoverySelectionCapability: vi.fn(),
  validateDiscoverySelectionCapability: vi.fn(),
  collectProspectBriefEvidence: vi.fn(),
  generateProspectBrief: vi.fn(),
  prospectBriefFailureDetails: vi.fn(() => ({})),
  prospectBriefConfiguration: vi.fn(() => ({ configured: true })),
}))

vi.mock('../../outreach/shared.js', () => ({
  authenticateOwner: mocks.authenticateOwner,
  authenticateWorkspace: mocks.authenticateWorkspace,
  cleanText: mocks.cleanText,
  missingOutreachEnv: mocks.missingOutreachEnv,
  parseBody: mocks.parseBody,
}))
vi.mock('../../../api/lib/resend.js', () => ({ sendResendEmail: mocks.sendResendEmail }))
vi.mock('../discovery.js', () => ({
  MAX_PLACES_SEARCHES: 4,
  MAX_PLACE_DETAIL_REQUESTS: 0,
  MAX_WEBSITE_INSPECTIONS: 10,
  MAX_TRANSIENT_REVIEW_BUSINESSES: 10,
  PLACES_DIAGNOSTIC_QUERY: { category: 'Auto repair', query: 'auto repair in Chicago, Illinois' },
  discoverGooglePlaces: mocks.discoverGooglePlaces,
  diagnoseGooglePlaces: mocks.diagnoseGooglePlaces,
  inspectOfficialWebsite: mocks.inspectOfficialWebsite,
  normalizeSalesIdentity: (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
}))
vi.mock('../discovery-authorization.js', () => ({
  createDiscoveryCapability: mocks.createDiscoveryCapability,
  validateDiscoveryCapability: mocks.validateDiscoveryCapability,
  createDiscoverySelectionCapability: mocks.createDiscoverySelectionCapability,
  validateDiscoverySelectionCapability: mocks.validateDiscoverySelectionCapability,
  INVESTIGATE_DISCOVERED_BUSINESS_ACTION: 'investigate_discovered_business',
  SKIP_DISCOVERED_BUSINESS_ACTION: 'skip_discovered_business',
}))
vi.mock('../prospect-brief.js', () => ({
  PROSPECT_BRIEF_AGENT_KEY: 'sales-prospect-brief',
  collectProspectBriefEvidence: mocks.collectProspectBriefEvidence,
  generateProspectBrief: mocks.generateProspectBrief,
  prospectBriefFailureDetails: mocks.prospectBriefFailureDetails,
  prospectBriefConfiguration: mocks.prospectBriefConfiguration,
}))

import handler, { reserveAuthorizedDiscoveryRun } from '../handler.js'

function response() {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) }
  return res
}

function query(result) {
  const chain = {
    select: vi.fn(() => chain), eq: vi.fn(() => chain), is: vi.fn(() => chain), not: vi.fn(() => chain), in: vi.fn(() => chain), limit: vi.fn(() => chain), order: vi.fn(() => chain),
    insert: vi.fn(() => chain), update: vi.fn(() => chain), maybeSingle: vi.fn(() => Promise.resolve(result)), single: vi.fn(() => Promise.resolve(result)),
  }
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return chain
}

const queueLead = {
  id: 'lead-a', name: 'A Business', email: 'a@example.com', company: 'A Co', status: 'contacted', sales_classification: 'prospect', response_state: 'no_response', phone: null, locality: null, last_contacted_at: null, created_at: '2026-09-01T15:00:00.000Z',
}

describe('Sales command endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.missingOutreachEnv.mockReturnValue([])
    mocks.createDiscoveryCapability.mockReturnValue({
      capability: 'prepared-capability',
      expiresAt: '2026-09-09T20:10:00.000Z',
      scope: {
        categories: [{ category: 'Auto repair', query: 'auto repair in Chicago, Illinois' }],
        budget: { places_searches: 4, place_detail_requests: 0, website_inspections: 10 },
      },
    })
    mocks.validateDiscoveryCapability.mockReturnValue({
      ok: true,
      nonceHash: 'a'.repeat(64),
      action: 'discover_prospects',
      scope: {
        categories: [{ category: 'Auto repair', query: 'auto repair in Chicago, Illinois' }],
        budget: { places_searches: 4, place_detail_requests: 0, website_inspections: 10 },
      },
      issuedAt: '2026-09-09T20:00:00.000Z',
      expiresAt: '2026-09-09T20:10:00.000Z',
    })
    mocks.createDiscoverySelectionCapability.mockReturnValue('selection-capability')
    mocks.prospectBriefConfiguration.mockReturnValue({ configured: true })
    mocks.collectProspectBriefEvidence.mockResolvedValue({ canonical_url: 'https://northside.example/', pages_inspected: ['https://northside.example/'], rendered_review: 'available', items: [{ id: 'e1', source_url: 'https://northside.example/', kind: 'html_heading', text: 'Northside Repair' }] })
    mocks.generateProspectBrief.mockResolvedValue({
      model: 'gpt-5.6', responseId: 'resp-a',
      brief: {
        business: { text: 'Northside Repair presents auto repair services.', evidence_ids: ['e1'] },
        customer: { text: 'Not clearly identified from inspected evidence.', evidence_ids: ['e1'] },
        whats_working: [], opportunities: [],
        best_cws_angle: { value: 'No strong CWS opportunity identified', evidence_ids: ['e1'] },
        why: { text: 'The inspected evidence did not establish a strong CWS opportunity.', evidence_ids: ['e1'] },
        outreach_hook: null,
      },
    })
    mocks.validateDiscoverySelectionCapability.mockReturnValue({
      ok: true,
      nonceHash: 'b'.repeat(64),
      action: 'investigate_discovered_business',
      discoveryRunId: 'run-a',
      provider: 'google_places',
      providerPlaceId: 'place-a',
      websiteUrl: 'https://northside.example/',
      category: 'Auto repair',
      issuedAt: '2026-09-09T20:00:00.000Z',
      expiresAt: '2026-09-09T20:10:00.000Z',
    })
    delete process.env.GOOGLE_PLACES_API_KEY
  })

  it('loads the queue through authenticated reads only and never reaches Resend', async () => {
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: [queueLead], error: null }))
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: [], error: null })) }
    mocks.authenticateWorkspace.mockResolvedValue({ client, workspaceId: 'workspace-a' })
    const res = response()

    await handler({ method: 'GET' }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, summary: expect.objectContaining({ newProspectContactsRemaining: expect.any(Number) }) }))
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
  })

  it('requires an owner before any internal Sales action and never reaches Resend', async () => {
    mocks.authenticateOwner.mockResolvedValue({ error: 'Owner access required.', status: 403 })
    const res = response()

    await handler({ method: 'POST', body: { action: 'record_call', lead_id: 'lead-a' } }, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('records a promised action as a Sales-only row without creating an email', async () => {
    const leadQuery = query({ data: { id: 'lead-a', status: 'contacted' }, error: null })
    const inserted = query({ data: { id: 'promise-a', lead_id: 'lead-a', action_text: 'Call Thursday', due_on: '2026-09-10', completed_at: null, created_at: '2026-09-09T15:00:00.000Z' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(leadQuery).mockReturnValueOnce(inserted) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'create_promised_action', lead_id: 'lead-a', action_text: 'Call Thursday', due_on: '2026-09-10' } }, res)

    expect(inserted.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', lead_id: 'lead-a', created_by: 'owner-a' }))
    expect(res.status).toHaveBeenCalledWith(201)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('blocks discovery safely when the server-only Places key is absent', async () => {
    const client = { from: vi.fn() }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'discover_prospects' } }, res)

    expect(res.status).toHaveBeenCalledWith(503)
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('requires the authenticated workspace owner before discovery can reach Places', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    mocks.authenticateOwner.mockResolvedValue({ error: 'Owner access required.', status: 403 })
    const res = response()

    await handler({ method: 'POST', body: { action: 'discover_prospects' } }, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('prepares a discovery capability without calling Places, inspecting websites, or creating Sales data', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    const client = { from: vi.fn() }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'prepare_discovery' } }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      discovery_authorization: expect.objectContaining({ capability: 'prepared-capability' }),
    }))
    expect(client.from).not.toHaveBeenCalled()
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('rejects discovery without a valid prepared capability before any provider or database mutation', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    mocks.validateDiscoveryCapability.mockReturnValue({ ok: false, error: 'Discovery authorization is invalid.' })
    const client = { from: vi.fn() }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'discover_prospects' } }, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(client.from).not.toHaveBeenCalled()
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
  })

  it('reconciles a repeated capability to the existing run without provider work', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    const existing = { id: 'run-a', status: 'complete', places_searches: 4, place_detail_requests: 0, website_inspections: 9, candidates_created: 0, warning_count: 2, error_message: null, started_at: '2026-09-09T22:00:00.000Z', finished_at: '2026-09-09T22:01:00.000Z' }
    const client = { from: vi.fn().mockReturnValueOnce(query({ data: existing, error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'discover_prospects', discovery_capability: 'prepared-capability' } }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ replayed: true, discovery: expect.objectContaining({ runId: 'run-a' }) }))
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
  })

  it('reconciles simultaneous submissions of one capability to the one durable run', async () => {
    const authorization = {
      nonceHash: 'a'.repeat(64), action: 'discover_prospects', scope: { categories: [], budget: { places_searches: 4, place_detail_requests: 0, website_inspections: 10 } },
      issuedAt: '2026-09-09T20:00:00.000Z', expiresAt: '2026-09-09T20:10:00.000Z',
    }
    const persisted = { id: 'run-a', status: 'running', places_searches: 0, place_detail_requests: 0, website_inspections: 0, candidates_created: 0, warning_count: 0, error_message: null, started_at: '2026-09-09T20:00:01.000Z', finished_at: null }
    const inserted = query({ data: persisted, error: null })
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(inserted)
      .mockReturnValueOnce(query({ data: persisted, error: null })) }
    const context = { client, workspaceId: 'workspace-a', user: { id: 'owner-a' } }

    const first = await reserveAuthorizedDiscoveryRun(context, authorization)
    const second = await reserveAuthorizedDiscoveryRun(context, authorization)

    expect(first).toMatchObject({ data: { id: 'run-a' } })
    expect(second).toMatchObject({ data: { id: 'run-a' }, replayed: true })
    expect(inserted.insert).toHaveBeenCalledTimes(1)
    expect(inserted.insert).toHaveBeenCalledWith(expect.objectContaining({ authorization_nonce_hash: 'a'.repeat(64), authorization_action: 'discover_prospects' }))
  })

  it('runs one owner-only diagnostic request without inspecting websites, staging candidates, or sending email', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(query({ data: { id: 'run-diagnostic' }, error: null }))
      .mockReturnValueOnce(query({ data: { id: 'diagnostic-a' }, error: null }))
      .mockReturnValueOnce(query({ data: { id: 'diagnostic-a' }, error: null }))
      .mockReturnValueOnce(query({ data: null, error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    mocks.diagnoseGooglePlaces.mockResolvedValue({ warning: '', resultCount: 2, sampleBusinessNames: ['Northside Repair'], websiteFieldPresent: true, diagnostic: { category: 'Auto repair', searchQuery: 'auto repair in Chicago, Illinois', outcome: 'success', httpStatus: 200, providerStatus: null, providerCode: null, providerMessage: null, resultCount: 2, occurredAt: '2026-09-09T20:00:00.000Z' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'diagnose_google_places' } }, res)

    expect(mocks.diagnoseGooglePlaces).toHaveBeenCalledWith({ apiKey: 'test-key' })
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('does not make another provider request after the one-time diagnostic has been recorded', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    const client = { from: vi.fn().mockReturnValueOnce(query({ data: [{ id: 'diagnostic-a' }], error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'diagnose_google_places' } }, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(mocks.diagnoseGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('returns eligible transient businesses without website inspection, candidate creation, or outreach', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    const started = query({ data: { id: 'run-a' }, error: null })
    const completedRun = query({ data: null, error: null })
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(started)
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(completedRun) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    mocks.discoverGooglePlaces.mockResolvedValue({ records: [{ providerPlaceId: 'place-a', businessName: 'Northside Repair', websiteUrl: 'https://northside.example', category: 'Auto repair', locality: 'Chicago, IL' }], diagnostics: [], warnings: [], placesSearches: 4, placeDetailRequests: 0 })
    const res = response()

    await handler({ method: 'POST', body: { action: 'discover_prospects', discovery_capability: 'prepared-capability' } }, res)

    expect(mocks.discoverGooglePlaces).toHaveBeenCalledWith({ apiKey: 'test-key' })
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ discovery: expect.objectContaining({ websiteInspections: 0, candidatesCreated: 0, businesses: [expect.objectContaining({ businessName: 'Northside Repair', websiteUrl: 'https://northside.example', investigateCapability: 'selection-capability' })] }) }))
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('place-a')
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('excludes known, skipped, and already-Sales Place IDs without website inspection', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    const started = query({ data: { id: 'run-a' }, error: null })
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: null, error: null })).mockReturnValueOnce(query({ data: null, error: null })).mockReturnValueOnce(started)
      .mockReturnValueOnce(query({ data: [{ provider_place_id: 'known-place', website_domain: 'known.example' }], error: null }))
      .mockReturnValueOnce(query({ data: [{ source: 'google_places:lead-place' }], error: null }))
      .mockReturnValueOnce(query({ data: [{ provider_place_id: 'skipped-place' }], error: null }))
      .mockReturnValueOnce(query({ data: null, error: null })).mockReturnValueOnce(query({ data: null, error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    mocks.discoverGooglePlaces.mockResolvedValue({ records: [
      { providerPlaceId: 'known-place', businessName: 'Known', websiteUrl: 'https://known.example', category: 'Auto repair', locality: 'Chicago, IL' },
      { providerPlaceId: 'lead-place', businessName: 'Lead', websiteUrl: 'https://lead.example', category: 'Auto repair', locality: 'Chicago, IL' },
      { providerPlaceId: 'skipped-place', businessName: 'Skipped', websiteUrl: 'https://skipped.example', category: 'Auto repair', locality: 'Chicago, IL' },
    ], diagnostics: [], warnings: [], placesSearches: 4, placeDetailRequests: 0 })
    const res = response()

    await handler({ method: 'POST', body: { action: 'discover_prospects', discovery_capability: 'prepared-capability' } }, res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ discovery: expect.objectContaining({ businesses: [] }) }))
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
  })

  it('rejects an investigation without a valid capability before a website request or lead mutation', async () => {
    mocks.validateDiscoverySelectionCapability.mockReturnValueOnce({ ok: false, error: 'Business selection authorization is invalid.' })
    const client = { from: vi.fn() }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'investigate_discovered_business' } }, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(client.from).not.toHaveBeenCalled()
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('persists an exact owner investigation before one bounded analysis and creates an owner-selected zero-signal candidate', async () => {
    const runningSelection = query({ data: { id: 'selection-a', action: 'investigate', status: 'running', candidate_id: null, error_message: null, created_at: '2026-09-10T02:00:00.000Z', completed_at: null }, error: null })
    const completedSelection = query({ data: { id: 'selection-a', action: 'investigate', status: 'complete', candidate_id: 'candidate-a', error_message: null, created_at: '2026-09-10T02:00:00.000Z', completed_at: '2026-09-10T02:00:01.000Z' }, error: null })
    const createdCandidate = query({ data: { id: 'candidate-a', review_state: 'ready' }, error: null })
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(runningSelection)
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(createdCandidate)
      .mockReturnValueOnce(completedSelection) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    mocks.inspectOfficialWebsite.mockResolvedValue({ ok: true, businessName: 'Northside Repair', websiteUrl: 'https://northside.example/', websiteDomain: 'northside.example', businessEmail: null, businessPhone: '+13125550123', facts: ['Homepage reachable.'], opportunity: null, opportunities: [], evidenceUrls: ['https://northside.example/'], inspectedAt: '2026-09-10T02:00:00.000Z', contactPathState: 'contact_path_exists', verification: { version: 's2e' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'investigate_discovered_business', selection_capability: 'selection-capability' } }, res)

    expect(runningSelection.insert).toHaveBeenCalledWith(expect.objectContaining({ provider_place_id: 'place-a', action: 'investigate', status: 'running', authorization_nonce_hash: 'b'.repeat(64) }))
    expect(mocks.inspectOfficialWebsite).toHaveBeenCalledWith('https://northside.example/', { ownerSelected: true })
    expect(createdCandidate.insert).toHaveBeenCalledWith(expect.objectContaining({ review_basis: 'owner_selected', opportunity: null, provider_place_id: 'place-a', business_name: 'Northside Repair' }))
    expect(res.status).toHaveBeenCalledWith(201)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('replays a completed investigation without another website request or candidate', async () => {
    const existing = query({ data: { id: 'selection-a', action: 'investigate', status: 'complete', candidate_id: 'candidate-a', error_message: null, created_at: '2026-09-10T02:00:00.000Z', completed_at: '2026-09-10T02:00:01.000Z' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(existing) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'investigate_discovered_business', selection_capability: 'selection-capability' } }, res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ replayed: true }))
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('stores a minimal Place-ID skip without provider, website, lead, or email work', async () => {
    mocks.validateDiscoverySelectionCapability.mockReturnValueOnce({
      ok: true, nonceHash: 'c'.repeat(64), action: 'skip_discovered_business', discoveryRunId: 'run-a', provider: 'google_places', providerPlaceId: 'place-a', websiteUrl: 'https://northside.example/', category: 'Auto repair', issuedAt: '2026-09-10T02:00:00.000Z', expiresAt: '2026-09-10T02:10:00.000Z',
    })
    const stored = query({ data: { id: 'selection-skip', action: 'skip', status: 'complete', candidate_id: null, error_message: null, created_at: '2026-09-10T02:00:00.000Z', completed_at: '2026-09-10T02:00:00.000Z' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(query({ data: null, error: null })).mockReturnValueOnce(stored) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'skip_discovered_business', selection_capability: 'selection-capability' } }, res)

    expect(stored.insert).toHaveBeenCalledWith(expect.objectContaining({ provider_place_id: 'place-a', action: 'skip', status: 'complete' }))
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.inspectOfficialWebsite).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('invalidates only the explicitly selected legacy candidate when a contact path is found', async () => {
    const legacy = query({ data: { id: 'candidate-a', website_url: 'https://northside.example/', review_state: 'verification_required' }, error: null })
    const invalidated = query({ data: { id: 'candidate-a', review_state: 'invalidated', contact_path_state: 'contact_path_exists' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(legacy).mockReturnValueOnce(invalidated) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    mocks.inspectOfficialWebsite.mockResolvedValue({
      ok: false,
      noOpportunity: true,
      contactPathState: 'contact_path_exists',
      reason: 'A clear customer contact, booking, quote, or phone path was found in fetched HTML.',
      businessEmail: null,
      businessPhone: '+13125550123',
      verification: { version: 's2b', html: { state: 'contact_path_exists' } },
    })
    const res = response()

    await handler({ method: 'POST', body: { action: 'verify_discovery_candidate_contact_path', candidate_id: 'candidate-a' } }, res)

    expect(mocks.inspectOfficialWebsite).toHaveBeenCalledWith('https://northside.example/')
    expect(invalidated.update).toHaveBeenCalledWith(expect.objectContaining({
      review_state: 'invalidated',
      contact_path_state: 'contact_path_exists',
      qualification_invalidated_at: expect.any(String),
      qualification_invalidation_reason: expect.stringContaining('contact'),
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('keeps a legacy candidate out of review when rendered verification is insufficient', async () => {
    const legacy = query({ data: { id: 'candidate-a', website_url: 'https://northside.example/', review_state: 'verification_required' }, error: null })
    const insufficient = query({ data: { id: 'candidate-a', review_state: 'verification_required', contact_path_state: 'insufficient_evidence' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(legacy).mockReturnValueOnce(insufficient) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    mocks.inspectOfficialWebsite.mockResolvedValue({
      ok: false,
      insufficientEvidence: true,
      contactPathState: 'insufficient_evidence',
      error: 'Rendered verification timed out.',
      verification: { version: 's2b', rendered: { state: 'insufficient_evidence' } },
    })
    const res = response()

    await handler({ method: 'POST', body: { action: 'verify_discovery_candidate_contact_path', candidate_id: 'candidate-a' } }, res)

    expect(insufficient.update).toHaveBeenCalledWith(expect.objectContaining({ contact_path_state: 'insufficient_evidence' }))
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ insufficientEvidence: true }))
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
  })

  it('prepares exactly one durable Prospect Brief run before bounded website or AI work', async () => {
    const candidate = { id: 'candidate-a', business_name: 'Northside Repair', website_url: 'https://northside.example/', observed_facts: [], opportunities: [], review_basis: 'owner_selected', review_state: 'ready', prospect_brief_run_id: null }
    const queued = query({ data: { id: 'brief-a', status: 'queued', output: null, error_message: null, created_at: '2026-09-10T20:00:00.000Z', started_at: null, finished_at: null }, error: null })
    const claimed = query({ data: { prospect_brief_run_id: 'brief-a' }, error: null })
    const running = query({ data: null, error: null })
    const completed = query({ data: null, error: null })
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: candidate, error: null }))
      .mockReturnValueOnce(queued)
      .mockReturnValueOnce(claimed)
      .mockReturnValueOnce(running)
      .mockReturnValueOnce(completed) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'prepare_prospect_brief', candidate_id: 'candidate-a' } }, res)

    expect(queued.insert).toHaveBeenCalledWith(expect.objectContaining({ command_level: 'propose', agent_key: 'sales-prospect-brief', input: expect.objectContaining({ candidate_id: 'candidate-a' }) }))
    expect(claimed.update).toHaveBeenCalledWith({ prospect_brief_run_id: 'brief-a' })
    expect(mocks.collectProspectBriefEvidence).toHaveBeenCalledTimes(1)
    expect(mocks.generateProspectBrief).toHaveBeenCalledTimes(1)
    expect(completed.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed', output: expect.objectContaining({ candidate_id: 'candidate-a' }) }))
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('reconciles a repeated Prospect Brief action without another website or AI request', async () => {
    const candidate = { id: 'candidate-a', business_name: 'Northside Repair', website_url: 'https://northside.example/', observed_facts: [], opportunities: [], review_basis: 'owner_selected', review_state: 'ready', prospect_brief_run_id: 'brief-a' }
    const briefRun = { id: 'brief-a', status: 'completed', output: { brief: { business: { text: 'Northside Repair', evidence_ids: ['e1'] } } }, error_message: null, created_at: '2026-09-10T20:00:00.000Z', started_at: '2026-09-10T20:00:01.000Z', finished_at: '2026-09-10T20:00:02.000Z' }
    const client = { from: vi.fn().mockReturnValueOnce(query({ data: candidate, error: null })).mockReturnValueOnce(query({ data: briefRun, error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'prepare_prospect_brief', candidate_id: 'candidate-a' } }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ replayed: true, prospect_brief: expect.objectContaining({ run_id: 'brief-a' }) }))
    expect(mocks.collectProspectBriefEvidence).not.toHaveBeenCalled()
    expect(mocks.generateProspectBrief).not.toHaveBeenCalled()
  })

  it('lets one explicit owner retry replace only the failed brief pointer, then reconciles a duplicate retry', async () => {
    const failedCandidate = { id: 'candidate-a', business_name: 'Northside Repair', website_url: 'https://northside.example/', observed_facts: [], opportunities: [], review_basis: 'owner_selected', review_state: 'ready', prospect_brief_run_id: 'brief-failed' }
    const failedRun = { id: 'brief-failed', status: 'failed', input: { candidate_id: 'candidate-a' }, output: { failure: { failure_stage: 'evidence_reference_validation' } }, error_message: 'Why includes unsupported evidence.', created_at: '2026-09-10T20:00:00.000Z', started_at: '2026-09-10T20:00:01.000Z', finished_at: '2026-09-10T20:00:02.000Z' }
    const retryRun = { id: 'brief-retry', status: 'queued', output: null, error_message: null, created_at: '2026-09-10T20:01:00.000Z', started_at: null, finished_at: null }
    const activeCandidate = { ...failedCandidate, prospect_brief_run_id: 'brief-retry' }
    const activeRun = { ...retryRun, status: 'running', input: { candidate_id: 'candidate-a', retry_of_run_id: 'brief-failed' } }
    const queued = query({ data: retryRun, error: null })
    const claimed = query({ data: { prospect_brief_run_id: 'brief-retry' }, error: null })
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: failedCandidate, error: null }))
      .mockReturnValueOnce(query({ data: failedRun, error: null }))
      .mockReturnValueOnce(queued)
      .mockReturnValueOnce(claimed)
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(query({ data: activeCandidate, error: null }))
      .mockReturnValueOnce(query({ data: activeRun, error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })

    const first = response()
    await handler({ method: 'POST', body: { action: 'retry_prospect_brief', candidate_id: 'candidate-a', retry_of_run_id: 'brief-failed' } }, first)
    expect(queued.insert).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ candidate_id: 'candidate-a', retry_of_run_id: 'brief-failed' }) }))
    expect(claimed.update).toHaveBeenCalledWith({ prospect_brief_run_id: 'brief-retry' })
    expect(claimed.eq).toHaveBeenCalledWith('prospect_brief_run_id', 'brief-failed')
    expect(mocks.collectProspectBriefEvidence).toHaveBeenCalledTimes(1)
    expect(mocks.generateProspectBrief).toHaveBeenCalledTimes(1)

    const replay = response()
    await handler({ method: 'POST', body: { action: 'retry_prospect_brief', candidate_id: 'candidate-a', retry_of_run_id: 'brief-failed' } }, replay)
    expect(replay.status).toHaveBeenCalledWith(200)
    expect(queued.insert).toHaveBeenCalledTimes(1)
    expect(mocks.collectProspectBriefEvidence).toHaveBeenCalledTimes(1)
    expect(mocks.generateProspectBrief).toHaveBeenCalledTimes(1)
  })

  it('retains safe failed-brief diagnostics without creating a lead or outreach', async () => {
    const candidate = { id: 'candidate-a', business_name: 'Northside Repair', website_url: 'https://northside.example/', observed_facts: [], opportunities: [], review_basis: 'owner_selected', review_state: 'ready', prospect_brief_run_id: null }
    const queued = query({ data: { id: 'brief-a', status: 'queued', output: null, error_message: null }, error: null })
    const claimed = query({ data: { prospect_brief_run_id: 'brief-a' }, error: null })
    const failed = query({ data: null, error: null })
    const client = { from: vi.fn()
      .mockReturnValueOnce(query({ data: candidate, error: null }))
      .mockReturnValueOnce(queued)
      .mockReturnValueOnce(claimed)
      .mockReturnValueOnce(query({ data: null, error: null }))
      .mockReturnValueOnce(failed) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    mocks.generateProspectBrief.mockRejectedValueOnce(new Error('Why includes unsupported evidence.'))
    mocks.prospectBriefFailureDetails.mockReturnValueOnce({ failureStage: 'evidence_reference_validation', model: 'gpt-5.6', providerRequestId: 'req-a' })
    const res = response()

    await handler({ method: 'POST', body: { action: 'prepare_prospect_brief', candidate_id: 'candidate-a' } }, res)

    expect(failed.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failed',
      error_message: 'Why includes unsupported evidence.',
      output: expect.objectContaining({ failure: expect.objectContaining({ failure_stage: 'evidence_reference_validation', model: 'gpt-5.6', provider_request_id: 'req-a', evidence_item_count: 1 }) }),
    }))
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('requires an owner-selected candidate and OpenAI configuration before any Prospect Brief work', async () => {
    mocks.prospectBriefConfiguration.mockReturnValue({ configured: false })
    const client = { from: vi.fn() }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const unconfigured = response()
    await handler({ method: 'POST', body: { action: 'prepare_prospect_brief', candidate_id: 'candidate-a' } }, unconfigured)
    expect(unconfigured.status).toHaveBeenCalledWith(503)
    expect(client.from).not.toHaveBeenCalled()

    mocks.prospectBriefConfiguration.mockReturnValue({ configured: true })
    const legacyClient = { from: vi.fn().mockReturnValueOnce(query({ data: { id: 'candidate-a', review_basis: 'automated_evidence', review_state: 'ready', website_url: 'https://northside.example/' }, error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client: legacyClient, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const legacy = response()
    await handler({ method: 'POST', body: { action: 'prepare_prospect_brief', candidate_id: 'candidate-a' } }, legacy)
    expect(legacy.status).toHaveBeenCalledWith(409)
    expect(mocks.collectProspectBriefEvidence).not.toHaveBeenCalled()
    expect(mocks.generateProspectBrief).not.toHaveBeenCalled()
  })

  it('converts a reviewed candidate into one prospect lead without sending email', async () => {
    const candidate = { id: 'candidate-a', provider_place_id: 'place-a', business_name: 'Northside Repair', business_email: 'info@northside.example', business_phone: '+13125550123', locality: 'Chicago, IL', review_state: 'ready', possible_duplicate: false }
    const claimed = query({ data: { id: 'candidate-a' }, error: null })
    const createdLead = query({ data: { id: 'lead-new', name: 'Northside Repair', email: 'info@northside.example', company: 'Northside Repair', sales_classification: 'prospect' }, error: null })
    const converted = query({ data: { id: 'candidate-a', review_state: 'converted', converted_lead_id: 'lead-new' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(query({ data: candidate, error: null })).mockReturnValueOnce(query({ data: [], error: null })).mockReturnValueOnce(query({ data: [], error: null })).mockReturnValueOnce(claimed).mockReturnValueOnce(createdLead).mockReturnValueOnce(converted) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'add_discovery_candidate_to_sales', candidate_id: 'candidate-a' } }, res)

    expect(createdLead.insert).toHaveBeenCalledWith(expect.objectContaining({ sales_classification: 'prospect', response_state: 'no_response', source: 'google_places:place-a' }))
    expect(converted.update).toHaveBeenCalledWith(expect.objectContaining({ review_state: 'converted', converted_lead_id: 'lead-new' }))
    expect(res.status).toHaveBeenCalledWith(201)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('requires an owner action before a candidate can become a Sales lead', async () => {
    mocks.authenticateOwner.mockResolvedValue({ error: 'Owner access required.', status: 403 })
    const res = response()

    await handler({ method: 'POST', body: { action: 'add_discovery_candidate_to_sales', candidate_id: 'candidate-a' } }, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('requires a public business contact and respects known bounce or complaint suppression before conversion', async () => {
    const noContactClient = { from: vi.fn().mockReturnValueOnce(query({ data: { id: 'candidate-a', review_state: 'ready', possible_duplicate: false, business_email: null, business_phone: null }, error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client: noContactClient, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const noContact = response()
    await handler({ method: 'POST', body: { action: 'add_discovery_candidate_to_sales', candidate_id: 'candidate-a' } }, noContact)
    expect(noContact.status).toHaveBeenCalledWith(409)

    const candidate = { id: 'candidate-a', provider_place_id: 'place-a', business_name: 'Northside Repair', business_email: 'info@northside.example', business_phone: null, locality: 'Chicago, IL', review_state: 'ready', possible_duplicate: false }
    const suppressedClient = { from: vi.fn().mockReturnValueOnce(query({ data: candidate, error: null })).mockReturnValueOnce(query({ data: [{ id: 'bounced-a' }], error: null })).mockReturnValueOnce(query({ data: [], error: null })) }
    mocks.authenticateOwner.mockResolvedValue({ client: suppressedClient, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const suppressed = response()
    await handler({ method: 'POST', body: { action: 'add_discovery_candidate_to_sales', candidate_id: 'candidate-a' } }, suppressed)
    expect(suppressed.status).toHaveBeenCalledWith(409)
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })

  it('converts a phone-only reviewed candidate without creating email outreach', async () => {
    const candidate = { id: 'candidate-phone', provider_place_id: 'place-phone', business_name: 'Chicago General Contractor', business_email: null, business_phone: '+13125550123', locality: 'Chicago, IL', review_state: 'ready', possible_duplicate: false }
    const claimed = query({ data: { id: 'candidate-phone' }, error: null })
    const lead = query({ data: { id: 'lead-phone', email: null, phone: '+13125550123', sales_classification: 'prospect' }, error: null })
    const converted = query({ data: { id: 'candidate-phone', review_state: 'converted', converted_lead_id: 'lead-phone' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(query({ data: candidate, error: null })).mockReturnValueOnce(query({ data: [], error: null })).mockReturnValueOnce(claimed).mockReturnValueOnce(lead).mockReturnValueOnce(converted) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()
    await handler({ method: 'POST', body: { action: 'add_discovery_candidate_to_sales', candidate_id: 'candidate-phone' } }, res)
    expect(lead.insert).toHaveBeenCalledWith(expect.objectContaining({ email: null, phone: '+13125550123', sales_classification: 'prospect' }))
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('dismisses exactly one candidate without creating a lead, email, or provider request', async () => {
    const dismissed = query({ data: { id: 'candidate-a', review_state: 'dismissed', dismissed_at: '2026-09-09T18:00:00.000Z' }, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(dismissed) }
    mocks.authenticateOwner.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()

    await handler({ method: 'POST', body: { action: 'dismiss_discovery_candidate', candidate_id: 'candidate-a' } }, res)

    expect(dismissed.update).toHaveBeenCalledWith(expect.objectContaining({ review_state: 'dismissed', dismissed_at: expect.any(String) }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.discoverGooglePlaces).not.toHaveBeenCalled()
    expect(mocks.sendResendEmail).not.toHaveBeenCalled()
  })
})
