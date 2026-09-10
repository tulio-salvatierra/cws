/* global process */

import { createHmac } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DISCOVERY_ACTION,
  DISCOVERY_CAPABILITY_TTL_MS,
  createDiscoveryCapability,
  createDiscoverySelectionCapability,
  discoveryAuthorizationScope,
  INVESTIGATE_DISCOVERED_BUSINESS_ACTION,
  SKIP_DISCOVERED_BUSINESS_ACTION,
  validateDiscoveryCapability,
  validateDiscoverySelectionCapability,
} from '../discovery-authorization.js'

const SECRET = 'sales-discovery-test-secret'
const NOW = Date.parse('2026-09-09T20:00:00.000Z')
const context = (ownerId = 'owner-a', workspaceId = 'workspace-a') => ({ user: { id: ownerId }, workspaceId })

function readPayload(capability) {
  return JSON.parse(Buffer.from(capability.split('.')[0], 'base64url').toString('utf8'))
}

function signPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', SECRET).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

describe('Sales discovery authorization', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = SECRET
  })

  it('prepares a fixed ten-minute owner/workspace/action/scope capability without provider work', () => {
    const prepared = createDiscoveryCapability(context(), { now: NOW, nonce: 'a'.repeat(43) })
    const payload = readPayload(prepared.capability)

    expect(payload).toMatchObject({
      action: DISCOVERY_ACTION,
      owner_id: 'owner-a',
      workspace_id: 'workspace-a',
      scope: discoveryAuthorizationScope(),
      issued_at: NOW,
      expires_at: NOW + DISCOVERY_CAPABILITY_TTL_MS,
    })
    expect(validateDiscoveryCapability(prepared.capability, context(), { now: NOW + 1 })).toMatchObject({ ok: true, action: DISCOVERY_ACTION, scope: discoveryAuthorizationScope() })
  })

  it('rejects a changed signature or expired authorization', () => {
    const prepared = createDiscoveryCapability(context(), { now: NOW, nonce: 'b'.repeat(43) })
    expect(validateDiscoveryCapability(`${prepared.capability}x`, context(), { now: NOW + 1 })).toMatchObject({ ok: false })
    expect(validateDiscoveryCapability(prepared.capability, context(), { now: NOW + DISCOVERY_CAPABILITY_TTL_MS })).toMatchObject({ ok: false })
  })

  it('rejects a capability for a different owner or workspace', () => {
    const prepared = createDiscoveryCapability(context(), { now: NOW, nonce: 'c'.repeat(43) })
    expect(validateDiscoveryCapability(prepared.capability, context('owner-b'), { now: NOW + 1 })).toMatchObject({ ok: false })
    expect(validateDiscoveryCapability(prepared.capability, context('owner-a', 'workspace-b'), { now: NOW + 1 })).toMatchObject({ ok: false })
  })

  it('rejects signed alterations to action, categories, or the provider request budget', () => {
    const prepared = createDiscoveryCapability(context(), { now: NOW, nonce: 'd'.repeat(43) })
    const payload = readPayload(prepared.capability)

    expect(validateDiscoveryCapability(signPayload({ ...payload, action: 'other_action' }), context(), { now: NOW + 1 })).toMatchObject({ ok: false })
    expect(validateDiscoveryCapability(signPayload({ ...payload, scope: { ...payload.scope, categories: [] } }), context(), { now: NOW + 1 })).toMatchObject({ ok: false })
    expect(validateDiscoveryCapability(signPayload({ ...payload, scope: { ...payload.scope, budget: { ...payload.scope.budget, places_searches: 5 } } }), context(), { now: NOW + 1 })).toMatchObject({ ok: false })
  })

  it('rejects a signed capability whose issuance or lifetime is outside the exact safety window', () => {
    const prepared = createDiscoveryCapability(context(), { now: NOW, nonce: 'e'.repeat(43) })
    const payload = readPayload(prepared.capability)
    expect(validateDiscoveryCapability(signPayload({ ...payload, issued_at: NOW + 1 }), context(), { now: NOW })).toMatchObject({ ok: false })
    expect(validateDiscoveryCapability(signPayload({ ...payload, expires_at: payload.expires_at + 1 }), context(), { now: NOW + 1 })).toMatchObject({ ok: false })
  })

  it('binds an investigation authorization to one owner, Place ID, exact official website, and action', () => {
    const capability = createDiscoverySelectionCapability(context(), {
      action: INVESTIGATE_DISCOVERED_BUSINESS_ACTION,
      discoveryRunId: 'run-a', providerPlaceId: 'place-a', websiteUrl: 'https://northside.example/', category: 'Auto repair', now: NOW, nonce: 'f'.repeat(43),
    })
    const payload = readPayload(capability)

    expect(payload).toMatchObject({ action: INVESTIGATE_DISCOVERED_BUSINESS_ACTION, workspace_id: 'workspace-a', owner_id: 'owner-a', provider_place_id: 'place-a', website_url: 'https://northside.example/', category: 'Auto repair' })
    expect(validateDiscoverySelectionCapability(capability, context(), INVESTIGATE_DISCOVERED_BUSINESS_ACTION, { now: NOW + 1 })).toMatchObject({ ok: true, providerPlaceId: 'place-a', websiteUrl: 'https://northside.example/' })
    expect(validateDiscoverySelectionCapability(capability, context(), SKIP_DISCOVERED_BUSINESS_ACTION, { now: NOW + 1 })).toMatchObject({ ok: false })
    expect(validateDiscoverySelectionCapability(capability, context('owner-b'), INVESTIGATE_DISCOVERED_BUSINESS_ACTION, { now: NOW + 1 })).toMatchObject({ ok: false })
  })

  it('rejects an altered selected Place ID or exact website when the original signature is retained', () => {
    const capability = createDiscoverySelectionCapability(context(), {
      action: INVESTIGATE_DISCOVERED_BUSINESS_ACTION,
      discoveryRunId: 'run-a', providerPlaceId: 'place-a', websiteUrl: 'https://northside.example/', category: 'Auto repair', now: NOW, nonce: 'g'.repeat(43),
    })
    const payload = readPayload(capability)

    const signature = capability.split('.')[1]
    const alteredPlace = `${Buffer.from(JSON.stringify({ ...payload, provider_place_id: 'place-b' })).toString('base64url')}.${signature}`
    const alteredWebsite = `${Buffer.from(JSON.stringify({ ...payload, website_url: 'https://other.example/' })).toString('base64url')}.${signature}`
    expect(validateDiscoverySelectionCapability(alteredPlace, context(), INVESTIGATE_DISCOVERED_BUSINESS_ACTION, { now: NOW + 1 })).toMatchObject({ ok: false })
    expect(validateDiscoverySelectionCapability(alteredWebsite, context(), INVESTIGATE_DISCOVERED_BUSINESS_ACTION, { now: NOW + 1 })).toMatchObject({ ok: false })
  })
})
