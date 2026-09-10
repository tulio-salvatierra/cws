import { inspectHtmlContactPath, inspectHtmlServiceClarity } from './contact-intelligence.js'
import { verifyRenderedContactPath, verifyRenderedWebsiteResponse } from './renderer.js'
import { parseHttpUrl, validatePublicWebsiteUrl } from './website-safety.js'

export const GOOGLE_PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
export const MAX_PLACES_SEARCHES = 4
export const MAX_PLACE_DETAIL_REQUESTS = 0
export const MAX_WEBSITE_INSPECTIONS = 10
export const MAX_RENDERED_VERIFICATIONS = 5
export const MAX_TRANSIENT_REVIEW_BUSINESSES = 10
export const WEBSITE_TIMEOUT_MS = 8_000

// displayName and websiteUri are used only in the immediate owner response.
// The discovery handler must never persist them until an owner-selected
// official-site inspection establishes retainable public-site evidence.
export const PLACE_FIELD_MASK = 'places.id,places.displayName,places.websiteUri,places.businessStatus'
export const DIAGNOSTIC_PLACE_FIELD_MASK = 'places.id,places.displayName,places.websiteUri,places.businessStatus'
const CHICAGO_LOCATION_RESTRICTION = {
  rectangle: {
    low: { latitude: 41.6445, longitude: -87.9401 },
    high: { latitude: 42.023, longitude: -87.524 },
  },
}
export const PLACES_DIAGNOSTIC_QUERY = { category: 'Auto repair', query: 'auto repair in Chicago, Illinois' }

// This is deliberately a short operating list, not a taxonomy.
export const CHICAGO_DISCOVERY_QUERIES = [
  { category: 'Auto repair', query: 'independent auto repair in Chicago, Illinois' },
  { category: 'Beauty and aesthetics', query: 'independent beauty or aesthetics business in Chicago, Illinois' },
  { category: 'Cleaning services', query: 'independent cleaning service in Chicago, Illinois' },
  { category: 'Contractors and home services', query: 'independent contractor or home service in Chicago, Illinois' },
]

export async function discoverGooglePlaces({ apiKey, fetchImpl = fetch }) {
  const records = []
  const warnings = []
  const diagnostics = []
  for (const search of CHICAGO_DISCOVERY_QUERIES.slice(0, MAX_PLACES_SEARCHES)) {
    const result = await searchGooglePlaces({ apiKey, search, fetchImpl, fieldMask: PLACE_FIELD_MASK })
    diagnostics.push(result.diagnostic)
    if (result.warning) warnings.push(result.warning)
    for (const place of result.places) {
      if (!place?.id || place.businessStatus && place.businessStatus !== 'OPERATIONAL') continue
      const businessName = safeDisplayName(place.displayName)
      const websiteUrl = safeHttpUrl(place.websiteUri)
      if (!businessName || !websiteUrl) continue
      records.push({ providerPlaceId: place.id, businessName, websiteUrl, category: search.category, locality: 'Chicago, IL' })
    }
  }
  return { records, warnings, diagnostics, placesSearches: CHICAGO_DISCOVERY_QUERIES.length, placeDetailRequests: 0 }
}

export async function diagnoseGooglePlaces({ apiKey, fetchImpl = fetch }) {
  const result = await searchGooglePlaces({ apiKey, search: PLACES_DIAGNOSTIC_QUERY, fetchImpl, fieldMask: DIAGNOSTIC_PLACE_FIELD_MASK })
  return {
    diagnostic: result.diagnostic,
    warning: result.warning,
    resultCount: result.places.length,
    sampleBusinessNames: result.places.slice(0, 3).map((place) => safeDisplayName(place?.displayName)).filter(Boolean),
    websiteFieldPresent: result.places.some((place) => Boolean(safeHttpUrl(place?.websiteUri))),
  }
}

