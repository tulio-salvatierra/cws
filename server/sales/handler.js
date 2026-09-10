/* global process */

import { authenticateOwner, authenticateWorkspace, cleanText, missingOutreachEnv, parseBody } from '../outreach/shared.js'
import { buildSalesCommandQueue } from './queue.js'
import {
  MAX_PLACE_DETAIL_REQUESTS,
  MAX_PLACES_SEARCHES,
  MAX_TRANSIENT_REVIEW_BUSINESSES,
  MAX_WEBSITE_INSPECTIONS,
  PLACES_DIAGNOSTIC_QUERY,
  diagnoseGooglePlaces,
  discoverGooglePlaces,
  inspectOfficialWebsite,
  normalizeSalesIdentity,
} from './discovery.js'
import {
  createDiscoveryCapability,
  createDiscoverySelectionCapability,
  INVESTIGATE_DISCOVERED_BUSINESS_ACTION,
  SKIP_DISCOVERED_BUSINESS_ACTION,
  validateDiscoveryCapability,
  validateDiscoverySelectionCapability,
} from './discovery-authorization.js'
import {
  collectProspectBriefEvidence,
  generateProspectBrief,
  prospectBriefFailureDetails,
  prospectBriefConfiguration,
  PROSPECT_BRIEF_AGENT_KEY,
} from './prospect-brief.js'

