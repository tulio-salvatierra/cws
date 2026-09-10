import { describe, expect, it, vi } from 'vitest'
import {
  CHICAGO_DISCOVERY_QUERIES,
  DIAGNOSTIC_PLACE_FIELD_MASK,
  GOOGLE_PLACES_SEARCH_URL,
  MAX_PLACES_SEARCHES,
  MAX_WEBSITE_INSPECTIONS,
  PLACE_FIELD_MASK,
  diagnoseGooglePlaces,
  discoverGooglePlaces,
  inspectOfficialWebsite,
  normalizeSalesIdentity,
} from '../discovery.js'
import { assessMobileLayoutReview, MOBILE_OVERFLOW_THRESHOLD_PX, verifyRenderedContactPath, verifyRenderedWebsiteResponse } from '../renderer.js'
import { inspectHtmlServiceClarity } from '../contact-intelligence.js'
import { validatePublicWebsiteUrl } from '../website-safety.js'

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  }
}

function htmlResponse(html, url, { status = 200, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    headers: { get: vi.fn((name) => headers[name.toLowerCase()] || null) },
    text: vi.fn().mockResolvedValue(html),
  }
}

const allowPublicUrl = async (value) => ({ ok: true, url: new URL(value).toString() })
const renderedGap = async () => ({ state: 'verified_gap', error: null, pages: [], signals: [], contacts: { email: null, phone: null } })
const renderedContact = async () => ({ state: 'contact_path_exists', error: null, pages: [{ url: 'https://northside.example/', signals: [{ kind: 'transactional_cta', label: 'Request Estimate', sourceUrl: 'https://northside.example/' }] }], signals: [{ kind: 'transactional_cta', label: 'Request Estimate', sourceUrl: 'https://northside.example/' }], contacts: { email: null, phone: null } })
const renderedNotFound = async () => ({ state: 'not_found', status: 404, url: 'https://northside.example/', error: null })
const renderedHttp = async () => ({ state: 'reachable', status: 200, url: 'http://northside.example/', error: null })