async function searchGooglePlaces({ apiKey, search, fetchImpl, fieldMask }) {
  const occurredAt = new Date().toISOString()
  try {
    const response = await fetchImpl(GOOGLE_PLACES_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({
        textQuery: search.query,
        languageCode: 'en',
        regionCode: 'US',
        pageSize: 3,
        locationRestriction: CHICAGO_LOCATION_RESTRICTION,
      }),
    })
    const payload = await safeJson(response)
    if (!response.ok) {
      const error = safeProviderError(payload)
      return {
        places: [],
        warning: `Google Places search for ${search.category} returned ${response.status}.`,
        diagnostic: { category: search.category, searchQuery: search.query, outcome: 'error', httpStatus: response.status, providerStatus: error.status, providerCode: error.code, providerMessage: error.message, resultCount: 0, occurredAt },
      }
    }
    const places = Array.isArray(payload?.places) ? payload.places : []
    return {
      places,
      warning: '',
      diagnostic: { category: search.category, searchQuery: search.query, outcome: places.length ? 'success' : 'zero_results', httpStatus: response.status, providerStatus: null, providerCode: null, providerMessage: null, resultCount: places.length, occurredAt },
    }
  } catch {
    return {
      places: [],
      warning: `Google Places search for ${search.category} could not be completed.`,
      diagnostic: { category: search.category, searchQuery: search.query, outcome: 'error', httpStatus: null, providerStatus: 'NETWORK_ERROR', providerCode: null, providerMessage: 'Google Places request could not be completed.', resultCount: 0, occurredAt },
    }
  }
}

async function safeJson(response) {
  try { return await response.json() } catch { return null }
}

function safeProviderError(payload) {
  const error = payload && typeof payload.error === 'object' ? payload.error : {}
  return {
    status: cleanProviderStatus(error.status),
    code: Number.isInteger(error.code) ? error.code : null,
    message: sanitizeProviderMessage(error.message) || 'Google Places returned an HTTP error.',
  }
}

function cleanProviderStatus(value) {
  const status = String(value || '').trim().replace(/[^A-Z0-9_]/g, '').slice(0, 100)
  return status || null
}

