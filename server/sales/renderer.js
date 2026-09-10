import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { inspectRenderedContactPath, inspectRenderedServiceClarity } from './contact-intelligence.js'
import { validatePublicWebsiteUrl } from './website-safety.js'

export const RENDER_TIMEOUT_MS = 6_000
export const MOBILE_OVERFLOW_THRESHOLD_PX = 80
const RENDER_VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
const ALLOWED_RESOURCE_TYPES = new Set(['document', 'script', 'stylesheet', 'xhr', 'fetch', 'image', 'font'])

export async function verifyRenderedContactPath({ homepageUrl, contactPageUrl }, {
  launchBrowser = launchServerBrowser,
  validateUrl = validatePublicWebsiteUrl,
  timeoutMs = RENDER_TIMEOUT_MS,
} = {}) {
  const homepage = await validateUrl(homepageUrl)
  if (!homepage.ok) return insufficient(homepage.error)
  const contact = contactPageUrl ? await validateUrl(contactPageUrl) : null
  if (contactPageUrl && !contact?.ok) return insufficient(contact.error)

  let browser
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setViewport(RENDER_VIEWPORT)
    await protectBrowserRequests(page, validateUrl)

    const homepageResult = await inspectPage(page, homepage.url, timeoutMs)
    if (!homepageResult.ok) return insufficient(homepageResult.error)
    if (homepageResult.intelligence.hasContactPath) return exists([homepageResult])

    if (contact?.url && contact.url !== homepageResult.url) {
      const contactResult = await inspectPage(page, contact.url, timeoutMs)
      if (!contactResult.ok) return insufficient(contactResult.error, [homepageResult])
      if (contactResult.intelligence.hasContactPath) return exists([homepageResult, contactResult])
      return absent([homepageResult, contactResult])
    }
    return absent([homepageResult])
  } catch {
    return insufficient('Rendered verification could not complete.')
  } finally {
    if (browser) await closeBrowser(browser)
  }
}

// This deliberately verifies only the public document response. It does not
// inspect forms or interact with the page. Discovery uses it to corroborate
// transport facts (a public 404/410 or an HTTP destination) separately from
// contact-path intelligence.
export async function verifyRenderedWebsiteResponse({ homepageUrl }, {
  launchBrowser = launchServerBrowser,
  validateUrl = validatePublicWebsiteUrl,
  timeoutMs = RENDER_TIMEOUT_MS,
} = {}) {
  const homepage = await validateUrl(homepageUrl)
  if (!homepage.ok) return transportInsufficient(homepage.error)

  let browser
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setViewport(RENDER_VIEWPORT)
    await protectBrowserRequests(page, validateUrl)
    const result = await inspectPage(page, homepage.url, timeoutMs, { includeSnapshot: false })
    if (result.ok) return { state: 'reachable', status: result.status, url: result.url, error: null }
    if ([404, 410].includes(result.status) && result.url) {
      return { state: 'not_found', status: result.status, url: result.url, error: null }
    }
    return transportInsufficient(result.error, result)
  } catch {
    return transportInsufficient('Rendered verification could not complete.')
  } finally {
    if (browser) await closeBrowser(browser)
  }
}

// Sales S3 uses the same bounded, SSRF-protected browser for a compact
// evidence packet. It reads at most the supplied homepage and one already
// discovered same-origin contact page; it never interacts with the site.
export async function collectRenderedProspectEvidence({ homepageUrl, contactPageUrl }, {
  launchBrowser = launchServerBrowser,
  validateUrl = validatePublicWebsiteUrl,
  timeoutMs = RENDER_TIMEOUT_MS,
} = {}) {
  const homepage = await validateUrl(homepageUrl)
  if (!homepage.ok) return { ok: false, error: homepage.error, pages: [] }
  const contact = contactPageUrl ? await validateUrl(contactPageUrl) : null
  if (contactPageUrl && !contact?.ok) return { ok: false, error: contact.error, pages: [] }
  if (contact?.url && new URL(contact.url).origin !== new URL(homepage.url).origin) {
    return { ok: false, error: 'The contact page is not on the official website origin.', pages: [] }
  }

  let browser
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setViewport(RENDER_VIEWPORT)
    await protectBrowserRequests(page, validateUrl)
    const results = []
    const homepageResult = await inspectPage(page, homepage.url, timeoutMs)
    if (!homepageResult.ok) return { ok: false, error: homepageResult.error, pages: [] }
    results.push(prospectEvidencePage(homepageResult))
    if (contact?.url && contact.url !== homepageResult.url) {
      const contactResult = await inspectPage(page, contact.url, timeoutMs)
      if (!contactResult.ok) return { ok: false, error: contactResult.error, pages: results }
      results.push(prospectEvidencePage(contactResult))
    }
    return { ok: true, error: null, pages: results }
  } catch {
    return { ok: false, error: 'Rendered verification could not complete.', pages: [] }
  } finally {
    if (browser) await closeBrowser(browser)
  }
}

