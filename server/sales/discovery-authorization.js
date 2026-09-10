/* global process */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'
import {
  CHICAGO_DISCOVERY_QUERIES,
  MAX_PLACE_DETAIL_REQUESTS,
  MAX_PLACES_SEARCHES,
  MAX_WEBSITE_INSPECTIONS,
} from './discovery.js'
import { parseHttpUrl } from './website-safety.js'

export const DISCOVERY_ACTION = 'discover_prospects'
export const INVESTIGATE_DISCOVERED_BUSINESS_ACTION = 'investigate_discovered_business'
export const SKIP_DISCOVERED_BUSINESS_ACTION = 'skip_discovered_business'
export const DISCOVERY_CAPABILITY_TTL_MS = 10 * 60 * 1000

export function discoveryAuthorizationScope() {
  return {
    categories: CHICAGO_DISCOVERY_QUERIES.map(({ category, query }) => ({ category, query })),
    budget: {
      places_searches: MAX_PLACES_SEARCHES,
      place_detail_requests: MAX_PLACE_DETAIL_REQUESTS,
      website_inspections: MAX_WEBSITE_INSPECTIONS,
    },
  }
}

export function createDiscoveryCapability(context, { now = Date.now(), nonce = randomBytes(32).toString('base64url') } = {}) {
  const payload = {
    v: 1,
    action: DISCOVERY_ACTION,
    workspace_id: context.workspaceId,
    owner_id: context.user.id,
    scope: discoveryAuthorizationScope(),
    nonce,
    issued_at: now,
    expires_at: now + DISCOVERY_CAPABILITY_TTL_MS,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return {
    capability: `${encoded}.${signatureFor(encoded)}`,
    expiresAt: new Date(payload.expires_at).toISOString(),
    scope: payload.scope,
  }
}

export function validateDiscoveryCapability(capability, context, { now = Date.now() } = {}) {
  const [encoded, signature, extra] = String(capability || '').split('.')
  if (!encoded || !signature || extra || !safeSignatureMatches(encoded, signature)) return invalid('Discovery authorization is invalid.')
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    const expectedScope = JSON.stringify(discoveryAuthorizationScope())
    const suppliedScope = JSON.stringify(payload.scope)
    const valid = payload.v === 1
      && payload.action === DISCOVERY_ACTION
      && payload.workspace_id === context.workspaceId
      && payload.owner_id === context.user.id
      && suppliedScope === expectedScope
      && typeof payload.nonce === 'string'
      && /^[A-Za-z0-9_-]{32,200}$/.test(payload.nonce)
      && Number.isFinite(payload.issued_at)
      && Number.isFinite(payload.expires_at)
      && payload.issued_at <= now
      && payload.expires_at > now
      && payload.expires_at === payload.issued_at + DISCOVERY_CAPABILITY_TTL_MS
    if (!valid) return invalid('Discovery authorization is invalid or expired.')
    return {
      ok: true,
      nonceHash: hashNonce(payload.nonce),
      action: payload.action,
      scope: payload.scope,
      issuedAt: new Date(payload.issued_at).toISOString(),
      expiresAt: new Date(payload.expires_at).toISOString(),
    }
  } catch {
    return invalid('Discovery authorization is invalid.')
  }
}

// These capabilities are deliberately limited to transient Google Places
// results. They are not persisted: only the nonce hash and permitted Place ID
// are recorded when an owner actually investigates or skips a business.
export function createDiscoverySelectionCapability(context, {
  action,
  discoveryRunId,
  providerPlaceId,
  websiteUrl,
  category,
  now = Date.now(),
  nonce = randomBytes(32).toString('base64url'),
} = {}) {
  if (![INVESTIGATE_DISCOVERED_BUSINESS_ACTION, SKIP_DISCOVERED_BUSINESS_ACTION].includes(action)) throw new Error('Invalid discovery selection action.')
  const safeUrl = canonicalHttpUrl(websiteUrl)
  if (!safeUrl || !safeIdentifier(discoveryRunId, 100) || !safeIdentifier(providerPlaceId, 300) || !safeIdentifier(category, 100)) throw new Error('Invalid transient discovery business.')
  const payload = {
    v: 1,
    action,
    workspace_id: context.workspaceId,
    owner_id: context.user.id,
    discovery_run_id: discoveryRunId,
    provider: 'google_places',
    provider_place_id: providerPlaceId,
    website_url: safeUrl,
    category,
    nonce,
    issued_at: now,
    expires_at: now + DISCOVERY_CAPABILITY_TTL_MS,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${signatureFor(encoded)}`
}

export function validateDiscoverySelectionCapability(capability, context, expectedAction, { now = Date.now() } = {}) {
  const [encoded, signature, extra] = String(capability || '').split('.')
  if (!encoded || !signature || extra || !safeSignatureMatches(encoded, signature)) return invalid('Business selection authorization is invalid.')
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    const safeUrl = canonicalHttpUrl(payload.website_url)
    const valid = payload.v === 1
      && payload.action === expectedAction
      && [INVESTIGATE_DISCOVERED_BUSINESS_ACTION, SKIP_DISCOVERED_BUSINESS_ACTION].includes(payload.action)
      && payload.workspace_id === context.workspaceId
      && payload.owner_id === context.user.id
      && payload.provider === 'google_places'
      && safeIdentifier(payload.discovery_run_id, 100)
      && safeIdentifier(payload.provider_place_id, 300)
      && safeUrl === payload.website_url
      && safeIdentifier(payload.category, 100)
      && typeof payload.nonce === 'string'
      && /^[A-Za-z0-9_-]{32,200}$/.test(payload.nonce)
      && Number.isFinite(payload.issued_at)
      && Number.isFinite(payload.expires_at)
      && payload.issued_at <= now
      && payload.expires_at > now
      && payload.expires_at === payload.issued_at + DISCOVERY_CAPABILITY_TTL_MS
    if (!valid) return invalid('Business selection authorization is invalid or expired.')
    return {
      ok: true,
      nonceHash: hashNonce(payload.nonce),
      action: payload.action,
      discoveryRunId: payload.discovery_run_id,
      provider: payload.provider,
      providerPlaceId: payload.provider_place_id,
      websiteUrl: safeUrl,
      category: payload.category,
      issuedAt: new Date(payload.issued_at).toISOString(),
      expiresAt: new Date(payload.expires_at).toISOString(),
    }
  } catch {
    return invalid('Business selection authorization is invalid.')
  }
}

function signatureFor(encoded) {
  return createHmac('sha256', process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY).update(encoded).digest('base64url')
}

function safeSignatureMatches(encoded, signature) {
  const expected = Buffer.from(signatureFor(encoded))
  const received = Buffer.from(signature)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

function hashNonce(nonce) {
  return createHash('sha256').update(nonce).digest('hex')
}

function canonicalHttpUrl(value) {
  return parseHttpUrl(value)?.toString() || null
}

function safeIdentifier(value, maxLength) {
  const text = String(value || '').trim()
  return text.length > 0 && text.length <= maxLength && text === value
}

function invalid(error) {
  return { ok: false, error }
}