function sanitizeProviderMessage(value) {
  return String(value || '')
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

function safeDisplayName(value) {
  return String(value?.text || '').replace(/\s+/g, ' ').trim().slice(0, 200)
}

export async function inspectOfficialWebsite(url, {
  fetchImpl = fetch,
  timeoutMs = WEBSITE_TIMEOUT_MS,
  validateUrl = validatePublicWebsiteUrl,
  renderVerification = verifyRenderedContactPath,
  renderTransportVerification = verifyRenderedWebsiteResponse,
  allowRenderedVerification = true,
  ownerSelected = false,
} = {}) {
  const listedWebsiteUrl = safeHttpUrl(url)
  if (!listedWebsiteUrl) return { ok: false, error: 'The website address was invalid.' }
  const homepage = await fetchHtml(url, { fetchImpl, timeoutMs, validateUrl })
  if (!homepage.ok) {
    if (ownerSelected) return { ok: false, error: homepage.error || 'The official website could not establish a durable public identity.' }
    return inspectBrokenOfficialListingLink({
      listedWebsiteUrl,
      homepage,
      renderTransportVerification,
      allowRenderedVerification,
    })
  }

  const homepageUrl = safeHttpUrl(homepage.url)
  if (!homepageUrl) return { ok: false, error: 'The website did not resolve to a public HTTP address.' }
  const homepageIntelligence = inspectHtmlContactPath(homepage.html, homepageUrl)
  const contact = homepageIntelligence.contactPageUrl
    ? await fetchHtml(homepageIntelligence.contactPageUrl, { fetchImpl, timeoutMs, validateUrl })
    : null
  const contactIntelligence = contact?.ok ? inspectHtmlContactPath(contact.html, contact.url) : null
  const detectedBusinessName = websiteBusinessName(homepage.html)
  const publicWebsiteName = detectedBusinessName || publicWebsiteLabel(homepageUrl)

  const htmlSignals = [...homepageIntelligence.signals, ...(contactIntelligence?.signals || [])]
  const contacts = mergeContacts(homepageIntelligence.contacts, contactIntelligence?.contacts)
  const evidenceUrls = [homepageUrl, ...(contact?.ok ? [contact.url] : [])]
  const rawServiceClarity = inspectHtmlServiceClarity(homepage.html)
  const htmlVerification = { state: htmlSignals.length ? 'contact_path_exists' : 'unverified_gap', signals: htmlSignals }
  const listedHttp = protocolOf(listedWebsiteUrl) === 'http:'

  if (htmlSignals.length) {
    const rendered = allowRenderedVerification ? await renderVerification({ homepageUrl }) : null
    const renderedHomepage = rendered?.pages?.[0] || null
    const opportunities = [
      ...httpTransportOpportunity({ listedHttp, homepageUrl, rendered: renderedHomepage }),
      ...ownerReviewOpportunities({ rawServiceClarity, renderedHomepage, evidenceUrls }),
    ]
    if (opportunities.length) {
      if (ownerSelected && !detectedBusinessName) return { ok: false, error: 'The official website did not provide a usable business name.' }
      return qualifiedWebsiteCandidate({
        businessName: ownerSelected ? detectedBusinessName : publicWebsiteName,
        websiteUrl: homepageUrl,
        contacts,
        facts: ['Homepage reachable.', ...opportunities.map((opportunity) => opportunity.observed_fact)],
        opportunities,
        evidenceUrls: uniqueUrls([...evidenceUrls, renderedHomepage?.url]),
        contactPathState: 'contact_path_exists',
        verification: { version: 's2d1', html: htmlVerification, rendered, service_clarity: rawServiceClarity, transport: transportEvidence(homepage, renderedHomepage) },
      })
    }
    if (!detectedBusinessName) return { ok: false, error: 'The official website did not provide a usable business name.' }
    if (ownerSelected) return ownerSelectedWebsiteCandidate({
      businessName: detectedBusinessName,
      websiteUrl: homepageUrl,
      contacts,
      evidenceUrls,
      contactPathState: 'contact_path_exists',
      verification: { version: 's2e', html: htmlVerification, rendered, service_clarity: rawServiceClarity, transport: transportEvidence(homepage, renderedHomepage) },
      contactFact: 'A clear customer contact, booking, quote, phone, or business email path was found in fetched HTML.',
    })
    return noContactOpportunity({ businessName: detectedBusinessName, websiteUrl: homepageUrl, contacts, evidenceUrls, htmlVerification, renderedVerification: rendered, reason: 'A clear customer contact, booking, quote, or phone path was found in fetched HTML.' })
  }
  if (!allowRenderedVerification) {
    if (!detectedBusinessName) return { ok: false, error: 'The official website did not provide a usable business name.' }
    return insufficientEvidence({ businessName: detectedBusinessName, websiteUrl: homepageUrl, contacts, evidenceUrls, htmlVerification, error: 'Rendered verification budget was exhausted.' })
  }

  const rendered = await renderVerification({ homepageUrl, contactPageUrl: contact?.ok ? contact.url : null })
  const mergedContacts = mergeContacts(contacts, rendered.contacts)
  const renderedHomepage = rendered.pages?.[0] || null
  if (rendered.state === 'contact_path_exists') {
    const opportunities = [
      ...httpTransportOpportunity({ listedHttp, homepageUrl, rendered: renderedHomepage }),
      ...ownerReviewOpportunities({ rawServiceClarity, renderedHomepage, evidenceUrls }),
    ]
    if (opportunities.length) {
      if (ownerSelected && !detectedBusinessName) return { ok: false, error: 'The official website did not provide a usable business name.' }
      return qualifiedWebsiteCandidate({
        businessName: ownerSelected ? detectedBusinessName : publicWebsiteName,
        websiteUrl: homepageUrl,
        contacts: mergedContacts,
        facts: ['Homepage reachable.', ...opportunities.map((opportunity) => opportunity.observed_fact)],
        opportunities,
        evidenceUrls: uniqueUrls([...evidenceUrls, renderedHomepage?.url]),
        contactPathState: 'contact_path_exists',
        verification: { version: 's2d1', html: htmlVerification, rendered, service_clarity: rawServiceClarity, transport: transportEvidence(homepage, renderedHomepage) },
      })
    }
    if (!detectedBusinessName) return { ok: false, error: 'The official website did not provide a usable business name.' }
    if (ownerSelected) return ownerSelectedWebsiteCandidate({
      businessName: detectedBusinessName,
      websiteUrl: homepageUrl,
      contacts: mergedContacts,
      evidenceUrls,
      contactPathState: 'contact_path_exists',
      verification: { version: 's2e', html: htmlVerification, rendered, service_clarity: rawServiceClarity, transport: transportEvidence(homepage, renderedHomepage) },
      contactFact: 'A clear customer contact, booking, quote, phone, or business email path was found after rendered verification.',
    })
    return noContactOpportunity({ businessName: detectedBusinessName, websiteUrl: homepageUrl, contacts: mergedContacts, evidenceUrls, htmlVerification, renderedVerification: rendered, reason: 'A clear customer contact, booking, quote, or phone path was found after rendered verification.' })
  }
  if (rendered.state !== 'verified_gap') {
    if (!detectedBusinessName) return { ok: false, error: 'The official website did not provide a usable business name.' }
    return insufficientEvidence({ businessName: detectedBusinessName, websiteUrl: homepageUrl, contacts: mergedContacts, evidenceUrls, htmlVerification, renderedVerification: rendered, error: rendered.error || 'Rendered verification did not establish a contact-path gap.' })
  }

  if (!detectedBusinessName) return { ok: false, error: 'The official website did not provide a usable business name.' }
  const opportunities = [contactPathOpportunity({ evidenceUrls })]
  opportunities.push(...httpTransportOpportunity({ listedHttp, homepageUrl, rendered: renderedHomepage }))
  opportunities.push(...ownerReviewOpportunities({ rawServiceClarity, renderedHomepage, evidenceUrls }))
  const facts = [
    'Homepage reachable.',
    'No clear customer contact, booking, quote, phone, or business email path was found in fetched HTML.',
    'No clear customer contact, booking, quote, phone, or business email path was found after rendered verification.',
  ]
  if (contact?.ok) facts.push('A directly discoverable contact page was also inspected.')
  facts.push(...ownerReviewFacts(opportunities))

  return qualifiedWebsiteCandidate({
    businessName: detectedBusinessName,
    websiteUrl: homepageUrl,
    contacts: mergedContacts,
    facts,
    opportunities,
    evidenceUrls: uniqueUrls([...evidenceUrls, renderedHomepage?.url]),
    contactPathState: 'verified_gap',
    verification: { version: 's2d1', html: htmlVerification, rendered, service_clarity: rawServiceClarity, transport: transportEvidence(homepage, renderedHomepage) },
  })
}

async function fetchHtml(initialUrl, { fetchImpl, timeoutMs, validateUrl }) {
  let currentUrl = initialUrl
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const safeUrl = await validateUrl(currentUrl)
    if (!safeUrl.ok) return { ok: false, error: safeUrl.error }
    currentUrl = safeUrl.url
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(currentUrl, {
        method: 'GET', redirect: 'manual', signal: controller.signal,
        headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'CWS-Sales-Research/1.0 (+https://www.cicerowebstudio.xyz)' },
      })
      const status = Number(response.status || 0)
      if (status >= 300 && status < 400) {
        const nextUrl = safeHttpUrl(response.headers?.get?.('location'), currentUrl)
        if (!nextUrl) return { ok: false, error: 'The website redirect was invalid.' }
        currentUrl = nextUrl
        continue
      }
      const resolvedUrl = safeHttpUrl(response.url || currentUrl) || currentUrl
      const resolvedSafety = await validateUrl(resolvedUrl)
      if (!resolvedSafety.ok) return { ok: false, error: resolvedSafety.error }
      if (!response.ok) return { ok: false, status, url: resolvedSafety.url, error: `The website returned ${status || 'an error'}.` }
      const contentType = response.headers?.get?.('content-type') || ''
      if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) return { ok: false, error: 'The website did not return an HTML page.' }
      const html = String(await response.text()).slice(0, 150_000)
      return { ok: true, status, url: resolvedSafety.url, html }
    } catch {
      return { ok: false, error: 'The website inspection timed out or could not connect.' }
    } finally {
      clearTimeout(timer)
    }
  }
  return { ok: false, error: 'The website redirected too many times.' }
}

