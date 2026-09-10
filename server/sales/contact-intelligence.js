const GENERIC_EMAIL_LOCAL_PARTS = new Set(['info', 'hello', 'contact', 'sales', 'office', 'booking', 'appointments', 'reservations'])
const CTA_PATTERN = /\b(?:contact(?:\s+us)?|book(?:\s+now)?|schedule(?:\s+now)?|appointment|request\s+(?:(?:a|my)\s+)?(?:free\s+)?quote|get\s+(?:(?:a|my)\s+)?(?:free\s+)?quote|request\s+(?:an?\s+)?(?:free\s+)?estimate|get\s+(?:an?\s+)?(?:free\s+)?estimate|call(?:\s+us)?|consultation|reserve(?:\s+now)?|request\s+service|get\s+in\s+touch)\b/i
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_PATTERN = /(?<!\d)(?:\+?1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?[2-9]\d{2}[\s.-]\d{4}(?!\d)/g
const MIN_SERVICE_TEXT_WORDS = 40
const MIN_SERVICE_CONTENT_BLOCKS = 2
const MIN_SERVICE_BLOCK_WORDS = 12
const MIN_SERVICE_HEADING_WORDS = 5
const MIN_META_DESCRIPTION_WORDS = 8

export function inspectHtmlContactPath(html, sourceUrl) {
  const text = visibleText(html)
  const elements = collectHtmlElements(html)
  const signals = collectSignals({ text, elements, sourceUrl })
  return { ...signals, contactPageUrl: findContactPage(elements, sourceUrl) }
}

export function inspectRenderedContactPath(snapshot, sourceUrl) {
  return collectSignals({
    text: String(snapshot?.text || ''),
    elements: Array.isArray(snapshot?.elements) ? snapshot.elements : [],
    sourceUrl,
  })
}

// This is intentionally a narrow review signal, not a quality judgment. It
// only reports an absence after the page has enough visible, structured text
// to inspect and neither explanatory prose nor a meaningful heading is found.
export function inspectHtmlServiceClarity(html) {
  const metadata = attributeValue(html, 'description')
  return assessServiceClarity({
    text: visibleText(html),
    headings: tagTexts(html, /h[1-3]/i),
    contentBlocks: tagTexts(html, /(?:p|li|article|section)/i),
    metadata,
  })
}

export function inspectRenderedServiceClarity(snapshot) {
  return assessServiceClarity({
    text: snapshot?.text,
    headings: snapshot?.headings,
    contentBlocks: snapshot?.contentBlocks,
    metadata: '',
  })
}

export function publicBusinessContacts({ text, elements, sourceUrl }) {
  const host = new URL(sourceUrl).hostname.replace(/^www\./i, '').toLowerCase()
  const values = elementValues(elements)
  const emailCandidates = unique([
    ...matches(text, EMAIL_PATTERN),
    ...values.flatMap((value) => matches(value.href || '', /mailto:([^?\s"'>]+)/gi).map(decodeContact)),
    ...values.flatMap((value) => matches(value.text || '', EMAIL_PATTERN)),
  ].map((value) => String(value).toLowerCase()))
  const phoneCandidates = unique([
    ...matches(text, PHONE_PATTERN),
    ...values.flatMap((value) => matches(value.href || '', /tel:([^?\s"'>]+)/gi).map(decodeContact)),
    ...values.flatMap((value) => matches(value.text || '', PHONE_PATTERN)),
  ].map(normalizePhone).filter(Boolean))

  return {
    email: emailCandidates.find((email) => isPublicBusinessEmail(email, host)) || null,
    phone: phoneCandidates[0] || null,
  }
}

function collectSignals({ text, elements, sourceUrl }) {
  const contacts = publicBusinessContacts({ text, elements, sourceUrl })
  const signals = []
  const values = elementValues(elements)
  const visibleEmails = unique([
    ...matches(text, EMAIL_PATTERN),
    ...values.flatMap((value) => matches(value.text || '', EMAIL_PATTERN)),
  ])
  for (const value of values) {
    const href = String(value.href || '').trim()
    const label = normalise(`${value.text || ''} ${value.ariaLabel || ''} ${value.title || ''} ${value.value || ''}`)
    if (/^mailto:/i.test(href)) signals.push(signal('email_link', label || 'Email link', value.sourceUrl || sourceUrl))
    else if (/^tel:/i.test(href)) signals.push(signal('phone_link', label || 'Phone link', value.sourceUrl || sourceUrl))
    else if (CTA_PATTERN.test(`${label} ${href}`)) signals.push(signal('transactional_cta', label || href, value.sourceUrl || sourceUrl))
  }
  if (contacts.email) signals.push(signal('public_business_email', contacts.email, sourceUrl))
  if (contacts.phone) signals.push(signal('public_business_phone', contacts.phone, sourceUrl))
  // A published address can be a customer contact path even when it is not a
  // generic mailbox we are allowed to retain as a Sales contact.
  if (visibleEmails.length) signals.push(signal('visible_email', 'Published email address', sourceUrl))
  if (hasTransactionalForm(elements)) signals.push(signal('transactional_form', 'Contact, booking, or quote form', sourceUrl))
  return { hasContactPath: signals.length > 0, signals: uniqueSignals(signals), contacts }
}

function collectHtmlElements(html) {
  const elements = []
  const expression = /<(a|button|form|input|textarea|select)\b([^>]*)>([\s\S]*?)<\/\1>|<(input|textarea|select)\b([^>]*)\/?\s*>/gi
  for (const match of html.matchAll(expression)) {
    const tag = (match[1] || match[4] || '').toLowerCase()
    const attributes = parseAttributes(match[2] || match[5] || '')
    elements.push({
      tag,
      href: attributes.href || '',
      text: visibleText(match[3] || ''),
      ariaLabel: attributes['aria-label'] || '',
      title: attributes.title || '',
      value: attributes.value || '',
      type: attributes.type || '',
      action: attributes.action || '',
    })
  }
  return elements
}

function findContactPage(elements, sourceUrl) {
  for (const element of elements) {
    if (element.tag !== 'a' || !element.href) continue
    const target = safeSameOriginUrl(element.href, sourceUrl)
    if (target && CTA_PATTERN.test(`${element.href} ${element.text} ${element.ariaLabel} ${element.title}`)) return target
  }
  return null
}

function safeSameOriginUrl(value, base) {
  try {
    const target = new URL(value, base)
    return ['http:', 'https:'].includes(target.protocol) && target.origin === new URL(base).origin ? target.toString() : null
  } catch {
    return null
  }
}

function hasTransactionalForm(elements) {
  const forms = elements.filter((element) => element.tag === 'form')
  return forms.some((form) => CTA_PATTERN.test(`${form.text} ${form.ariaLabel} ${form.title} ${form.action}`))
}

function elementValues(elements) {
  return elements.filter((element) => ['a', 'button', 'input', 'textarea', 'select'].includes(String(element.tag || '').toLowerCase()))
}

function parseAttributes(raw) {
  const attributes = {}
  for (const match of raw.matchAll(/([\w:-]+)(?:\s*=\s*["']([^"']*)["']|\s*=\s*([^\s"'=<>`]+))?/g)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? ''
  }
  return attributes
}

function attributeValue(html, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return attributeContent(html, new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'))
    || attributeContent(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, 'i'))
}

function attributeContent(html, expression) {
  return expression.exec(String(html || ''))?.[1] || ''
}

function tagTexts(html, tagExpression) {
  const expression = new RegExp(`<${tagExpression.source}\\b[^>]*>([\\s\\S]*?)<\\/${tagExpression.source}>`, 'gi')
  return [...String(html || '').matchAll(expression)]
    .map((match) => normalise(visibleText(match[1])))
    .filter(Boolean)
    .slice(0, 40)
}

function assessServiceClarity({ text, headings, contentBlocks, metadata }) {
  const safeText = normalise(text)
  const safeHeadings = normaliseValues(headings)
  const safeBlocks = normaliseValues(contentBlocks)
  const wordCount = countWords(safeText)
  const substantiveBlocks = safeBlocks.filter((value) => countWords(value) >= MIN_SERVICE_BLOCK_WORDS)
  const meaningfulHeadings = safeHeadings.filter((value) => countWords(value) >= MIN_SERVICE_HEADING_WORDS)
  const metadataWords = countWords(metadata)
  const hasExplanation = metadataWords >= MIN_META_DESCRIPTION_WORDS
    || substantiveBlocks.some((value) => countWords(value) >= 20)
    || (meaningfulHeadings.length > 0 && substantiveBlocks.length > 0)
  const hasEnoughStructuredText = wordCount >= MIN_SERVICE_TEXT_WORDS
    && (safeBlocks.length >= MIN_SERVICE_CONTENT_BLOCKS || substantiveBlocks.length >= 1)

  // Positive evidence is useful even for a compact page. The stricter text
  // threshold applies only before concluding that an explanation was absent.
  if (hasExplanation) {
    return {
      state: 'service_explanation_found',
      word_count: wordCount,
      content_block_count: safeBlocks.length,
      substantive_block_count: substantiveBlocks.length,
      heading_count: safeHeadings.length,
    }
  }

  if (!hasEnoughStructuredText) {
    return {
      state: 'insufficient_evidence',
      word_count: wordCount,
      content_block_count: safeBlocks.length,
      substantive_block_count: substantiveBlocks.length,
      heading_count: safeHeadings.length,
    }
  }

  return {
    state: 'service_explanation_not_found',
    word_count: wordCount,
    content_block_count: safeBlocks.length,
    substantive_block_count: substantiveBlocks.length,
    heading_count: safeHeadings.length,
  }
}

function normaliseValues(values) {
  return (Array.isArray(values) ? values : []).map(normalise).filter(Boolean).slice(0, 40)
}

function countWords(value) {
  return normalise(value).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length || 0
}

function visibleText(html) {
  return decodeEntities(String(html || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--([\s\S]*?)-->/gi, ' ').replace(/<[^>]*>/g, ' '))
}

function decodeEntities(value) {
  return String(value).replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
}

function matches(value, expression) {
  return [...String(value || '').matchAll(expression)].map((match) => match[1] || match[0])
}

function decodeContact(value) {
  try { return decodeURIComponent(value).trim() } catch { return String(value || '').trim() }
}

function isPublicBusinessEmail(email, host) {
  const [localPart, domain] = String(email || '').split('@')
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && (domain === host || domain?.endsWith(`.${host}`))
    && GENERIC_EMAIL_LOCAL_PARTS.has(localPart)
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return ''
}

function normalise(value) {
  return decodeEntities(String(value || '')).replace(/\s+/g, ' ').trim()
}

function signal(kind, label, sourceUrl) {
  return { kind, label: normalise(label).slice(0, 200), sourceUrl }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function uniqueSignals(signals) {
  const seen = new Set()
  return signals.filter((item) => {
    const key = `${item.kind}:${item.label}:${item.sourceUrl}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 12)
}
