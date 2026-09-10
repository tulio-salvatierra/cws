import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getSession } },
}))

import SalesPage from '../SalesPage'

function response(payload) { return { ok: true, json: vi.fn().mockResolvedValue(payload) } }

const salesState = {
  ok: true,
  summary: { today: '2026-09-09', newOutreachToday: 0, dailyTarget: 5, newProspectContactsRemaining: 5, dueFollowUps: 0, warmResponses: 0, promisedActionsDue: 0, unclassifiedLeads: 0 },
  leads: [{ id: 'lead-a', name: 'Ada', email: 'ada@example.com', company: 'Ada Plumbing', status: 'contacted', sales_classification: 'prospect', response_state: 'no_response', phone: null, locality: 'Chicago', last_contacted_at: null, created_at: '2026-09-09T15:00:00.000Z' }],
  items: [{ id: 'new_prospect:lead-a', category: 'new_prospect', priority: 5, actionableOn: '2026-09-09', reason: 'No successful initial outreach yet', recommendation: 'Prepare initial email', sendType: 'intro', lead: { id: 'lead-a', name: 'Ada', email: 'ada@example.com', company: 'Ada Plumbing', status: 'contacted', sales_classification: 'prospect', response_state: 'no_response', phone: null, locality: 'Chicago', last_contacted_at: null, created_at: '2026-09-09T15:00:00.000Z' } }],
}