async function launchServerBrowser() {
  chromium.setGraphicsMode = false
  return puppeteer.launch({
    args: puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
    defaultViewport: RENDER_VIEWPORT,
    executablePath: await chromium.executablePath(),
    headless: 'shell',
  })
}

async function protectBrowserRequests(page, validateUrl) {
  await page.setRequestInterception(true)
  page.on('request', async (request) => {
    try {
      if (request.isInterceptResolutionHandled?.() || !ALLOWED_RESOURCE_TYPES.has(request.resourceType())) return request.abort('blockedbyclient')
      const checked = await validateUrl(request.url())
      if (!checked.ok) return request.abort('blockedbyclient')
      return request.continue()
    } catch {
      if (!request.isInterceptResolutionHandled?.()) return request.abort('blockedbyclient')
    }
  })
}

async function inspectPage(page, url, timeoutMs, { includeSnapshot = true } = {}) {
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs })
    const status = renderedStatus(response)
    const resolvedUrl = page.url()
    if (!response || !response.ok()) return { ok: false, status, url: resolvedUrl, error: 'Rendered page did not return a successful response.' }
    if (!includeSnapshot) return { ok: true, status, url: resolvedUrl, intelligence: null }
    await page.waitForNetworkIdle({ idleTime: 250, timeout: Math.min(timeoutMs, 1_500) }).catch(() => undefined)
    const snapshot = await page.evaluate(() => {
      const visible = (element) => {
        const style = window.getComputedStyle(element)
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && element.getClientRects().length > 0
      }
      const textFor = (element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 2_000)
      const contentRoot = document.querySelector('main, [role="main"], article') || document.body
      const isIsolatedOverflow = (element) => {
        let current = element
        for (let depth = 0; current && depth < 8; depth += 1, current = current.parentElement) {
          const style = window.getComputedStyle(current)
          const marker = `${current.id || ''} ${typeof current.className === 'string' ? current.className : ''}`.toLowerCase()
          if (/(?:carousel|slider|swiper|slick|chat|intercom|cookie|consent)/.test(marker)
            || style.position === 'fixed'
            || style.position === 'sticky'
            || /^(?:auto|scroll)$/.test(style.overflowX)) return true
        }
        return false
      }
      const elements = [...document.querySelectorAll('a, button, form, input, textarea, select')]
        .filter(visible)
        .slice(0, 500)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          href: element.getAttribute('href') || '',
          text: element.innerText || element.textContent || '',
          ariaLabel: element.getAttribute('aria-label') || '',
          title: element.getAttribute('title') || '',
          value: element.getAttribute('value') || '',
          type: element.getAttribute('type') || '',
          action: element.getAttribute('action') || '',
        }))
      const headings = [...contentRoot.querySelectorAll('h1, h2, h3, [role="heading"]')]
        .filter(visible)
        .map(textFor)
        .filter(Boolean)
        .slice(0, 30)
      const contentBlocks = [...contentRoot.querySelectorAll('p, li, article, section')]
        .filter(visible)
        .map(textFor)
        .filter(Boolean)
        .slice(0, 80)
      const viewportWidth = Math.round(window.innerWidth || document.documentElement.clientWidth || 0)
      const documentWidth = Math.ceil(Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0))
      const materialElements = [...document.querySelectorAll('main, [role="main"], header, section, article, form, body > div, body > img')]
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect()
          const overflowPx = Math.ceil(rect.right - viewportWidth)
          return {
            tag: element.tagName.toLowerCase(),
            role: element.getAttribute('role') || null,
            overflow_px: overflowPx,
            isolated: isIsolatedOverflow(element),
          }
        })
        .filter((element) => element.overflow_px >= 80 && !element.isolated)
        .map((element) => ({ tag: element.tag, role: element.role, overflow_px: element.overflow_px }))
        .slice(0, 5)
      return {
        text: document.body?.innerText?.slice(0, 50_000) || '',
        elements,
        headings,
        contentBlocks,
        mobileLayout: { viewportWidth, documentWidth, materialElements },
      }
    })
    return {
      ok: true,
      status,
      url: resolvedUrl,
      snapshot,
      intelligence: inspectRenderedContactPath(snapshot, resolvedUrl),
      review: {
        mobile_layout: assessMobileLayoutReview(snapshot.mobileLayout),
        service_clarity: inspectRenderedServiceClarity(snapshot),
      },
    }
  } catch {
    return { ok: false, error: 'Rendered verification timed out, was blocked, or could not render.' }
  }
}

