export type NegocioListoLeadForm = 'popup' | 'inline'

export interface NegocioListoLeadPayload {
  form: NegocioListoLeadForm
  lang: 'es' | 'en'
  name: string
  phone: string
  email?: string
  business_name?: string
  business_type?: string
  plan_interest?: string
  has_website?: string
  company_website?: string
  elapsed_ms: number
}

const SENT_KEY = 'nl-lead-sent'
const DISMISSED_KEY = 'nl-popup-dismissed'

export function hasValidUsPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
}

function readUtm() {
  try {
    const params = new URLSearchParams(window.location.search)
    return { utm_source: params.get('utm_source') || '', utm_campaign: params.get('utm_campaign') || '' }
  } catch {
    return { utm_source: '', utm_campaign: '' }
  }
}

export async function submitNegocioListoLead(payload: NegocioListoLeadPayload) {
  const response = await fetch('/api/outreach/public-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, ...readUtm() }),
  })
  const result = await response.json().catch(() => ({ ok: false }))
  if (!response.ok || !result.ok) throw new Error(result.error || 'Lead capture failed')
  rememberLeadSent()
  return result
}

function safeGet(storage: 'local' | 'session', key: string) {
  try {
    return (storage === 'local' ? window.localStorage : window.sessionStorage).getItem(key)
  } catch {
    return null
  }
}

function safeSet(storage: 'local' | 'session', key: string) {
  try {
    ;(storage === 'local' ? window.localStorage : window.sessionStorage).setItem(key, '1')
  } catch {
    // Storage can be blocked (private mode); the popup then simply shows again next visit.
  }
}

export function rememberLeadSent() { safeSet('local', SENT_KEY) }
export function rememberPopupDismissed() { safeSet('session', DISMISSED_KEY) }
export function shouldOfferPopup() { return !safeGet('local', SENT_KEY) && !safeGet('session', DISMISSED_KEY) }