function safeHttpUrl(value, base) {
  return parseHttpUrl(value, base)?.toString() || null
}

async function inspectBrokenOfficialListingLink({ listedWebsiteUrl, homepage, renderTransportVerification, allowRenderedVerification }) {
  if (![404, 410].includes(homepage.status) || !homepage.url) return { ok: false, error: homepage.error }
  if (!allowRenderedVerification) return { ok: false, insufficientEvidence: true, error: 'Rendered verification budget was exhausted.', websiteUrl: homepage.url }
  const rendered = await renderTransportVerification({ homepageUrl: homepage.url })
  if (rendered.state !== 'not_found' || rendered.status !== homepage.status || !samePublicDestination(homepage.url, rendered.url)) {
    return { ok: false, insufficientEvidence: true, error: rendered.error || 'Rendered verification did not corroborate the public not-found response.', websiteUrl: homepage.url, verification: { version: 's2c', rendered, transport: transportEvidence(homepage, rendered) } }
  }
  const type = 'OFFICIAL_LISTING_LINK_BROKEN'
  const opportunity = {
    type,
    observed_fact: `The public website destination returned HTTP ${homepage.status} in both bounded HTML and rendered verification.`,
    safe_inference: 'CWS could review or replace the public website destination linked from the business profile.',
    evidence_urls: uniqueUrls([homepage.url, rendered.url]),
    verification_state: 'confirmed_public_not_found',
  }
  return qualifiedWebsiteCandidate({
    businessName: publicWebsiteLabel(homepage.url),
    websiteUrl: homepage.url,
    contacts: { email: null, phone: null },
    facts: [opportunity.observed_fact],
    opportunities: [opportunity],
    evidenceUrls: opportunity.evidence_urls,
    contactPathState: 'not_assessed',
    verification: {
      version: 's2c',
      html: { state: 'not_found', status: homepage.status },
      rendered,
      transport: transportEvidence(homepage, rendered),
      source: { place_id_only: true, entry_protocol: protocolOf(listedWebsiteUrl) },
    },
  })
}