function prospectEvidencePage(result) {
  return {
    url: result.url,
    headings: (result.snapshot?.headings || []).slice(0, 8),
    excerpts: (result.snapshot?.contentBlocks || []).slice(0, 5).map((value) => String(value).slice(0, 420)),
    contact_state: result.intelligence?.hasContactPath ? 'contact_path_exists' : 'no_clear_contact_path_in_rendered_page',
    contact_signals: result.intelligence?.signals?.slice(0, 8) || [],
  }
}

function renderedStatus(response) {
  const value = typeof response?.status === 'function' ? response.status() : response?.status
  if (Number.isInteger(value)) return value
  return response?.ok?.() ? 200 : null
}

function exists(pages) {
  return result('contact_path_exists', pages)
}

function absent(pages) {
  return result('verified_gap', pages)
}

function insufficient(error, pages = []) {
  return { state: 'insufficient_evidence', error, pages: serialisePages(pages), contacts: { email: null, phone: null } }
}

function result(state, pages) {
  const signals = pages.flatMap((page) => page.intelligence.signals)
  const contacts = pages.reduce((current, page) => ({
    email: current.email || page.intelligence.contacts.email,
    phone: current.phone || page.intelligence.contacts.phone,
  }), { email: null, phone: null })
  return { state, error: null, pages: serialisePages(pages), signals, contacts }
}

function serialisePages(pages) {
  return pages.map((page) => ({ url: page.url, status: page.status || null, signals: page.intelligence?.signals || [], review: page.review || null }))
}

export function assessMobileLayoutReview({ viewportWidth, documentWidth, materialElements } = {}) {
  const viewport = Number(viewportWidth)
  const document = Number(documentWidth)
  const overflow = document - viewport
  const elements = (Array.isArray(materialElements) ? materialElements : []).filter((element) => !element?.isolated)
  const hasCoreElement = elements.some((element) => ['main', 'header', 'section', 'article', 'form'].includes(element?.tag) || element?.role === 'main')
  const state = Number.isFinite(viewport) && viewport > 0 && Number.isFinite(document)
    ? overflow >= MOBILE_OVERFLOW_THRESHOLD_PX && (hasCoreElement || elements.length >= 2)
      ? 'material_overflow'
      : 'no_material_overflow'
    : 'insufficient_evidence'
  return {
    state,
    viewport_width: Number.isFinite(viewport) ? viewport : null,
    document_width: Number.isFinite(document) ? document : null,
    overflow_px: Number.isFinite(overflow) ? Math.max(0, overflow) : null,
    elements: elements.slice(0, 5),
  }
}

function transportInsufficient(error, result = {}) {
  return {
    state: 'insufficient_evidence',
    status: result.status || null,
    url: result.url || null,
    error,
  }
}

async function closeBrowser(browser) {
  try {
    for (const page of await browser.pages()) await Promise.resolve(page.close()).catch(() => undefined)
    await browser.close()
  } catch {
    // The request is already complete; a failed close must not change qualification.
  }
}