describe('Sales prospect discovery provider adapter', () => {
  it('uses only four bounded server-side Places searches with a strict field mask', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ places: [{ id: 'place-a', displayName: { text: 'Example Auto' }, websiteUri: 'https://example.com', businessStatus: 'OPERATIONAL' }] }))

    const result = await discoverGooglePlaces({ apiKey: 'server-only-key', fetchImpl })

    expect(fetchImpl).toHaveBeenCalledTimes(MAX_PLACES_SEARCHES)
    expect(fetchImpl).toHaveBeenCalledWith(GOOGLE_PLACES_SEARCH_URL, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'X-Goog-Api-Key': 'server-only-key', 'X-Goog-FieldMask': PLACE_FIELD_MASK }),
    }))
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual(expect.objectContaining({
      textQuery: 'independent auto repair in Chicago, Illinois',
      pageSize: 3,
      locationRestriction: { rectangle: { low: expect.any(Object), high: expect.any(Object) } },
    }))
    expect(result).toMatchObject({ placesSearches: CHICAGO_DISCOVERY_QUERIES.length, placeDetailRequests: 0 })
    expect(result.records[0]).toEqual(expect.objectContaining({ providerPlaceId: 'place-a', businessName: 'Example Auto', websiteUrl: 'https://example.com/' }))
  })

  it('returns partial warnings instead of failing a whole owner-triggered run when a Places category fails', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValue(jsonResponse({ places: [] }))

    const result = await discoverGooglePlaces({ apiKey: 'server-only-key', fetchImpl })

    expect(result.warnings).toContain('Google Places search for Auto repair returned 429.')
    expect(result.records).toEqual([])
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_PLACES_SEARCHES)
  })

  it.each([
    ['400 invalid request', 400, 'INVALID_ARGUMENT', 'locationRestriction must use a rectangle'],
    ['401 authentication', 401, 'UNAUTHENTICATED', 'API key not valid'],
    ['403 API restriction', 403, 'PERMISSION_DENIED', 'This IP, site or mobile application is not authorized'],
    ['API not enabled', 403, 'PERMISSION_DENIED', 'Places API has not been used in project before or it is disabled'],
    ['billing/configuration failure', 403, 'FAILED_PRECONDITION', 'Billing has not been enabled'],
    ['429 quota', 429, 'RESOURCE_EXHAUSTED', 'Quota exceeded'],
    ['5xx provider failure', 503, 'UNAVAILABLE', 'Service temporarily unavailable'],
  ])('retains safe diagnostics for %s without retaining a provider secret', async (_label, status, providerStatus, message) => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: { code: status, status: providerStatus, message: `${message} AIzaabcdefghijklmnopqrstuv` } }, status))

    const result = await discoverGooglePlaces({ apiKey: 'server-only-key', fetchImpl })

    expect(result.records).toEqual([])
    expect(result.warnings).toHaveLength(MAX_PLACES_SEARCHES)
    expect(result.diagnostics[0]).toMatchObject({ outcome: 'error', httpStatus: status, providerStatus, providerCode: status, resultCount: 0 })
    expect(result.diagnostics[0].providerMessage).toContain(message)
    expect(result.diagnostics[0].providerMessage).not.toContain('AIza')
  })

  it('records a valid zero-result response distinctly from a provider failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ places: [] }))

    const result = await discoverGooglePlaces({ apiKey: 'server-only-key', fetchImpl })

    expect(result.warnings).toEqual([])
    expect(result.diagnostics.every((diagnostic) => diagnostic.outcome === 'zero_results')).toBe(true)
    expect(result.diagnostics.every((diagnostic) => diagnostic.httpStatus === 200)).toBe(true)
  })

  it('makes one bounded diagnostic search without inspecting websites or staging candidates', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ places: [
      { id: 'place-a', displayName: { text: 'Northside Repair' }, websiteUri: 'https://northside.example', businessStatus: 'OPERATIONAL' },
      { id: 'place-b', displayName: { text: 'Lakeview Auto' }, businessStatus: 'OPERATIONAL' },
    ] }))

    const result = await diagnoseGooglePlaces({ apiKey: 'server-only-key', fetchImpl })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledWith(GOOGLE_PLACES_SEARCH_URL, expect.objectContaining({ headers: expect.objectContaining({ 'X-Goog-FieldMask': DIAGNOSTIC_PLACE_FIELD_MASK }) }))
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual(expect.objectContaining({ textQuery: 'auto repair in Chicago, Illinois', pageSize: 3 }))
    expect(result).toMatchObject({ resultCount: 2, sampleBusinessNames: ['Northside Repair', 'Lakeview Auto'], websiteFieldPresent: true, diagnostic: { outcome: 'success', httpStatus: 200 } })
  })

  it('detects mailto, tel, CTA, footer, and directly discovered contact-page evidence while retaining a bounded homepage review pass', async () => {
    const homepage = '<html><head><meta property="og:site_name" content="Northside Repair"><meta name="description" content="Chicago auto repair"></head><body><h1>Trusted repair</h1><a href="/contact">Contact</a></body></html>'
    const contact = '<html><body><a href="mailto:info@northside.example">Email us</a><a href="tel:+13125550123">Call</a></body></html>'
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(htmlResponse(homepage, 'https://northside.example/'))
      .mockResolvedValueOnce(htmlResponse(contact, 'https://northside.example/contact'))

    const renderVerification = vi.fn(renderedGap)
    const result = await inspectOfficialWebsite('https://northside.example', { fetchImpl, validateUrl: allowPublicUrl, renderVerification })

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(result).toMatchObject({
      ok: false,
      noOpportunity: true,
      contactPathState: 'contact_path_exists',
      businessEmail: 'info@northside.example',
      businessPhone: '+13125550123',
    })
    expect(renderVerification).toHaveBeenCalledWith({ homepageUrl: 'https://northside.example/' })
  })

  it('detects a visible published email as a contact path without retaining a personal mailbox', async () => {
    const homepage = '<html><head><title>Northside Repair</title></head><body><footer>Questions? write owner@northside.example</footer></body></html>'
    const result = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: vi.fn(renderedGap),
    })

    expect(result).toMatchObject({ ok: false, noOpportunity: true, contactPathState: 'contact_path_exists', businessEmail: null })
  })

  it('returns a safe owner-selected candidate when the official site has an identity but no automated opportunity signal', async () => {
    const homepage = '<html><head><title>Northside Repair</title></head><body><a href="tel:+13125550123">Call us</a><p>Northside Repair provides routine maintenance, diagnostics, brake work, and practical vehicle service for Chicago drivers.</p></body></html>'
    const result = await inspectOfficialWebsite('https://northside.example', {
      ownerSelected: true,
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: vi.fn(async () => ({ state: 'contact_path_exists', error: null, signals: [], contacts: { email: null, phone: '+13125550123' }, pages: [{ url: 'https://northside.example/', review: { mobile_layout: { state: 'no_material_overflow', viewport_width: 390, document_width: 390, overflow_px: 0, elements: [] }, service_clarity: { state: 'service_explanation_found', word_count: 20, content_block_count: 1 } } }] })),
    })

    expect(result).toMatchObject({ ok: true, businessName: 'Northside Repair', opportunities: [], opportunity: null, contactPathState: 'contact_path_exists' })
  })

  it.each([
    ['Aesthetic Beauty Lounge', '<html><head><title>Aesthetic Beauty Lounge</title></head><body><a href="#book-now">BOOK NOW</a><form><button>Book Now</button></form></body></html>'],
    ['House Cleaning Services Chicago', '<html><head><title>House Cleaning Services Chicago</title></head><body><footer><a href="tel:+17733028706">(773) 302-8706</a><a href="mailto:info@housecleaningserviceschicago.net">Email</a><a href="#quote">Get My Free Quote</a></footer></body></html>'],
    ['IRPINO Construction', '<html><head><title>IRPINO Construction</title></head><body><nav><a href="/contact/">CONTACT</a></nav><p>(773) 525-7345</p></body></html>'],
  ])('does not repeat the known %s contact-path false positive', async (_name, homepage) => {
    const fetchImpl = vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/'))
    const renderVerification = vi.fn(renderedGap)

    const result = await inspectOfficialWebsite('https://northside.example', { fetchImpl, validateUrl: allowPublicUrl, renderVerification })

    expect(result).toMatchObject({
      ok: false,
      noOpportunity: true,
      contactPathState: 'contact_path_exists',
    })
    expect(renderVerification).toHaveBeenCalledWith({ homepageUrl: 'https://northside.example/' })
  })

  it('requires rendered confirmation before a raw HTML absence can qualify', async () => {
    const homepage = '<html><head><title>Northside Repair</title></head><body><h1>Repair services</h1></body></html>'
    const result = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: renderedGap,
    })

    expect(result).toMatchObject({ ok: true, contactPathState: 'verified_gap', opportunity: 'Contact path may benefit from being more prominent.' })
    expect(result.facts).toContain('No clear customer contact, booking, quote, phone, or business email path was found after rendered verification.')
  })

  it('rejects a raw HTML absence when rendered verification finds a JavaScript CTA', async () => {
    const homepage = '<html><head><title>Northside Repair</title></head><body><h1>Repair services</h1></body></html>'
    const result = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: renderedContact,
    })

    expect(result).toMatchObject({ ok: false, noOpportunity: true, contactPathState: 'contact_path_exists' })
  })

  it('treats a renderer failure or exhausted render budget as insufficient evidence', async () => {
    const homepage = '<html><head><title>Northside Repair</title></head><body><h1>Repair services</h1></body></html>'
    const failedRenderer = async () => ({ state: 'insufficient_evidence', error: 'Rendered verification timed out.', pages: [], contacts: { email: null, phone: null } })
    const first = await inspectOfficialWebsite('https://northside.example', { fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/')), validateUrl: allowPublicUrl, renderVerification: failedRenderer })
    const second = await inspectOfficialWebsite('https://northside.example', { fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/')), validateUrl: allowPublicUrl, allowRenderedVerification: false })

    expect(first).toMatchObject({ ok: false, insufficientEvidence: true, contactPathState: 'insufficient_evidence' })
    expect(second).toMatchObject({ ok: false, insufficientEvidence: true, error: 'Rendered verification budget was exhausted.' })
  })

  it('stages a material mobile overflow as an owner-review signal without claiming the site is defective', async () => {
    const homepage = '<html><head><title>Northside Repair</title><meta name="description" content="Northside Repair provides complete Chicago auto repair, maintenance, diagnostics, and transparent service guidance."></head><body><a href="tel:+13125550123">Call us</a><p>Northside Repair provides complete auto repair, maintenance, diagnostics, and practical service guidance for Chicago drivers.</p></body></html>'
    const result = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: async () => ({
        state: 'contact_path_exists', error: null, signals: [], contacts: { email: null, phone: '+13125550123' },
        pages: [{
          url: 'https://northside.example/', status: 200, signals: [],
          review: {
            mobile_layout: { state: 'material_overflow', viewport_width: 390, document_width: 510, overflow_px: 120, elements: [{ tag: 'main', role: 'main', overflow_px: 120 }] },
            service_clarity: { state: 'service_explanation_found', word_count: 42, content_block_count: 2 },
          },
        }],
      }),
    })

    expect(result).toMatchObject({ ok: true, contactPathState: 'contact_path_exists' })
    expect(result.opportunities).toContainEqual(expect.objectContaining({
      type: 'MOBILE_LAYOUT_REVIEW', verification_state: 'material_overflow_confirmed',
      observed_fact: expect.stringContaining('120px beyond the 390px mobile viewport'),
    }))
    expect(result.opportunity).not.toMatch(/broken|poor|lost customers|bad design/i)
  })

  it('does not create a mobile review signal for responsive, trivial, or isolated overflow evidence', async () => {
    expect(assessMobileLayoutReview({ viewportWidth: 390, documentWidth: 390, materialElements: [] })).toMatchObject({ state: 'no_material_overflow', overflow_px: 0 })
    expect(assessMobileLayoutReview({ viewportWidth: 390, documentWidth: 390 + MOBILE_OVERFLOW_THRESHOLD_PX - 1, materialElements: [{ tag: 'main', role: 'main', overflow_px: MOBILE_OVERFLOW_THRESHOLD_PX - 1 }] })).toMatchObject({ state: 'no_material_overflow' })
    expect(assessMobileLayoutReview({ viewportWidth: 390, documentWidth: 510, materialElements: [{ tag: 'div', overflow_px: 120, isolated: true }] })).toMatchObject({ state: 'no_material_overflow', elements: [] })
  })

  it('requires corroborated raw and rendered lack before staging a service-clarity review signal', async () => {
    const homepage = '<html><head><title>Northside Repair</title></head><body><p>Welcome to our Chicago neighborhood team where people gather for local stories, community updates, and friendly conversation every week.</p><p>We share hours, announcements, seasonal notes, events, and helpful information for neighbors looking to stay connected with the community.</p></body></html>'
    const result = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: async () => ({
        state: 'verified_gap', error: null, signals: [], contacts: { email: null, phone: null },
        pages: [{
          url: 'https://northside.example/', status: 200, signals: [],
          review: {
            mobile_layout: { state: 'no_material_overflow', viewport_width: 390, document_width: 390, overflow_px: 0, elements: [] },
            service_clarity: { state: 'service_explanation_not_found', word_count: 44, content_block_count: 2, substantive_block_count: 2, heading_count: 0 },
          },
        }],
      }),
    })

    expect(result).toMatchObject({ ok: true, contactPathState: 'verified_gap' })
    expect(result.opportunities).toContainEqual(expect.objectContaining({
      type: 'SERVICE_CLARITY_REVIEW', verification_state: 'corroborated_review_signal',
    }))
    expect(result.opportunities).toContainEqual(expect.objectContaining({ type: 'CONTACT_PATH' }))
    expect(result).not.toHaveProperty('score')
  })

  it('does not infer a service-clarity review from a missing H1, missing meta description, image-led content, or renderer failure', async () => {
    expect(inspectHtmlServiceClarity('<html><head><title>Northside Repair</title></head><body><p>Northside Repair provides complete auto repair, maintenance, diagnostics, brake work, and reliable guidance for Chicago drivers every day.</p><p>Our technicians explain recommended work and keep every vehicle service visit straightforward and useful.</p></body></html>').state).not.toBe('service_explanation_not_found')
    expect(inspectHtmlServiceClarity('<html><head><meta name="description" content="Northside Repair provides complete auto repair maintenance diagnostics brake work and clear guidance for Chicago drivers."></head><body><h1>Northside Repair</h1><p>Our local team explains practical vehicle care and makes booking service straightforward for every customer.</p></body></html>').state).toBe('service_explanation_found')
    expect(inspectHtmlServiceClarity('<html><head><title>Northside Repair</title></head><body><img src="hero.jpg"><img src="shop.jpg"></body></html>').state).toBe('insufficient_evidence')

    const homepage = '<html><head><title>Northside Repair</title></head><body><p>Welcome to our Chicago neighborhood team where people gather for local stories, community updates, and friendly conversation every week.</p><p>We share hours, announcements, seasonal notes, events, and helpful information for neighbors looking to stay connected with the community.</p></body></html>'
    const result = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'https://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: async () => ({ state: 'insufficient_evidence', error: 'Rendered verification timed out.', pages: [], signals: [], contacts: { email: null, phone: null } }),
    })
    expect(result).toMatchObject({ ok: false, insufficientEvidence: true })
    expect(result.opportunities).toBeUndefined()
  })

  it('retains multiple high-confidence and owner-review signals on one candidate without a numeric ranking', async () => {
    const homepage = '<html><head><title>Northside Repair</title></head><body><p>Welcome to our Chicago neighborhood team where people gather for local stories, community updates, and friendly conversation every week.</p><p>We share hours, announcements, seasonal notes, events, and helpful information for neighbors looking to stay connected with the community.</p></body></html>'
    const result = await inspectOfficialWebsite('http://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(homepage, 'http://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: async () => ({
        state: 'verified_gap', error: null, signals: [], contacts: { email: null, phone: null },
        pages: [{
          url: 'http://northside.example/', status: 200, signals: [],
          review: {
            mobile_layout: { state: 'material_overflow', viewport_width: 390, document_width: 510, overflow_px: 120, elements: [{ tag: 'main', role: 'main', overflow_px: 120 }] },
            service_clarity: { state: 'service_explanation_not_found', word_count: 44, content_block_count: 2, substantive_block_count: 2, heading_count: 0 },
          },
        }],
      }),
    })

    expect(result.opportunities.map((opportunity) => opportunity.type)).toEqual(expect.arrayContaining([
      'CONTACT_PATH', 'HTTP_NOT_REDIRECTED_TO_HTTPS', 'MOBILE_LAYOUT_REVIEW', 'SERVICE_CLARITY_REVIEW',
    ]))
    expect(result.opportunities).toHaveLength(4)
    expect(result).not.toHaveProperty('score')
  })

  it('handles a website failure without throwing and limits inspection work to the configured maximum', async () => {
    const failedFetch = vi.fn().mockRejectedValue(new Error('timeout'))
    const failed = await inspectOfficialWebsite('https://timeout.example', { fetchImpl: failedFetch, validateUrl: allowPublicUrl })

    expect(failed).toEqual({ ok: false, error: 'The website inspection timed out or could not connect.' })
    expect(MAX_WEBSITE_INSPECTIONS).toBe(10)
  })

  it('blocks localhost, private addresses, and redirects to private addresses before a second fetch', async () => {
    await expect(validatePublicWebsiteUrl('http://127.0.0.1')).resolves.toMatchObject({ ok: false })
    await expect(validatePublicWebsiteUrl('https://private.example', { lookup: vi.fn().mockResolvedValue([{ address: '10.0.0.7', family: 4 }]) })).resolves.toMatchObject({ ok: false })
    const fetchImpl = vi.fn().mockResolvedValue(htmlResponse('', 'https://northside.example/', { status: 302, headers: { location: 'http://127.0.0.1' } }))
    const result = await inspectOfficialWebsite('https://northside.example', { fetchImpl, validateUrl: async (value) => value.includes('127.0.0.1') ? { ok: false, error: 'The website address does not resolve to a public network.' } : allowPublicUrl(value) })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ ok: false, error: 'The website address does not resolve to a public network.' })
  })

  it('uses a short-lived mocked renderer without clicking, typing, submitting, or external communications', async () => {
    const page = {
      setViewport: vi.fn(), setRequestInterception: vi.fn(), on: vi.fn(), goto: vi.fn().mockResolvedValue({ ok: () => true }), waitForNetworkIdle: vi.fn().mockResolvedValue(),
      evaluate: vi.fn().mockResolvedValue({ text: 'Request Estimate', elements: [{ tag: 'button', text: 'Request Estimate' }] }), url: vi.fn(() => 'https://northside.example/'), close: vi.fn(),
    }
    const browser = { newPage: vi.fn().mockResolvedValue(page), pages: vi.fn().mockResolvedValue([page]), close: vi.fn().mockResolvedValue() }
    const result = await verifyRenderedContactPath({ homepageUrl: 'https://northside.example/' }, { launchBrowser: vi.fn().mockResolvedValue(browser), validateUrl: allowPublicUrl })

    expect(result).toMatchObject({ state: 'contact_path_exists' })
    expect(page.goto).toHaveBeenCalledTimes(1)
    expect(page.click).toBeUndefined()
    expect(page.type).toBeUndefined()
  })

  it('qualifies a broken official listing link only when raw and rendered checks corroborate the same public 404 or 410', async () => {
    const result = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse('', 'https://northside.example/', { status: 404 })),
      validateUrl: allowPublicUrl,
      renderTransportVerification: renderedNotFound,
    })

    expect(result).toMatchObject({
      ok: true,
      contactPathState: 'not_assessed',
      opportunities: [expect.objectContaining({ type: 'OFFICIAL_LISTING_LINK_BROKEN', verification_state: 'confirmed_public_not_found' })],
    })
    expect(result.businessName).toBe('northside.example')
    expect(result.opportunity).toContain('website destination')
  })

  it.each([
    ['403', 403, { state: 'reachable', status: 403, url: 'https://northside.example/', error: null }],
    ['429', 429, { state: 'reachable', status: 429, url: 'https://northside.example/', error: null }],
    ['5xx', 503, { state: 'reachable', status: 503, url: 'https://northside.example/', error: null }],
    ['rendered failure', 404, { state: 'insufficient_evidence', status: null, url: null, error: 'Timed out' }],
    ['raw/render mismatch', 404, { state: 'not_found', status: 410, url: 'https://northside.example/', error: null }],
  ])('fails closed for a broken-link %s result', async (_label, status, rendered) => {
    const result = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse('', 'https://northside.example/', { status })),
      validateUrl: allowPublicUrl,
      renderTransportVerification: async () => rendered,
    })

    expect(result.ok).toBe(false)
    expect(result.opportunities).toBeUndefined()
  })

  it('does not convert timeouts, DNS failures, SSRF rejection, or redirect ambiguity into a broken-link opportunity', async () => {
    const timeout = await inspectOfficialWebsite('https://northside.example', { fetchImpl: vi.fn().mockRejectedValue(new Error('timeout')), validateUrl: allowPublicUrl })
    const ssrf = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse('', 'https://northside.example/', { status: 302, headers: { location: 'http://127.0.0.1' } })),
      validateUrl: async (value) => value.includes('127.0.0.1') ? { ok: false, error: 'The website address does not resolve to a public network.' } : allowPublicUrl(value),
    })
    const ambiguous = await inspectOfficialWebsite('https://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse('', 'https://northside.example/', { status: 404 })),
      validateUrl: allowPublicUrl,
      renderTransportVerification: async () => ({ state: 'not_found', status: 404, url: 'https://other.example/', error: null }),
    })

    expect(timeout.ok).toBe(false)
    expect(ssrf.ok).toBe(false)
    expect(ambiguous.ok).toBe(false)
  })

  it('qualifies HTTP only when raw and rendered public checks both remain on the same HTTP destination', async () => {
    const html = '<html><head><title>Northside Repair</title></head><body><a href="/contact">Contact</a></body></html>'
    const result = await inspectOfficialWebsite('http://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(html, 'http://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: async () => ({ state: 'contact_path_exists', error: null, pages: [{ url: 'http://northside.example/', status: 200, signals: [] }], signals: [], contacts: { email: null, phone: null } }),
    })

    expect(result).toMatchObject({ ok: true, opportunities: [expect.objectContaining({ type: 'HTTP_NOT_REDIRECTED_TO_HTTPS', verification_state: 'confirmed_http_without_https' })] })
    expect(result.contactPathState).toBe('contact_path_exists')
  })

  it.each([
    ['raw redirect to HTTPS', 'https://northside.example/', renderedHttp],
    ['rendered redirect to HTTPS', 'http://northside.example/', async () => ({ state: 'reachable', status: 200, url: 'https://northside.example/', error: null })],
    ['rendered failure', 'http://northside.example/', async () => ({ state: 'insufficient_evidence', error: 'Timed out', status: null, url: null })],
  ])('does not qualify HTTP when %s', async (_label, rawUrl, renderTransportVerification) => {
    const html = '<html><head><title>Northside Repair</title></head><body><a href="/contact">Contact</a></body></html>'
    const result = await inspectOfficialWebsite('http://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(html, rawUrl)),
      validateUrl: allowPublicUrl,
      renderTransportVerification,
    })

    expect(result.ok).toBe(false)
    expect(result.opportunities).toBeUndefined()
  })

  it('retains at most three unique opportunities, including unchanged CONTACT_PATH evidence', async () => {
    const html = '<html><head><title>Northside Repair</title></head><body><h1>Repair services</h1></body></html>'
    const renderedHttpGap = async () => ({ state: 'verified_gap', error: null, pages: [{ url: 'http://northside.example/', status: 200, signals: [] }], signals: [], contacts: { email: null, phone: null } })
    const result = await inspectOfficialWebsite('http://northside.example', {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(html, 'http://northside.example/')),
      validateUrl: allowPublicUrl,
      renderVerification: renderedHttpGap,
    })

    expect(result).toMatchObject({ ok: true, contactPathState: 'verified_gap' })
    expect(result.opportunities.map((opportunity) => opportunity.type)).toEqual(['CONTACT_PATH', 'HTTP_NOT_REDIRECTED_TO_HTTPS'])
    expect(new Set(result.opportunities.map((opportunity) => opportunity.type)).size).toBe(result.opportunities.length)
    expect(result.opportunities).toHaveLength(2)
  })

  it('reports a mocked rendered not-found response without interacting with forms or other external systems', async () => {
    const page = {
      setViewport: vi.fn(), setRequestInterception: vi.fn(), on: vi.fn(), goto: vi.fn().mockResolvedValue({ ok: () => false, status: () => 404 }), url: vi.fn(() => 'https://northside.example/'), close: vi.fn(),
    }
    const browser = { newPage: vi.fn().mockResolvedValue(page), pages: vi.fn().mockResolvedValue([page]), close: vi.fn().mockResolvedValue() }
    const result = await verifyRenderedWebsiteResponse({ homepageUrl: 'https://northside.example/' }, { launchBrowser: vi.fn().mockResolvedValue(browser), validateUrl: allowPublicUrl })

    expect(result).toMatchObject({ state: 'not_found', status: 404, url: 'https://northside.example/' })
    expect(page.click).toBeUndefined()
    expect(page.type).toBeUndefined()
  })

  it('normalizes only business identity comparison keys, not contact data', () => {
    expect(normalizeSalesIdentity('Cicéro — Web Studio!')).toBe('cicero web studio')
  })
})