function qualifiedWebsiteCandidate({ businessName, websiteUrl, contacts, facts, opportunities, evidenceUrls, contactPathState, verification }) {
  const uniqueOpportunities = opportunities.filter((opportunity, index, values) => (
    index === values.findIndex((other) => other.type === opportunity.type)
  )).slice(0, 5)
  return {
    ok: true,
    businessName,
    websiteUrl,
    websiteDomain: new URL(websiteUrl).hostname.toLowerCase(),
    businessEmail: contacts.email,
    businessPhone: contacts.phone,
    facts,
    opportunities: uniqueOpportunities,
    opportunity: uniqueOpportunities[0]?.safe_inference || null,
    evidenceUrls: uniqueUrls(evidenceUrls),
    inspectedAt: new Date().toISOString(),
    contactPathState,
    verification,
  }
}

function ownerSelectedWebsiteCandidate({ businessName, websiteUrl, contacts, evidenceUrls, contactPathState, verification, contactFact }) {
  return qualifiedWebsiteCandidate({
    businessName,
    websiteUrl,
    contacts,
    facts: ['Homepage reachable.', contactFact],
    opportunities: [],
    evidenceUrls: uniqueUrls(evidenceUrls),
    contactPathState,
    verification,
  })
}

function contactPathOpportunity({ evidenceUrls }) {
  return {
    type: 'CONTACT_PATH',
    observed_fact: 'No clear customer contact, booking, quote, phone, or business email path was found in fetched HTML or rendered verification.',
    safe_inference: 'Contact path may benefit from being more prominent.',
    evidence_urls: uniqueUrls(evidenceUrls),
    verification_state: 'verified_gap',
  }
}

function ownerReviewOpportunities({ rawServiceClarity, renderedHomepage, evidenceUrls }) {
  const renderedReview = renderedHomepage?.review || {}
  const mobile = renderedReview.mobile_layout
  const service = renderedReview.service_clarity
  const opportunities = []

  if (mobile?.state === 'material_overflow') {
    const overflow = Number(mobile.overflow_px)
    const viewport = Number(mobile.viewport_width)
    opportunities.push({
      type: 'MOBILE_LAYOUT_REVIEW',
      observed_fact: `Rendered homepage content extended ${overflow}px beyond the ${viewport}px mobile viewport.`,
      safe_inference: 'Mobile layout may deserve review because rendered page content extended materially beyond the viewport.',
      evidence_urls: uniqueUrls([...evidenceUrls, renderedHomepage?.url]),
      verification_state: 'material_overflow_confirmed',
      details: {
        viewport_width: viewport,
        document_width: Number(mobile.document_width),
        overflow_px: overflow,
        elements: (mobile.elements || []).map((element) => ({ tag: element.tag, role: element.role || null, overflow_px: Number(element.overflow_px) })).slice(0, 5),
      },
    })
  }

  if (rawServiceClarity?.state === 'service_explanation_not_found'
    && service?.state === 'service_explanation_not_found') {
    opportunities.push({
      type: 'SERVICE_CLARITY_REVIEW',
      observed_fact: 'Neither bounded raw HTML nor rendered homepage content contained a substantive public explanation of the business service offering.',
      safe_inference: 'Service offering may deserve owner review because it was not clearly explained in the inspected homepage content.',
      evidence_urls: uniqueUrls([...evidenceUrls, renderedHomepage?.url]),
      verification_state: 'corroborated_review_signal',
      details: {
        raw_word_count: Number(rawServiceClarity.word_count),
        rendered_word_count: Number(service.word_count),
        raw_content_blocks: Number(rawServiceClarity.content_block_count),
        rendered_content_blocks: Number(service.content_block_count),
      },
    })
  }
  return opportunities
}