const CLASSIFICATIONS = new Set(['inbound', 'prospect'])
const RESPONSE_STATES = new Set(['no_response', 'warm', 'neutral'])
const LEAD_STATUSES = new Set(['new', 'contacted', 'responded', 'won', 'lost', 'unresponsive'])

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const missing = missingOutreachEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing Sales environment variables: ${missing.join(', ')}` })
  if (req.method === 'GET') return loadQueue(req, res)
  return runOwnerAction(req, res)
}

async function loadQueue(req, res) {
  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const [leads, promisedActions, outreachSends, prospects, verificationRequired] = await Promise.all([
    context.client.from('leads').select('id, name, email, company, status, sales_classification, response_state, phone, locality, last_contacted_at, created_at').eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('sales_promised_actions').select('id, lead_id, action_text, due_on, completed_at, created_at').eq('workspace_id', context.workspaceId).is('completed_at', null).order('due_on', { ascending: true }).order('created_at', { ascending: true }),
    context.client.from('outreach_sends').select('id, lead_id, send_type, status, sent_at, created_at').eq('workspace_id', context.workspaceId).not('lead_id', 'is', null).order('created_at', { ascending: true }),
    context.client.from('sales_discovery_candidates').select('id, business_name, category, locality, website_url, business_email, business_phone, observed_facts, opportunity, opportunities, review_basis, evidence_urls, inspected_at, possible_duplicate, possible_duplicate_reason, prospect_brief_run_id, created_at').eq('workspace_id', context.workspaceId).eq('review_state', 'ready').order('created_at', { ascending: true }),
    context.client.from('sales_discovery_candidates').select('id, business_name, category, locality, website_url, observed_facts, opportunity, evidence_urls, inspected_at, contact_path_state').eq('workspace_id', context.workspaceId).eq('review_state', 'verification_required').order('created_at', { ascending: true }),
  ])
  const failed = [leads, promisedActions, outreachSends, prospects, verificationRequired].find((result) => result.error)
  if (failed) return res.status(502).json({ ok: false, error: failed.error.message })
  const prospectRows = prospects.data || []
  const briefRunIds = [...new Set(prospectRows.map((candidate) => candidate.prospect_brief_run_id).filter(Boolean))]
  let prospectBriefs = new Map()
  if (briefRunIds.length) {
    const briefs = await context.client.from('agent_runs')
      .select('id, status, output, error_message, created_at, started_at, finished_at')
      .eq('workspace_id', context.workspaceId)
      .eq('agent_key', PROSPECT_BRIEF_AGENT_KEY)
      .in('id', briefRunIds)
    if (briefs.error) return res.status(502).json({ ok: false, error: briefs.error.message })
    prospectBriefs = new Map((briefs.data || []).map((run) => [run.id, prospectBriefSummary(run)]))
  }
  return res.status(200).json({
    ok: true,
    ...buildSalesCommandQueue({ leads: leads.data, promisedActions: promisedActions.data, outreachSends: outreachSends.data }),
    leads: leads.data,
    prospects: prospectRows.map((candidate) => ({
      ...candidate,
      prospect_brief: candidate.prospect_brief_run_id ? prospectBriefs.get(candidate.prospect_brief_run_id) || null : null,
    })),
    prospectVerificationRequired: verificationRequired.data || [],
    prospectDiscovery: {
      configured: Boolean(process.env.GOOGLE_PLACES_API_KEY),
      limits: { placesSearches: MAX_PLACES_SEARCHES, placeDetailRequests: MAX_PLACE_DETAIL_REQUESTS, websiteInspections: MAX_WEBSITE_INSPECTIONS },
    },
    prospectBrief: prospectBriefConfiguration(),
  })
}

async function runOwnerAction(req, res) {
  const context = await authenticateOwner(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const body = parseBody(req.body)
  if (body.action === 'create_promised_action') return createPromisedAction(context, body, res)
  if (body.action === 'complete_promised_action') return completePromisedAction(context, body, res)
  if (body.action === 'record_call') return recordCall(context, body, res)
  if (body.action === 'update_lead_sales_state') return updateLeadSalesState(context, body, res)
  if (body.action === 'prepare_discovery') return prepareDiscovery(context, res)
  if (body.action === 'discover_prospects') return discoverProspects(context, body, res)
  if (body.action === INVESTIGATE_DISCOVERED_BUSINESS_ACTION) return investigateDiscoveredBusiness(context, body, res)
  if (body.action === SKIP_DISCOVERED_BUSINESS_ACTION) return skipDiscoveredBusiness(context, body, res)
  if (body.action === 'diagnose_google_places') return diagnoseGooglePlacesProvider(context, res)
  if (body.action === 'verify_discovery_candidate_contact_path') return verifyDiscoveryCandidateContactPath(context, body, res)
  if (body.action === 'prepare_prospect_brief') return prepareProspectBrief(context, body, res)
  if (body.action === 'retry_prospect_brief') return retryProspectBrief(context, body, res)
  if (body.action === 'dismiss_discovery_candidate') return dismissDiscoveryCandidate(context, body, res)
  if (body.action === 'add_discovery_candidate_to_sales') return addDiscoveryCandidateToSales(context, body, res)
  return res.status(400).json({ ok: false, error: 'Unknown Sales action.' })
}

async function prepareDiscovery(context, res) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return res.status(503).json({ ok: false, error: 'Prospect discovery requires Google Places configuration.' })
  }
  const prepared = createDiscoveryCapability(context)
  return res.status(200).json({
    ok: true,
    discovery_authorization: {
      capability: prepared.capability,
      expires_at: prepared.expiresAt,
      categories: prepared.scope.categories.map(({ category }) => category),
      limits: prepared.scope.budget,
    },
  })
}

async function discoverProspects(context, body, res) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return res.status(503).json({ ok: false, error: 'Prospect discovery requires Google Places configuration.' })
  }

  const authorization = validateDiscoveryCapability(body.discovery_capability, context)
  if (!authorization.ok) return res.status(403).json({ ok: false, error: authorization.error })
  const started = await reserveAuthorizedDiscoveryRun(context, authorization)
  if (started.error) return res.status(started.status).json({ ok: false, error: started.error })
  if (started.replayed) {
    return res.status(200).json({ ok: true, replayed: true, discovery: discoveryRunSummary(started.data) })
  }

  let discovery = { records: [], warnings: ['Prospect discovery could not complete.'], placesSearches: 0, placeDetailRequests: 0 }
  try {
    const [candidateResult, leadResult, skippedResult] = await Promise.all([
      context.client.from('sales_discovery_candidates').select('provider_place_id, website_domain').eq('workspace_id', context.workspaceId),
      context.client.from('leads').select('source').eq('workspace_id', context.workspaceId),
      context.client.from('sales_discovery_owner_selections').select('provider_place_id').eq('workspace_id', context.workspaceId).eq('action', 'skip').eq('status', 'complete'),
    ])
    if (candidateResult.error || leadResult.error || skippedResult.error) throw new Error((candidateResult.error || leadResult.error || skippedResult.error).message)

    discovery = await discoverGooglePlaces({ apiKey: process.env.GOOGLE_PLACES_API_KEY })
    await persistProviderDiagnostics(context, started.data.id, discovery.diagnostics || [], 'discovery')
    const knownCandidates = candidateResult.data || []
    const knownLeads = leadResult.data || []
    const skippedPlaceIds = new Set((skippedResult.data || []).map((selection) => selection.provider_place_id))
    const knownPlaceIds = new Set(knownCandidates.map((candidate) => candidate.provider_place_id))
    const knownDomains = new Set(knownCandidates.map((candidate) => candidate.website_domain))
    const knownLeadSources = new Set(knownLeads.map((lead) => lead.source).filter(Boolean))
    const transientBusinesses = []
    const transientPlaceIds = new Set()

    for (const record of discovery.records) {
      if (transientBusinesses.length >= MAX_TRANSIENT_REVIEW_BUSINESSES) break
      if (knownPlaceIds.has(record.providerPlaceId) || skippedPlaceIds.has(record.providerPlaceId) || knownLeadSources.has(providerSourceFor(record.providerPlaceId))) continue
      const websiteDomain = safeWebsiteDomain(record.websiteUrl)
      if (!websiteDomain || knownDomains.has(websiteDomain) || transientPlaceIds.has(record.providerPlaceId)) continue
      transientPlaceIds.add(record.providerPlaceId)
      transientBusinesses.push(transientBusiness(context, started.data.id, record))
    }

    await finishDiscoveryRun(context, started.data.id, {
      status: 'complete',
      placesSearches: discovery.placesSearches,
      placeDetailRequests: discovery.placeDetailRequests,
      websiteInspections: 0,
      candidatesCreated: 0,
      warningCount: discovery.warnings.length,
      inspectionOutcomes: [],
    })
    logDiscovery(context.workspaceId, { placesSearches: discovery.placesSearches, placeDetailRequests: discovery.placeDetailRequests, websiteInspections: 0, candidatesCreated: 0, transientBusinesses: transientBusinesses.length, warningCount: discovery.warnings.length })
    return res.status(200).json({ ok: true, discovery: { ...discoveryRunSummary(started.data), candidatesCreated: 0, warnings: discovery.warnings, placesSearches: discovery.placesSearches, placeDetailRequests: discovery.placeDetailRequests, websiteInspections: 0, businesses: transientBusinesses } })
  } catch {
    await finishDiscoveryRun(context, started.data.id, {
      status: 'error', placesSearches: discovery.placesSearches, placeDetailRequests: discovery.placeDetailRequests,
      websiteInspections: 0, candidatesCreated: 0, warningCount: discovery.warnings.length, errorMessage: 'Prospect discovery could not complete.',
      inspectionOutcomes: [],
    })
    logDiscovery(context.workspaceId, { placesSearches: discovery.placesSearches, placeDetailRequests: discovery.placeDetailRequests, websiteInspections: 0, candidatesCreated: 0, warningCount: discovery.warnings.length, failed: true })
    return res.status(502).json({ ok: false, error: 'Prospect discovery could not complete.' })
  }
}

async function diagnoseGooglePlacesProvider(context, res) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return res.status(503).json({ ok: false, error: 'Prospect discovery requires Google Places configuration.' })
  }
  const prior = await context.client
    .from('sales_discovery_provider_diagnostics')
    .select('id')
    .eq('workspace_id', context.workspaceId)
    .eq('diagnostic_scope', 'contract_diagnostic')
    .limit(1)
  if (prior.error) return res.status(502).json({ ok: false, error: prior.error.message })
  if (prior.data?.length) return res.status(409).json({ ok: false, error: 'The one-time Google Places contract diagnostic has already run.' })

  const started = await startLegacyDiscoveryRun(context)
  if (started.error) return res.status(started.status).json({ ok: false, error: started.error })

  const reservation = await context.client.from('sales_discovery_provider_diagnostics').insert({
    discovery_run_id: started.data.id,
    workspace_id: context.workspaceId,
    diagnostic_scope: 'contract_diagnostic',
    category: PLACES_DIAGNOSTIC_QUERY.category,
    search_query: PLACES_DIAGNOSTIC_QUERY.query,
    outcome: 'pending',
  }).select('id').single()
  if (reservation.error) {
    await finishDiscoveryRun(context, started.data.id, { status: 'error', errorMessage: 'The Google Places contract diagnostic could not be reserved.' })
    return res.status(reservation.error.code === '23505' ? 409 : 502).json({ ok: false, error: reservation.error.code === '23505' ? 'The one-time Google Places contract diagnostic has already run.' : 'The Google Places contract diagnostic could not be reserved.' })
  }

  try {
    const result = await diagnoseGooglePlaces({ apiKey: process.env.GOOGLE_PLACES_API_KEY })
    const updated = await context.client.from('sales_discovery_provider_diagnostics').update(providerDiagnosticValues(result.diagnostic)).eq('id', reservation.data.id).eq('workspace_id', context.workspaceId).select('id').maybeSingle()
    if (updated.error || !updated.data) throw new Error('Could not persist Google Places diagnostic.')
    await finishDiscoveryRun(context, started.data.id, {
      status: 'complete', placesSearches: 1, placeDetailRequests: 0, websiteInspections: 0, candidatesCreated: 0,
      warningCount: result.warning ? 1 : 0,
    })
    logDiscovery(context.workspaceId, { diagnostic: 'contract_check', placesSearches: 1, placeDetailRequests: 0, websiteInspections: 0, candidatesCreated: 0, warningCount: result.warning ? 1 : 0 })
    return res.status(200).json({ ok: true, diagnostic: result })
  } catch {
    await finishDiscoveryRun(context, started.data.id, { status: 'error', placesSearches: 1, placeDetailRequests: 0, websiteInspections: 0, candidatesCreated: 0, warningCount: 1, errorMessage: 'The Google Places contract diagnostic could not complete.' })
    return res.status(502).json({ ok: false, error: 'The Google Places contract diagnostic could not complete.' })
  }
}

async function persistProviderDiagnostics(context, runId, diagnostics, scope) {
  if (!diagnostics.length) return
  const inserted = await context.client.from('sales_discovery_provider_diagnostics').insert(diagnostics.map((diagnostic) => ({
    discovery_run_id: runId,
    workspace_id: context.workspaceId,
    diagnostic_scope: scope,
    ...providerDiagnosticValues(diagnostic),
  })))
  if (inserted.error) throw new Error('Could not persist Google Places diagnostics.')
}

function providerDiagnosticValues(diagnostic) {
  return {
    category: diagnostic.category,
    search_query: diagnostic.searchQuery,
    outcome: diagnostic.outcome,
    http_status: diagnostic.httpStatus,
    provider_status: diagnostic.providerStatus,
    provider_code: diagnostic.providerCode,
    provider_message: diagnostic.providerMessage,
    result_count: diagnostic.resultCount,
    occurred_at: diagnostic.occurredAt,
  }
}

async function dismissDiscoveryCandidate(context, body, res) {
  if (!body.candidate_id) return res.status(400).json({ ok: false, error: 'candidate_id is required.' })
  const dismissed = await context.client.from('sales_discovery_candidates').update({ review_state: 'dismissed', dismissed_at: new Date().toISOString() }).eq('id', body.candidate_id).eq('workspace_id', context.workspaceId).eq('review_state', 'ready').select('id, review_state, dismissed_at').maybeSingle()
  if (dismissed.error) return res.status(502).json({ ok: false, error: dismissed.error.message })
  if (!dismissed.data) return res.status(404).json({ ok: false, error: 'Review-ready prospect not found.' })
  return res.status(200).json({ ok: true, candidate: dismissed.data })
}

async function prepareProspectBrief(context, body, res) {
  if (!body.candidate_id) return res.status(400).json({ ok: false, error: 'candidate_id is required.' })
  if (!prospectBriefConfiguration().configured) {
    return res.status(503).json({ ok: false, error: 'Prospect Brief requires server-side OpenAI configuration.' })
  }
  const candidateResult = await context.client.from('sales_discovery_candidates')
    .select('id, business_name, website_url, observed_facts, opportunities, evidence_urls, review_basis, review_state, prospect_brief_run_id')
    .eq('id', body.candidate_id).eq('workspace_id', context.workspaceId).maybeSingle()
  if (candidateResult.error) return res.status(502).json({ ok: false, error: candidateResult.error.message })
  const candidate = candidateResult.data
  if (!candidate) return res.status(404).json({ ok: false, error: 'Prospect candidate not found.' })
  if (candidate.review_basis !== 'owner_selected' || candidate.review_state !== 'ready' || !candidate.website_url) {
    return res.status(409).json({ ok: false, error: 'Only a ready owner-selected prospect with an official website can prepare a brief.' })
  }

  return executeProspectBrief(context, candidate, res)
}

async function retryProspectBrief(context, body, res) {
  if (!body.candidate_id || !body.retry_of_run_id) return res.status(400).json({ ok: false, error: 'candidate_id and retry_of_run_id are required.' })
  if (!prospectBriefConfiguration().configured) {
    return res.status(503).json({ ok: false, error: 'Prospect Brief requires server-side OpenAI configuration.' })
  }
  const candidateResult = await context.client.from('sales_discovery_candidates')
    .select('id, business_name, website_url, observed_facts, opportunities, evidence_urls, review_basis, review_state, prospect_brief_run_id')
    .eq('id', body.candidate_id).eq('workspace_id', context.workspaceId).maybeSingle()
  if (candidateResult.error) return res.status(502).json({ ok: false, error: candidateResult.error.message })
  const candidate = candidateResult.data
  if (!candidate || candidate.review_basis !== 'owner_selected' || candidate.review_state !== 'ready' || !candidate.website_url || !candidate.prospect_brief_run_id) {
    return res.status(409).json({ ok: false, error: 'Only a failed owner-selected Prospect Brief can be retried.' })
  }
  const current = await loadProspectBriefRun(context, candidate.prospect_brief_run_id)
  if (current.error) return res.status(current.status).json({ ok: false, error: current.error })
  if (!current.run) return res.status(409).json({ ok: false, error: 'Only a failed owner-selected Prospect Brief can be retried.' })
  if (candidate.prospect_brief_run_id !== body.retry_of_run_id) {
    if (current.run.input?.retry_of_run_id === body.retry_of_run_id) {
      return res.status(200).json({ ok: true, replayed: true, prospect_brief: prospectBriefSummary(current.run) })
    }
    return res.status(409).json({ ok: false, error: 'The failed Prospect Brief is no longer the current attempt.' })
  }
  if (current.run.status !== 'failed') {
    return res.status(409).json({ ok: false, error: 'Only a failed owner-selected Prospect Brief can be retried.' })
  }

  return executeProspectBrief(context, candidate, res, { retryOfRunId: current.run.id })
}

async function executeProspectBrief(context, candidate, res, { retryOfRunId = null } = {}) {
  const reserved = await reserveProspectBriefRun(context, candidate, { retryOfRunId })
  if (reserved.error) return res.status(reserved.status).json({ ok: false, error: reserved.error })
  if (reserved.replayed) return res.status(200).json({ ok: true, replayed: true, prospect_brief: prospectBriefSummary(reserved.run) })

  const running = await context.client.from('agent_runs').update({ status: 'running' })
    .eq('id', reserved.run.id).eq('workspace_id', context.workspaceId)
  if (running.error) return failProspectBriefRun(context, reserved.run.id, res, 'Prospect Brief preparation could not start.', 502)

  let evidencePacket = null
  try {
    evidencePacket = await collectProspectBriefEvidence(candidate)
    const generated = await generateProspectBrief({ candidate, evidencePacket, userId: context.user.id })
    const output = {
      candidate_id: candidate.id,
      canonical_website_url: evidencePacket.canonical_url,
      pages_inspected: evidencePacket.pages_inspected,
      rendered_review: evidencePacket.rendered_review,
      evidence: evidencePacket.items,
      brief: generated.brief,
      model: generated.model,
      response_id: generated.responseId,
      prepared_at: new Date().toISOString(),
    }
    const completed = await context.client.from('agent_runs').update({ status: 'completed', output, error_message: null })
      .eq('id', reserved.run.id).eq('workspace_id', context.workspaceId)
    if (completed.error) return failProspectBriefRun(context, reserved.run.id, res, 'Prospect Brief outcome could not be stored.', 502, {
      failureStage: 'persistence', model: generated.model, providerRequestId: generated.responseId,
      evidenceItemCount: evidencePacket.items.length, retryOfRunId,
    })
    return res.status(201).json({ ok: true, prospect_brief: { ...prospectBriefSummary({ ...reserved.run, status: 'completed', output }), output } })
  } catch (error) {
    const diagnostics = prospectBriefFailureDetails(error)
    return failProspectBriefRun(context, reserved.run.id, res, safeProspectBriefError(error), 502, {
      failureStage: diagnostics.failureStage || 'website_evidence_collection',
      model: diagnostics.model || null,
      providerRequestId: diagnostics.providerRequestId || null,
      providerStatus: diagnostics.providerStatus || null,
      evidenceItemCount: evidencePacket?.items?.length || 0,
      retryOfRunId,
    })
  }
}

async function reserveProspectBriefRun(context, candidate, { retryOfRunId = null } = {}) {
  if (candidate.prospect_brief_run_id && !retryOfRunId) {
    const existing = await loadProspectBriefRun(context, candidate.prospect_brief_run_id)
    if (existing.error) return existing
    if (existing.run) return { run: existing.run, replayed: true }
    return { error: 'The existing Prospect Brief could not be reconciled.', status: 502 }
  }
  if (retryOfRunId && candidate.prospect_brief_run_id !== retryOfRunId) {
    return { error: 'The failed Prospect Brief is no longer the current attempt.', status: 409 }
  }
  const queued = await context.client.from('agent_runs').insert({
    workspace_id: context.workspaceId,
    command_level: 'propose',
    agent_key: PROSPECT_BRIEF_AGENT_KEY,
    status: 'queued',
    input: {
      candidate_id: candidate.id,
      website_url: candidate.website_url,
      review_basis: candidate.review_basis,
      ...(retryOfRunId ? { retry_of_run_id: retryOfRunId } : {}),
    },
    created_by: context.user.id,
  }).select('id, status, output, error_message, created_at, started_at, finished_at').single()
  if (queued.error) return { error: queued.error.message, status: 502 }

  let claim = context.client.from('sales_discovery_candidates').update({ prospect_brief_run_id: queued.data.id })
    .eq('id', candidate.id).eq('workspace_id', context.workspaceId)
  claim = retryOfRunId ? claim.eq('prospect_brief_run_id', retryOfRunId) : claim.is('prospect_brief_run_id', null)
  const claimed = await claim
    .select('prospect_brief_run_id').maybeSingle()
  if (!claimed.error && claimed.data?.prospect_brief_run_id === queued.data.id) return { run: queued.data, replayed: false }

  // No website or AI work has occurred. Superseding this unused queued run
  // preserves an audit trail while a competing request reconciles to the one
  // durable candidate pointer.
  await context.client.from('agent_runs').update({ status: 'superseded' }).eq('id', queued.data.id).eq('workspace_id', context.workspaceId).eq('status', 'queued')
  const current = await context.client.from('sales_discovery_candidates').select('prospect_brief_run_id')
    .eq('id', candidate.id).eq('workspace_id', context.workspaceId).maybeSingle()
  if (current.error) return { error: current.error.message, status: 502 }
  if (current.data?.prospect_brief_run_id) {
    const existing = await loadProspectBriefRun(context, current.data.prospect_brief_run_id)
    if (existing.error) return existing
    if (existing.run) return { run: existing.run, replayed: true }
  }
  return { error: claimed.error?.message || 'Prospect Brief preparation could not be reserved.', status: 502 }
}

async function loadProspectBriefRun(context, runId) {
  const result = await context.client.from('agent_runs').select('id, status, input, output, error_message, created_at, started_at, finished_at')
    .eq('id', runId).eq('workspace_id', context.workspaceId).eq('agent_key', PROSPECT_BRIEF_AGENT_KEY).maybeSingle()
  return result.error ? { error: result.error.message, status: 502 } : { run: result.data || null }
}

async function failProspectBriefRun(context, runId, res, message, status, failure = null) {
  const sanitizedError = cleanText(message, 500)
  const failed = await context.client.from('agent_runs').update({
    status: 'failed',
    output: failure ? {
      failure: {
        failure_stage: failure.failureStage,
        sanitized_error: sanitizedError,
        model: failure.model || null,
        provider_request_id: failure.providerRequestId || null,
        provider_status: failure.providerStatus || null,
        evidence_item_count: failure.evidenceItemCount || 0,
        retry_of_run_id: failure.retryOfRunId || null,
        failed_at: new Date().toISOString(),
      },
    } : null,
    error_message: sanitizedError,
  })
    .eq('id', runId).eq('workspace_id', context.workspaceId).eq('status', 'running')
  if (failed.error) return res.status(502).json({ ok: false, error: 'Prospect Brief requires reconciliation before another attempt.' })
  return res.status(status).json({ ok: false, error: message, run_id: runId })
}

function prospectBriefSummary(run) {
  const failure = run.output?.failure || null
  return {
    run_id: run.id,
    status: run.status,
    output: run.output || null,
    error: ownerFacingProspectBriefError(run.error_message, failure?.failure_stage),
    failure_stage: failure?.failure_stage || null,
    created_at: run.created_at || null,
    started_at: run.started_at || null,
    finished_at: run.finished_at || null,
  }
}

function ownerFacingProspectBriefError(error, failureStage) {
  if (failureStage === 'evidence_reference_validation' || error === 'Why includes unsupported evidence.') {
    return "Brief verification failed because the AI referenced website evidence that wasn't in the inspected evidence set. Nothing was sent or added to Sales."
  }
  return error || null
}

function safeProspectBriefError(error) {
  const message = error instanceof Error ? error.message : ''
  return message && message.length <= 500 ? message : 'Prospect Brief preparation failed.'
}

async function addDiscoveryCandidateToSales(context, body, res) {
  if (!body.candidate_id) return res.status(400).json({ ok: false, error: 'candidate_id is required.' })
  const candidateResult = await context.client.from('sales_discovery_candidates').select('id, provider_place_id, business_name, business_email, business_phone, locality, review_state, possible_duplicate').eq('id', body.candidate_id).eq('workspace_id', context.workspaceId).maybeSingle()
  if (candidateResult.error) return res.status(502).json({ ok: false, error: candidateResult.error.message })
  const candidate = candidateResult.data
  if (!candidate) return res.status(404).json({ ok: false, error: 'Prospect candidate not found.' })
  if (candidate.review_state !== 'ready') return res.status(409).json({ ok: false, error: 'This prospect has already been resolved or is being converted.' })
  if (candidate.possible_duplicate) return res.status(409).json({ ok: false, error: 'Review the possible duplicate before adding this prospect to Sales.' })
  if (!candidate.business_email && !candidate.business_phone) return res.status(409).json({ ok: false, error: 'Contact information needed: no verified public business email or phone is available.' })

  const providerSource = providerSourceFor(candidate.provider_place_id)
  const [suppression, existingLead] = await Promise.all([
    candidate.business_email
      ? context.client.from('outreach_sends').select('id').eq('workspace_id', context.workspaceId).eq('to_email', candidate.business_email).in('status', ['bounced', 'complained']).limit(1)
      : Promise.resolve({ data: [], error: null }),
    candidate.business_email
      ? context.client.from('leads').select('id').eq('workspace_id', context.workspaceId).eq('email', candidate.business_email).limit(1)
      : context.client.from('leads').select('id').eq('workspace_id', context.workspaceId).eq('source', providerSource).limit(1),
  ])
  if (suppression.error || existingLead.error) return res.status(502).json({ ok: false, error: (suppression.error || existingLead.error).message })
  if (suppression.data?.length) return res.status(409).json({ ok: false, error: 'This public business email is suppressed after a bounce or complaint.' })
  if (existingLead.data?.length) return res.status(409).json({ ok: false, error: 'This business already has a Sales lead.' })

  const claimed = await context.client.from('sales_discovery_candidates').update({ review_state: 'converting' }).eq('id', candidate.id).eq('workspace_id', context.workspaceId).eq('review_state', 'ready').select('id').maybeSingle()
  if (claimed.error) return res.status(502).json({ ok: false, error: claimed.error.message })
  if (!claimed.data) return res.status(409).json({ ok: false, error: 'This prospect is already being converted.' })

  const lead = await context.client.from('leads').insert({
    workspace_id: context.workspaceId,
    name: candidate.business_name,
    email: candidate.business_email,
    company: candidate.business_name,
    status: 'new',
    source: providerSource,
    sales_classification: 'prospect',
    response_state: 'no_response',
    phone: candidate.business_phone,
    locality: candidate.locality,
    created_by: context.user.id,
  }).select('id, name, email, company, sales_classification').single()
  if (lead.error) {
    await context.client.from('sales_discovery_candidates').update({ review_state: 'ready' }).eq('id', candidate.id).eq('workspace_id', context.workspaceId).eq('review_state', 'converting')
    return res.status(502).json({ ok: false, error: lead.error.message })
  }

  const converted = await context.client.from('sales_discovery_candidates').update({ review_state: 'converted', converted_lead_id: lead.data.id, converted_at: new Date().toISOString() }).eq('id', candidate.id).eq('workspace_id', context.workspaceId).eq('review_state', 'converting').select('id, review_state, converted_lead_id').maybeSingle()
  if (converted.error || !converted.data) return res.status(502).json({ ok: false, error: 'Lead created; candidate conversion needs reconciliation.', lead: lead.data })
  return res.status(201).json({ ok: true, lead: lead.data, candidate: converted.data })
}

export async function reserveAuthorizedDiscoveryRun(context, authorization) {
  const existing = await context.client
    .from('sales_discovery_runs')
    .select('id, status, places_searches, place_detail_requests, website_inspections, candidates_created, warning_count, error_message, started_at, finished_at')
    .eq('workspace_id', context.workspaceId)
    .eq('authorization_nonce_hash', authorization.nonceHash)
    .maybeSingle()
  if (existing.error) return { error: existing.error.message, status: 502 }
  if (existing.data) return { data: existing.data, replayed: true }

  const active = await context.client.from('sales_discovery_runs').select('id').eq('workspace_id', context.workspaceId).eq('status', 'running').maybeSingle()
  if (active.error) return { error: active.error.message, status: 502 }
  if (active.data) return { error: 'A prospect discovery run is already in progress.', status: 409 }

  const inserted = await context.client.from('sales_discovery_runs').insert({
    workspace_id: context.workspaceId,
    provider: 'google_places',
    status: 'running',
    started_by: context.user.id,
    authorization_nonce_hash: authorization.nonceHash,
    authorization_action: authorization.action,
    authorization_owner_id: context.user.id,
    authorization_scope: authorization.scope,
    authorization_issued_at: authorization.issuedAt,
    authorization_expires_at: authorization.expiresAt,
    authorization_consumed_at: new Date().toISOString(),
  }).select('id, status, places_searches, place_detail_requests, website_inspections, candidates_created, warning_count, error_message, started_at, finished_at').single()
  if (!inserted.error) return { data: inserted.data }

  // A same-capability race is reconciled to its durable run. A distinct active
  // capability remains rejected by the existing one-running-run boundary.
  if (inserted.error.code === '23505') {
    const replay = await context.client
      .from('sales_discovery_runs')
      .select('id, status, places_searches, place_detail_requests, website_inspections, candidates_created, warning_count, error_message, started_at, finished_at')
      .eq('workspace_id', context.workspaceId)
      .eq('authorization_nonce_hash', authorization.nonceHash)
      .maybeSingle()
    if (replay.error) return { error: replay.error.message, status: 502 }
    if (replay.data) return { data: replay.data, replayed: true }
    return { error: 'A prospect discovery run is already in progress.', status: 409 }
  }
  return { error: inserted.error.message, status: 502 }
}

async function startLegacyDiscoveryRun(context) {
  const active = await context.client.from('sales_discovery_runs').select('id').eq('workspace_id', context.workspaceId).eq('status', 'running').maybeSingle()
  if (active.error) return { error: active.error.message, status: 502 }
  if (active.data) return { error: 'A prospect discovery run is already in progress.', status: 409 }
  const inserted = await context.client.from('sales_discovery_runs').insert({ workspace_id: context.workspaceId, provider: 'google_places', status: 'running', started_by: context.user.id }).select('id').single()
  if (inserted.error?.code === '23505') return { error: 'A prospect discovery run is already in progress.', status: 409 }
  return inserted.error ? { error: inserted.error.message, status: 502 } : { data: inserted.data }
}

function discoveryRunSummary(run) {
  return {
    runId: run.id,
    status: run.status,
    placesSearches: run.places_searches,
    placeDetailRequests: run.place_detail_requests,
    websiteInspections: run.website_inspections,
    candidatesCreated: run.candidates_created,
    warningCount: run.warning_count,
    error: run.error_message || null,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
  }
}

async function finishDiscoveryRun(context, runId, values) {
  const update = {
    status: values.status,
    places_searches: Math.min(MAX_PLACES_SEARCHES, values.placesSearches || 0),
    place_detail_requests: Math.min(MAX_PLACE_DETAIL_REQUESTS, values.placeDetailRequests || 0),
    website_inspections: Math.min(MAX_WEBSITE_INSPECTIONS, values.websiteInspections || 0),
    candidates_created: values.candidatesCreated || 0,
    warning_count: values.warningCount || 0,
    error_message: values.errorMessage || null,
    inspection_outcomes: Array.isArray(values.inspectionOutcomes) ? values.inspectionOutcomes.slice(0, MAX_PLACES_SEARCHES * 3) : [],
    finished_at: new Date().toISOString(),
  }
  await context.client.from('sales_discovery_runs').update(update).eq('id', runId).eq('workspace_id', context.workspaceId)
}

async function investigateDiscoveredBusiness(context, body, res) {
  const authorization = validateDiscoverySelectionCapability(body.selection_capability, context, INVESTIGATE_DISCOVERED_BUSINESS_ACTION)
  if (!authorization.ok) return res.status(403).json({ ok: false, error: authorization.error })

  const reserved = await reserveDiscoveryOwnerSelection(context, authorization)
  if (reserved.error) return res.status(reserved.status).json({ ok: false, error: reserved.error })
  if (reserved.replayed) return res.status(200).json({ ok: true, replayed: true, investigation: discoverySelectionSummary(reserved.data) })

  const existing = await findDiscoveryCandidateByPlace(context, authorization.providerPlaceId)
  if (existing.error) return failDiscoveryOwnerSelection(context, reserved.data.id, res, existing.error, 502)
  if (existing.data) {
    const completed = await completeDiscoveryOwnerSelection(context, reserved.data.id, existing.data.id)
    return completed.error
      ? res.status(502).json({ ok: false, error: completed.error })
      : res.status(200).json({ ok: true, replayed: true, investigation: discoverySelectionSummary(completed.data) })
  }

  const inspection = await inspectOfficialWebsite(authorization.websiteUrl, { ownerSelected: true })
  if (!inspection.ok) return failDiscoveryOwnerSelection(context, reserved.data.id, res, 'The official website could not establish a safe durable business identity.', 422)

  const [candidates, leads] = await Promise.all([
    context.client.from('sales_discovery_candidates').select('id, provider_place_id, website_domain').eq('workspace_id', context.workspaceId),
    context.client.from('leads').select('id, email, company, name, source, locality').eq('workspace_id', context.workspaceId),
  ])
  if (candidates.error || leads.error) return failDiscoveryOwnerSelection(context, reserved.data.id, res, 'The owner-selected business could not be checked against Sales records.', 502)

  const existingCandidate = (candidates.data || []).find((candidate) => (
    candidate.provider_place_id === authorization.providerPlaceId || candidate.website_domain === inspection.websiteDomain
  ))
  if (existingCandidate) {
    const completed = await completeDiscoveryOwnerSelection(context, reserved.data.id, existingCandidate.id)
    return completed.error
      ? res.status(502).json({ ok: false, error: completed.error })
      : res.status(200).json({ ok: true, replayed: true, investigation: discoverySelectionSummary(completed.data) })
  }

  const knownLeads = leads.data || []
  const exactExistingLead = knownLeads.some((lead) => (
    lead.source === providerSourceFor(authorization.providerPlaceId)
    || (inspection.businessEmail && String(lead.email || '').toLowerCase() === inspection.businessEmail)
  ))
  if (exactExistingLead) return failDiscoveryOwnerSelection(context, reserved.data.id, res, 'This business is already represented in Sales.', 409)

  const nameKey = normalizeSalesIdentity(inspection.businessName)
  const localityKey = normalizeSalesIdentity('Chicago, IL')
  const possibleDuplicate = knownLeads.some((lead) => (
    normalizeSalesIdentity(lead.company || lead.name) === nameKey
    && lead.locality && normalizeSalesIdentity(lead.locality) === localityKey
  ))
  const created = await context.client.from('sales_discovery_candidates').insert({
    workspace_id: context.workspaceId,
    provider: authorization.provider,
    provider_place_id: authorization.providerPlaceId,
    business_name: inspection.businessName,
    category: authorization.category,
    locality: 'Chicago, IL',
    website_url: inspection.websiteUrl,
    website_domain: inspection.websiteDomain,
    business_email: inspection.businessEmail,
    business_phone: inspection.businessPhone,
    observed_facts: inspection.facts,
    opportunity: inspection.opportunity || null,
    opportunities: inspection.opportunities || [],
    review_basis: 'owner_selected',
    evidence_urls: inspection.evidenceUrls,
    inspected_at: inspection.inspectedAt,
    contact_path_state: inspection.contactPathState,
    contact_path_verification: inspection.verification,
    possible_duplicate: possibleDuplicate,
    possible_duplicate_reason: possibleDuplicate ? 'A similarly named Chicago Sales record exists.' : null,
    normalized_name: nameKey,
    normalized_locality: localityKey,
    discovered_by: context.user.id,
  }).select('id, review_state').single()
  if (created.error) {
    if (created.error.code === '23505') {
      const duplicate = await findDiscoveryCandidateByPlace(context, authorization.providerPlaceId)
      if (!duplicate.error && duplicate.data) {
        const completed = await completeDiscoveryOwnerSelection(context, reserved.data.id, duplicate.data.id)
        if (!completed.error) return res.status(200).json({ ok: true, replayed: true, investigation: discoverySelectionSummary(completed.data) })
      }
    }
    return failDiscoveryOwnerSelection(context, reserved.data.id, res, 'The owner-selected business could not be saved.', 502)
  }

  const completed = await completeDiscoveryOwnerSelection(context, reserved.data.id, created.data.id)
  if (completed.error) return res.status(502).json({ ok: false, error: completed.error })
  return res.status(201).json({ ok: true, candidate: created.data, investigation: discoverySelectionSummary(completed.data) })
}

async function skipDiscoveredBusiness(context, body, res) {
  const authorization = validateDiscoverySelectionCapability(body.selection_capability, context, SKIP_DISCOVERED_BUSINESS_ACTION)
  if (!authorization.ok) return res.status(403).json({ ok: false, error: authorization.error })
  const reserved = await reserveDiscoveryOwnerSelection(context, authorization)
  if (reserved.error) return res.status(reserved.status).json({ ok: false, error: reserved.error })
  return res.status(reserved.replayed ? 200 : 201).json({ ok: true, replayed: Boolean(reserved.replayed), selection: discoverySelectionSummary(reserved.data) })
}

async function reserveDiscoveryOwnerSelection(context, authorization) {
  const existing = await context.client.from('sales_discovery_owner_selections')
    .select('id, action, status, candidate_id, error_message, created_at, completed_at')
    .eq('workspace_id', context.workspaceId)
    .eq('authorization_nonce_hash', authorization.nonceHash)
    .maybeSingle()
  if (existing.error) return { error: existing.error.message, status: 502 }
  if (existing.data) return { data: existing.data, replayed: true }

  const now = new Date().toISOString()
  const isSkip = authorization.action === SKIP_DISCOVERED_BUSINESS_ACTION
  const inserted = await context.client.from('sales_discovery_owner_selections').insert({
    workspace_id: context.workspaceId,
    discovery_run_id: authorization.discoveryRunId,
    provider: authorization.provider,
    provider_place_id: authorization.providerPlaceId,
    action: isSkip ? 'skip' : 'investigate',
    status: isSkip ? 'complete' : 'running',
    authorization_nonce_hash: authorization.nonceHash,
    authorization_owner_id: context.user.id,
    authorization_issued_at: authorization.issuedAt,
    authorization_expires_at: authorization.expiresAt,
    authorization_consumed_at: now,
    completed_at: isSkip ? now : null,
  }).select('id, action, status, candidate_id, error_message, created_at, completed_at').single()
  if (!inserted.error) return { data: inserted.data }
  if (inserted.error.code === '23505') {
    const replay = await context.client.from('sales_discovery_owner_selections')
      .select('id, action, status, candidate_id, error_message, created_at, completed_at')
      .eq('workspace_id', context.workspaceId)
      .eq('authorization_nonce_hash', authorization.nonceHash)
      .maybeSingle()
    if (replay.error) return { error: replay.error.message, status: 502 }
    if (replay.data) return { data: replay.data, replayed: true }
    return { error: 'This business has already been selected for review.', status: 409 }
  }
  return { error: inserted.error.message, status: 502 }
}

async function completeDiscoveryOwnerSelection(context, selectionId, candidateId) {
  const completed = await context.client.from('sales_discovery_owner_selections').update({
    status: 'complete', candidate_id: candidateId, error_message: null, completed_at: new Date().toISOString(),
  }).eq('id', selectionId).eq('workspace_id', context.workspaceId).eq('status', 'running').select('id, action, status, candidate_id, error_message, created_at, completed_at').maybeSingle()
  return completed.error
    ? { error: completed.error.message }
    : completed.data
      ? { data: completed.data }
      : { error: 'The owner-selected investigation could not be reconciled.' }
}

async function failDiscoveryOwnerSelection(context, selectionId, res, error, status) {
  const failed = await context.client.from('sales_discovery_owner_selections').update({
    status: 'error', error_message: cleanText(error, 500), completed_at: new Date().toISOString(),
  }).eq('id', selectionId).eq('workspace_id', context.workspaceId).eq('status', 'running')
  if (failed.error) return res.status(502).json({ ok: false, error: 'The owner-selected investigation could not be reconciled.' })
  return res.status(status).json({ ok: false, error })
}

async function findDiscoveryCandidateByPlace(context, providerPlaceId) {
  const result = await context.client.from('sales_discovery_candidates').select('id, review_state').eq('workspace_id', context.workspaceId).eq('provider_place_id', providerPlaceId).maybeSingle()
  return result.error ? { error: result.error.message } : { data: result.data }
}

function discoverySelectionSummary(selection) {
  return {
    selectionId: selection.id,
    action: selection.action,
    status: selection.status,
    candidateId: selection.candidate_id || null,
    error: selection.error_message || null,
    completedAt: selection.completed_at || null,
  }
}

async function verifyDiscoveryCandidateContactPath(context, body, res) {
  if (!body.candidate_id) return res.status(400).json({ ok: false, error: 'candidate_id is required.' })
  const candidateResult = await context.client
    .from('sales_discovery_candidates')
    .select('id, website_url, review_state')
    .eq('id', body.candidate_id)
    .eq('workspace_id', context.workspaceId)
    .eq('review_state', 'verification_required')
    .maybeSingle()
  if (candidateResult.error) return res.status(502).json({ ok: false, error: candidateResult.error.message })
  if (!candidateResult.data) return res.status(404).json({ ok: false, error: 'A contact-path verification is not required for this candidate.' })

  const inspection = await inspectOfficialWebsite(candidateResult.data.website_url)
  const now = new Date().toISOString()
  if (inspection.ok) {
    const verified = await context.client.from('sales_discovery_candidates').update({
      review_state: 'ready', contact_path_state: 'verified_gap', contact_path_verification: inspection.verification,
      business_email: inspection.businessEmail, business_phone: inspection.businessPhone, inspected_at: inspection.inspectedAt,
    }).eq('id', candidateResult.data.id).eq('workspace_id', context.workspaceId).eq('review_state', 'verification_required').select('id, review_state, contact_path_state').maybeSingle()
    if (verified.error || !verified.data) return res.status(502).json({ ok: false, error: 'Could not preserve the verified contact-path result.' })
    return res.status(200).json({ ok: true, candidate: verified.data })
  }

  const updates = inspection.contactPathState === 'contact_path_exists'
    ? {
        review_state: 'invalidated', contact_path_state: 'contact_path_exists', contact_path_verification: inspection.verification,
        qualification_invalidated_at: now, qualification_invalidation_reason: inspection.reason,
        business_email: inspection.businessEmail, business_phone: inspection.businessPhone,
      }
    : { contact_path_state: 'insufficient_evidence', contact_path_verification: inspection.verification }
  const result = await context.client.from('sales_discovery_candidates').update(updates).eq('id', candidateResult.data.id).eq('workspace_id', context.workspaceId).eq('review_state', 'verification_required').select('id, review_state, contact_path_state').maybeSingle()
  if (result.error || !result.data) return res.status(502).json({ ok: false, error: 'Could not preserve the contact-path verification result.' })
  return res.status(200).json({ ok: true, candidate: result.data, insufficientEvidence: inspection.contactPathState !== 'contact_path_exists' })
}

function providerSourceFor(placeId) {
  return `google_places:${cleanText(placeId, 150)}`
}

function transientBusiness(context, discoveryRunId, record) {
  return {
    businessName: record.businessName,
    category: record.category,
    locality: record.locality,
    websiteUrl: record.websiteUrl,
    investigateCapability: createDiscoverySelectionCapability(context, {
      action: INVESTIGATE_DISCOVERED_BUSINESS_ACTION,
      discoveryRunId,
      providerPlaceId: record.providerPlaceId,
      websiteUrl: record.websiteUrl,
      category: record.category,
    }),
    skipCapability: createDiscoverySelectionCapability(context, {
      action: SKIP_DISCOVERED_BUSINESS_ACTION,
      discoveryRunId,
      providerPlaceId: record.providerPlaceId,
      websiteUrl: record.websiteUrl,
      category: record.category,
    }),
  }
}

function safeWebsiteDomain(value) {
  try {
    const url = new URL(value)
    return /^https?:$/.test(url.protocol) ? url.hostname.toLowerCase() : null
  } catch {
    return null
  }
}

function logDiscovery(workspaceId, details) {
  console.info('sales_prospect_discovery', JSON.stringify({ workspaceId, ...details }))
}

async function createPromisedAction(context, body, res) {
  const actionText = cleanText(body.action_text, 500)
  if (!body.lead_id || !actionText || !validDate(body.due_on)) return res.status(400).json({ ok: false, error: 'lead_id, action_text, and a due date are required.' })
  const lead = await findLead(context, body.lead_id)
  if (lead.error) return res.status(lead.status).json({ ok: false, error: lead.error })
  const created = await context.client.from('sales_promised_actions').insert({
    workspace_id: context.workspaceId, lead_id: lead.data.id, action_text: actionText, due_on: body.due_on, created_by: context.user.id,
  }).select('id, lead_id, action_text, due_on, completed_at, created_at').single()
  return created.error
    ? res.status(502).json({ ok: false, error: created.error.message })
    : res.status(201).json({ ok: true, promised_action: created.data })
}

async function completePromisedAction(context, body, res) {
  if (!body.promised_action_id) return res.status(400).json({ ok: false, error: 'promised_action_id is required.' })
  const completed = await context.client.from('sales_promised_actions').update({ completed_at: new Date().toISOString() }).eq('id', body.promised_action_id).eq('workspace_id', context.workspaceId).is('completed_at', null).select('id, completed_at').maybeSingle()
  if (completed.error) return res.status(502).json({ ok: false, error: completed.error.message })
  if (!completed.data) return res.status(404).json({ ok: false, error: 'Open promised action not found.' })
  return res.status(200).json({ ok: true, promised_action: completed.data })
}

async function recordCall(context, body, res) {
  const lead = await findLead(context, body.lead_id)
  if (lead.error) return res.status(lead.status).json({ ok: false, error: lead.error })
  const contactedAt = new Date().toISOString()
  const updates = { last_contacted_at: contactedAt }
  if (lead.data.status === 'new') updates.status = 'contacted'
  const updated = await context.client.from('leads').update(updates).eq('id', lead.data.id).eq('workspace_id', context.workspaceId).select('id, status, last_contacted_at').single()
  return updated.error
    ? res.status(502).json({ ok: false, error: updated.error.message })
    : res.status(200).json({ ok: true, lead: updated.data })
}

async function updateLeadSalesState(context, body, res) {
  const lead = await findLead(context, body.lead_id)
  if (lead.error) return res.status(lead.status).json({ ok: false, error: lead.error })
  const salesClassification = nullableValue(body.sales_classification, 32)
  const responseState = nullableValue(body.response_state, 32)
  const leadStatus = nullableValue(body.status, 32)
  if (salesClassification && !CLASSIFICATIONS.has(salesClassification)) return res.status(400).json({ ok: false, error: 'Invalid Sales classification.' })
  if (responseState && !RESPONSE_STATES.has(responseState)) return res.status(400).json({ ok: false, error: 'Invalid response state.' })
  if (leadStatus && !LEAD_STATUSES.has(leadStatus)) return res.status(400).json({ ok: false, error: 'Invalid lead status.' })
  const updated = await context.client.from('leads').update({
    sales_classification: salesClassification,
    response_state: responseState,
    phone: nullableValue(body.phone, 50),
    locality: nullableValue(body.locality, 200),
    status: leadStatus || lead.data.status,
  }).eq('id', lead.data.id).eq('workspace_id', context.workspaceId).select('id, name, email, company, status, sales_classification, response_state, phone, locality').single()
  return updated.error
    ? res.status(502).json({ ok: false, error: updated.error.message })
    : res.status(200).json({ ok: true, lead: updated.data })
}

async function findLead(context, leadId) {
  if (!leadId) return { error: 'lead_id is required.', status: 400 }
  const result = await context.client.from('leads').select('id, status').eq('id', leadId).eq('workspace_id', context.workspaceId).maybeSingle()
  if (result.error) return { error: result.error.message, status: 502 }
  return result.data ? { data: result.data } : { error: 'Lead not found.', status: 404 }
}

function nullableValue(value, maxLength) {
  const cleaned = cleanText(value, maxLength)
  return cleaned || null
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}