describe('SalesPage', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'access-token' } } })
    globalThis.fetch = vi.fn().mockResolvedValue(response(salesState))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('loads the deterministic queue and hands preparation to the existing exact-lead Sales path', async () => {
    render(<MemoryRouter><SalesPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Today’s command queue' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ada Plumbing', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Prepare email' })).toHaveAttribute('href', '/admin/leads?lead_id=lead-a&send_type=intro')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/command-queue', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access-token' }) }))
    expect(globalThis.fetch.mock.calls.every(([, options = {}]) => !options.method || options.method === 'GET')).toBe(true)
  })

  it('keeps Not now local: it hides the item without a mutation and a fresh load restores it', async () => {
    const first = render(<MemoryRouter><SalesPage /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Ada Plumbing', level: 2 })
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(screen.queryByRole('heading', { name: 'Ada Plumbing', level: 2 })).not.toBeInTheDocument()
    expect(globalThis.fetch.mock.calls).toHaveLength(1)
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()

    first.unmount()
    render(<MemoryRouter><SalesPage /></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Ada Plumbing', level: 2 })).toBeInTheDocument())
    expect(globalThis.fetch.mock.calls).toHaveLength(2)
  })

  it('does not discover on load or reload; the owner must prepare and then explicitly start discovery', async () => {
    const configured = {
      ...salesState,
      prospectDiscovery: { configured: true, limits: { placesSearches: 4, placeDetailRequests: 0, websiteInspections: 10 } },
      prospects: [],
    }
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(configured))
      .mockResolvedValueOnce(response({ ok: true, discovery_authorization: { capability: 'prepared-capability', expires_at: '2026-09-09T20:10:00.000Z', categories: ['Auto repair'], limits: { places_searches: 4, place_detail_requests: 0, website_inspections: 10 } } }))
      .mockResolvedValueOnce(response({ ok: true, discovery: { candidatesCreated: 0, businesses: [{ businessName: 'Northside Repair', category: 'Auto repair', locality: 'Chicago, IL', websiteUrl: 'https://northside.example', investigateCapability: 'investigate-capability', skipCapability: 'skip-capability' }] } }))
      .mockResolvedValueOnce(response(configured))

    render(<MemoryRouter><SalesPage /></MemoryRouter>)

    await screen.findByRole('heading', { name: 'Prospects to review' })
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()

    fireEvent.click(screen.getByRole('button', { name: 'Find prospects' }))
    expect(await screen.findByText('Discovery prepared')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(globalThis.fetch.mock.calls[1][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ action: 'prepare_discovery' }) })
    expect(globalThis.fetch.mock.calls.some(([, options]) => options?.body === JSON.stringify({ action: 'discover_prospects', discovery_capability: 'prepared-capability' }))).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Start discovery' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(4))
    expect(globalThis.fetch.mock.calls[2][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ action: 'discover_prospects', discovery_capability: 'prepared-capability' }) })
    expect(await screen.findByRole('heading', { name: 'Businesses to review' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Northside Repair', level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open website' })).toHaveAttribute('href', 'https://northside.example')
  })

  it('keeps transient owner selection separate from durable prospects until Investigate or Skip is clicked', async () => {
    const configured = { ...salesState, prospectDiscovery: { configured: true }, prospects: [] }
    const business = { businessName: 'Northside Repair', category: 'Auto repair', locality: 'Chicago, IL', websiteUrl: 'https://northside.example', investigateCapability: 'investigate-capability', skipCapability: 'skip-capability' }
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(configured))
      .mockResolvedValueOnce(response({ ok: true, discovery_authorization: { capability: 'prepared-capability', limits: { places_searches: 4 } } }))
      .mockResolvedValueOnce(response({ ok: true, discovery: { businesses: [business] } }))
      .mockResolvedValueOnce(response(configured))
      .mockResolvedValueOnce(response({ ok: true, candidate: { id: 'candidate-a' } }))
      .mockResolvedValueOnce(response({ ...configured, prospects: [{ id: 'candidate-a', business_name: 'Northside Repair', category: 'Auto repair', locality: 'Chicago, IL', website_url: 'https://northside.example', business_email: null, business_phone: null, observed_facts: ['Homepage reachable.'], opportunities: [], review_basis: 'owner_selected', possible_duplicate: false }] }))

    render(<MemoryRouter><SalesPage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Find prospects' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Start discovery' }))
    expect(await screen.findByRole('button', { name: 'Investigate' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Northside Repair', level: 3 })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Investigate' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(6))
    expect(globalThis.fetch.mock.calls[4][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ action: 'investigate_discovered_business', selection_capability: 'investigate-capability' }) })
    expect(await screen.findByText('No automated signal was found. This business is here because you selected it for owner review.')).toBeInTheDocument()
  })

  it('keeps contact-path verification isolated from discovery preparation and execution', async () => {
    const candidate = { id: 'candidate-a', business_name: 'Northside Repair', category: 'Auto repair', locality: 'Chicago, IL', website_url: 'https://northside.example', observed_facts: [], opportunity: 'Contact path may benefit from being more prominent.', evidence_urls: [], inspected_at: '2026-09-09T18:00:00.000Z', contact_path_state: 'unverified_gap' }
    const withVerification = { ...salesState, prospectDiscovery: { configured: true }, prospects: [], prospectVerificationRequired: [candidate] }
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(withVerification))
      .mockResolvedValueOnce(response({ ok: true, candidate: { id: 'candidate-a' } }))
      .mockResolvedValueOnce(response({ ...withVerification, prospectVerificationRequired: [] }))

    render(<MemoryRouter><SalesPage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Verify contact path' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))

    expect(globalThis.fetch.mock.calls[1][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ action: 'verify_discovery_candidate_contact_path', candidate_id: 'candidate-a' }) })
    expect(globalThis.fetch.mock.calls.some(([, options]) => String(options?.body || '').includes('discover_prospects') || String(options?.body || '').includes('prepare_discovery'))).toBe(false)
  })

  it('shows verified facts separately, preserves missing-contact safety, and makes no outreach action available on a candidate', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({
      ...salesState,
      prospectDiscovery: { configured: true },
      prospects: [{
        id: 'candidate-a', business_name: 'Northside Repair', category: 'Auto repair', locality: 'Chicago, IL', website_url: 'https://northside.example', business_email: null, business_phone: null,
        observed_facts: ['Homepage has no visible booking/contact action.'], opportunity: 'Contact path may benefit from being more prominent.', evidence_urls: ['https://northside.example'], inspected_at: '2026-09-09T18:00:00.000Z', possible_duplicate: false,
      }],
    }))

    render(<MemoryRouter><SalesPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Northside Repair', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('Homepage has no visible booking/contact action.')).toBeInTheDocument()
    expect(screen.getByText('Contact path may benefit from being more prominent.')).toBeInTheDocument()
    expect(screen.getByText('Contact information needed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /prepare email|confirm and send/i })).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('shows each evidence-backed website opportunity without altering the owner-only Sales boundary', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({
      ...salesState,
      prospectDiscovery: { configured: true },
      prospects: [{
        id: 'candidate-a', business_name: 'Northside Repair', category: 'Auto repair', locality: 'Chicago, IL', website_url: 'http://northside.example', business_email: null, business_phone: '+13125550123', observed_facts: ['Homepage reachable.'], possible_duplicate: false,
        opportunities: [
          { type: 'OFFICIAL_LISTING_LINK_BROKEN', observed_fact: 'The public website destination returned HTTP 404 in both checks.', safe_inference: 'CWS could review or replace the public website destination linked from the business profile.', verification_state: 'confirmed_public_not_found' },
          { type: 'HTTP_NOT_REDIRECTED_TO_HTTPS', observed_fact: 'The public website entry point remained on HTTP.', safe_inference: 'CWS could help move the public website entry point to HTTPS.', verification_state: 'confirmed_http_without_https' },
        ],
      }],
    }))

    render(<MemoryRouter><SalesPage /></MemoryRouter>)

    expect(await screen.findByText('Official listing link broken')).toBeInTheDocument()
    expect(screen.getByText('HTTP not redirected to HTTPS')).toBeInTheDocument()
    expect(screen.getByText(/Public not-found response confirmed/)).toBeInTheDocument()
    expect(screen.getByText(/HTTP response confirmed/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to Sales' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /prepare email|confirm and send/i })).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('shows bounded owner-review signals and a local owner checklist without creating a lead or outreach action', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({
      ...salesState,
      prospectDiscovery: { configured: true },
      prospects: [{
        id: 'candidate-review', business_name: 'Northside Repair', category: 'Auto repair', locality: 'Chicago, IL', website_url: 'https://northside.example', business_email: null, business_phone: null,
        observed_facts: ['Rendered homepage content extended 120px beyond the 390px mobile viewport.'], possible_duplicate: false,
        opportunities: [
          { type: 'MOBILE_LAYOUT_REVIEW', observed_fact: 'Rendered homepage content extended 120px beyond the 390px mobile viewport.', safe_inference: 'Mobile layout may deserve review because rendered page content extended materially beyond the viewport.', verification_state: 'material_overflow_confirmed' },
          { type: 'SERVICE_CLARITY_REVIEW', observed_fact: 'Neither bounded raw HTML nor rendered homepage content contained a substantive public explanation of the business service offering.', safe_inference: 'Service offering may deserve owner review because it was not clearly explained in the inspected homepage content.', verification_state: 'corroborated_review_signal' },
        ],
      }],
    }))

    render(<MemoryRouter><SalesPage /></MemoryRouter>)

    expect(await screen.findByText('Mobile layout review')).toBeInTheDocument()
    expect(screen.getByText('Service clarity review')).toBeInTheDocument()
    expect(screen.getByText('Why this is here')).toBeInTheDocument()
    expect(screen.getByText('Owner check')).toBeInTheDocument()
    expect(screen.getByLabelText('Mobile experience actually needs improvement')).toBeInTheDocument()
    expect(screen.getByLabelText('I can identify a specific useful CWS improvement')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /prepare email|confirm and send/i })).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('shows the sanitized failed-brief message and requires a separate explicit retry action', async () => {
    const failedCandidate = {
      id: 'candidate-a', business_name: 'Northside Repair', category: 'Auto repair', locality: 'Chicago, IL', website_url: 'https://northside.example', business_email: 'info@northside.example', business_phone: '+13125550123', observed_facts: ['Homepage reachable.'], opportunities: [], review_basis: 'owner_selected', possible_duplicate: false,
      prospect_brief: {
        run_id: 'brief-failed', status: 'failed', error_message: "Brief verification failed because the AI referenced website evidence that wasn't in the inspected evidence set. Nothing was sent or added to Sales.", output: null,
      },
    }
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response({ ...salesState, prospectDiscovery: { configured: true }, prospects: [failedCandidate] }))
      .mockResolvedValueOnce(response({ ok: true, replayed: true }))
      .mockResolvedValueOnce(response({ ...salesState, prospectDiscovery: { configured: true }, prospects: [failedCandidate] }))

    render(<MemoryRouter><SalesPage /></MemoryRouter>)

    expect(await screen.findByText(/Brief verification failed because the AI referenced website evidence/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry prospect brief' })).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Retry prospect brief' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))
    expect(globalThis.fetch.mock.calls[1][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ action: 'retry_prospect_brief', candidate_id: 'candidate-a', retry_of_run_id: 'brief-failed' }) })
  })
})