function ownerReviewFacts(opportunities) {
  return opportunities
    .filter((opportunity) => ['MOBILE_LAYOUT_REVIEW', 'SERVICE_CLARITY_REVIEW'].includes(opportunity.type))
    .map((opportunity) => opportunity.observed_fact)
}

function httpTransportOpportunity({ listedHttp, homepageUrl, rendered }) {
  if (!listedHttp || protocolOf(homepageUrl) !== 'http:') return []
  if (!rendered || rendered.state === 'insufficient_evidence' || !isSuccessfulStatus(rendered.status) || protocolOf(rendered.url) !== 'http:') return []
  if (!samePublicDestination(homepageUrl, rendered.url)) return []
  return [{
    type: 'HTTP_NOT_REDIRECTED_TO_HTTPS',
    observed_fact: 'The inspected public website entry point remained on HTTP without redirecting to HTTPS in both bounded HTML and rendered verification.',
    safe_inference: 'CWS could help move the public website entry point to HTTPS.',
    evidence_urls: uniqueUrls([homepageUrl, rendered.url]),
    verification_state: 'confirmed_http_without_https',
  }]
}

function transportEvidence(raw, rendered) {
  return {
    raw_status: raw.status || null,
    raw_url: raw.url || null,
    rendered_status: rendered?.status || null,
    rendered_url: rendered?.url || null,
  }
}

function publicWebsiteLabel(url) {
  return new URL(url).hostname.replace(/^www\./i, '').slice(0, 200)
}

function protocolOf(url) {
  try { return new URL(url).protocol } catch { return null }
}

function isSuccessfulStatus(status) {
  return Number.isInteger(status) && status >= 200 && status < 300
}

function samePublicDestination(first, second) {
  try {
    const left = new URL(first)
    const right = new URL(second)
    return left.hostname === right.hostname
      && left.pathname.replace(/\/$/, '') === right.pathname.replace(/\/$/, '')
      && left.search === right.search
  } catch {
    return false
  }
}

function uniqueUrls(values) {
  return [...new Set(values.filter(Boolean))].slice(0, 3)
}

function websiteBusinessName(html) {
  const siteName = attributeContent(html, /<meta[^>]+(?:property|name)=["'](?:og:site_name|application-name)["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || attributeContent(html, /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:site_name|application-name)["'][^>]*>/i)
    || textBetween(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const cleaned = cleanWebsiteText(siteName).split(/\s+[|–—-]\s+/)[0]?.trim() || ''
  if (!cleaned || /^(home|welcome|website|untitled)$/i.test(cleaned) || cleaned.length > 200) return ''
  return cleaned
}

function mergeContacts(first, second = {}) {
  return { email: first?.email || second?.email || null, phone: first?.phone || second?.phone || null }
}

function noContactOpportunity({ businessName, websiteUrl, contacts, evidenceUrls, htmlVerification, renderedVerification = null, reason }) {
  return {
    ok: false,
    noOpportunity: true,
    outcome: 'contact_path_exists',
    reason,
    businessName,
    websiteUrl,
    websiteDomain: new URL(websiteUrl).hostname.toLowerCase(),
    businessEmail: contacts.email,
    businessPhone: contacts.phone,
    evidenceUrls,
    contactPathState: 'contact_path_exists',
    verification: { version: 's2b', html: htmlVerification, rendered: renderedVerification },
  }
}

function insufficientEvidence({ businessName, websiteUrl, contacts, evidenceUrls, htmlVerification, renderedVerification = null, error }) {
  return {
    ok: false,
    insufficientEvidence: true,
    outcome: 'insufficient_evidence',
    error,
    businessName,
    websiteUrl,
    websiteDomain: new URL(websiteUrl).hostname.toLowerCase(),
    businessEmail: contacts.email,
    businessPhone: contacts.phone,
    evidenceUrls,
    contactPathState: 'insufficient_evidence',
    verification: { version: 's2b', html: htmlVerification, rendered: renderedVerification },
  }
}

function attributeContent(html, expression) {
  return expression.exec(html)?.[1] || ''
}

function textBetween(html, expression) {
  return expression.exec(html)?.[1] || ''
}

function cleanWebsiteText(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizeSalesIdentity(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 200)
}
