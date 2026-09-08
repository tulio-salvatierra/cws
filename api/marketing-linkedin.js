/* global process */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

export const MARKETING_ENDPOINT_TIMEOUT_MS = 10_000
export const MARKETING_POLL_INTERVAL_MS = 30_000

const PROVIDER_BASE_URL = 'https://api.bundle.social/api/v1'
const ASSET_PATH = '/images/logo.png'
const ASSET_FILE_PATH = join(process.cwd(), 'public', 'images', 'logo.png')
const M4_DESTINATION = 'multi:cicero-web-studio'
const REFERENCE_KEY_PATTERN = /^cws-marketing(?:-(?:linkedin|m4))?:[0-9a-f-]{36}$/i
const PROVIDER_STATUS = new Set(['preparing', 'scheduled', 'processing', 'posted', 'retrying', 'error'])
const TERMINAL_STATUS = new Set(['posted', 'error'])
const DESTINATION_DEFINITIONS = [
  { platform: 'LINKEDIN', name: 'LinkedIn — Cicero Web Studio Company Page', matcher: matchesCwsCompanyPage },
  { platform: 'FACEBOOK', name: 'Facebook — Cicero Web Studio Page', matcher: matchesCwsFacebookPage },
  { platform: 'INSTAGRAM', name: 'Instagram — Cicero Web Studio Business Account', matcher: matchesCwsInstagramAccount },
]

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed.' })

  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Authentication required.' })
  if (getMissingServerEnv().length) return res.status(503).json({ ok: false, error: 'Marketing publishing is not configured.' })

  const client = createServiceClient()
  const context = await getOwnerContext(client, token)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  const destinations = await verifyDestinations()
  if (req.method === 'GET') return getMarketingStatus(res, client, context, destinations)
  return createMarketingPost(req, res, client, context, destinations)
}

async function getMarketingStatus(res, client, context, destinations) {
  const storage = await getDestinationStorageAvailability(client)
  const latest = await getLatestAttempt(client, context.workspaceId)
  if (latest.error) return databaseFailure(res, latest.error)

  let attempt = latest.data
  let results = isM4Attempt(attempt) ? await getDestinationResults(client, attempt.id) : { data: [], error: null }
  if (results.error) return databaseFailure(res, results.error)

  if (attempt && isM4Attempt(attempt) && results.data.some(result => !TERMINAL_STATUS.has(result.provider_status))) {
    const reconciled = await reconcileAttempt(client, attempt, results.data)
    if (reconciled.error) return databaseFailure(res, reconciled.error)
    attempt = reconciled.data.attempt
    results = { data: reconciled.data.results, error: null }
  }

  const currentAttempt = isM4Attempt(attempt) ? attempt : null
  const history = await getAttemptHistory(client, context.workspaceId, currentAttempt?.id)
  if (history.error) return databaseFailure(res, history.error)

  return res.status(200).json({
    ok: true,
    destinations: serializeDestinations(destinations),
    attempt: serializeAttempt(currentAttempt),
    destination_results: results.data.map(serializeDestinationResult),
    attempt_history: history.data.map(serializeAttempt),
    storage_ready: storage.ready,
    storage_error: storage.error,
    can_start_new_attempt: !currentAttempt && storage.ready,
    poll_after_ms: currentAttempt && results.data.some(result => !TERMINAL_STATUS.has(result.provider_status))
      ? MARKETING_POLL_INTERVAL_MS
      : null,
  })
}

async function createMarketingPost(req, res, client, context, destinations) {
  const body = parseRequestBody(req.body)
  const validationError = validatePublishRequest(body)
  if (validationError) return res.status(400).json({ ok: false, error: validationError })
  if (!allDestinationsVerified(destinations)) {
    return res.status(409).json({
      ok: false,
      error: 'Every Marketing destination must be positively verified before owner confirmation can publish.',
      destinations: serializeDestinations(destinations),
    })
  }

  const storage = await getDestinationStorageAvailability(client)
  if (!storage.ready) {
    return res.status(503).json({
      ok: false,
      error: 'Marketing destination storage is not ready for publishing.',
      destinations: serializeDestinations(destinations),
    })
  }

  const existing = await getAttemptByReferenceKey(client, body.reference_key)
  if (existing.error) return databaseFailure(res, existing.error)
  if (existing.data) return respondWithExistingAttempt(res, client, existing.data, destinations)

  const latest = await getLatestAttempt(client, context.workspaceId)
  if (latest.error) return databaseFailure(res, latest.error)
  if (isM4Attempt(latest.data)) {
    return res.status(409).json({
      ok: false,
      error: 'A multi-destination Marketing attempt already exists and cannot be republished.',
      attempt: serializeAttempt(latest.data),
      can_start_new_attempt: false,
      destinations: serializeDestinations(destinations),
    })
  }

  const inserted = await client
    .from('marketing_publish_attempts')
    .insert({
      workspace_id: context.workspaceId,
      created_by: context.userId,
      reference_key: body.reference_key,
      caption: body.caption.trim(),
      asset_path: ASSET_PATH,
      destination: M4_DESTINATION,
      provider_status: 'preparing',
      provider_external_data: {},
    })
    .select('*')
    .single()

  if (inserted.error?.code === '23505') {
    const duplicate = await getAttemptByReferenceKey(client, body.reference_key)
    if (duplicate.error || !duplicate.data) return databaseFailure(res, duplicate.error || inserted.error)
    return respondWithExistingAttempt(res, client, duplicate.data, destinations)
  }
  if (inserted.error) return databaseFailure(res, inserted.error)

  const attempt = inserted.data
  const prepared = await insertDestinationResults(client, attempt.id, destinations)
  if (prepared.error) {
    await updateAttempt(client, attempt.id, { provider_status: 'error', provider_error: 'Marketing destination records could not be prepared.' })
    return databaseFailure(res, prepared.error)
  }

  try {
    const upload = await uploadLogo()
    const createdPost = await createProviderPost(body.caption.trim(), body.reference_key, upload.id)
    const persisted = await persistProviderPost(client, attempt, prepared.data, createdPost, upload.id)
    if (persisted.error) return databaseFailure(res, persisted.error)
    return res.status(202).json(marketingResponse(destinations, persisted.data.attempt, persisted.data.results))
  } catch (error) {
    let recovered = null
    try {
      recovered = await lookupProviderPost(body.reference_key)
    } catch {
      recovered = null
    }

    if (recovered) {
      const persisted = await persistProviderPost(client, attempt, prepared.data, recovered)
      if (persisted.error) return databaseFailure(res, persisted.error)
      return res.status(202).json(marketingResponse(destinations, persisted.data.attempt, persisted.data.results))
    }

    const failedAttempt = await updateAttempt(client, attempt.id, {
      provider_status: 'error',
      provider_error: safeErrorMessage(error),
    })
    const failedResults = await markDestinationResultsError(client, prepared.data, safeErrorMessage(error))
    if (failedAttempt.error || failedResults.error) return databaseFailure(res, failedAttempt.error || failedResults.error)
    return providerFailure(res, error, serializeAttempt(failedAttempt.data), destinations, failedResults.data)
  }
}

async function respondWithExistingAttempt(res, client, attempt, destinations) {
  if (!isM4Attempt(attempt)) {
    return res.status(409).json({ ok: false, error: 'That reference belongs to a historical Marketing attempt.', destinations: serializeDestinations(destinations) })
  }
  const results = await getDestinationResults(client, attempt.id)
  if (results.error) return databaseFailure(res, results.error)
  const reconciled = await reconcileAttempt(client, attempt, results.data)
  if (reconciled.error) return databaseFailure(res, reconciled.error)
  return res.status(200).json({ ...marketingResponse(destinations, reconciled.data.attempt, reconciled.data.results), duplicate: true })
}

async function reconcileAttempt(client, attempt, results) {
  if (results.every(result => TERMINAL_STATUS.has(result.provider_status))) return { data: { attempt, results }, error: null }

  try {
    const post = attempt.provider_post_id
      ? await getProviderPost(attempt.provider_post_id)
      : await lookupProviderPost(attempt.reference_key)
    if (!post) return { data: { attempt, results }, error: null }
    return persistProviderPost(client, attempt, results, post, attempt.upload_id)
  } catch (error) {
    return { data: null, error: { message: safeErrorMessage(error) } }
  }
}

function marketingResponse(destinations, attempt, results) {
  return {
    ok: true,
    destinations: serializeDestinations(destinations),
    attempt: serializeAttempt(attempt),
    destination_results: results.map(serializeDestinationResult),
    can_start_new_attempt: false,
    poll_after_ms: results.some(result => !TERMINAL_STATUS.has(result.provider_status)) ? MARKETING_POLL_INTERVAL_MS : null,
  }
}

async function verifyDestinations() {
  return Promise.all(DESTINATION_DEFINITIONS.map(async definition => {
    try {
      const account = await providerRequest(`/social-account/by-type?type=${definition.platform}&teamId=${encodeURIComponent(process.env.BUNDLE_SOCIAL_TEAM_ID)}`)
      if (account?.type !== definition.platform || !definition.matcher(account)) {
        return destinationState(definition, 'not_verified', null, 'The active provider account is not the intended CWS destination.')
      }
      return destinationState(definition, 'verified', account, null)
    } catch (error) {
      if (error instanceof ProviderError && error.status === 404) {
        return destinationState(definition, 'not_connected', null, 'No active provider account is connected.')
      }
      return destinationState(definition, 'error', null, safeErrorMessage(error))
    }
  }))
}

function destinationState(definition, verificationState, account, error) {
  return {
    platform: definition.platform,
    name: definition.name,
    verification_state: verificationState,
    channel_name: accountDisplayName(account) || definition.name,
    provider_identity: providerIdentity(account),
    error,
  }
}

function allDestinationsVerified(destinations) {
  return destinations.every(destination => destination.verification_state === 'verified')
}

function matchesCwsCompanyPage(account) {
  return candidateValues(account).some(value => normalizeIdentifier(value).includes('cicerowebstudio'))
}

function matchesCwsFacebookPage(account) {
  return candidateValues(account).some(value => normalizeIdentifier(value).includes('cicerowebstudio'))
}

function matchesCwsInstagramAccount(account) {
  return candidateValues(account).some(value => normalizeIdentifier(value).includes('cicerowebstudio'))
}

function candidateValues(account) {
  return [
    account?.name,
    account?.displayName,
    account?.username,
    account?.userDisplayName,
    account?.userUsername,
    account?.address,
    account?.id,
    account?.externalId,
  ]
}

function accountDisplayName(account) {
  return optionalText(account?.displayName)
    || optionalText(account?.username)
    || optionalText(account?.userDisplayName)
    || optionalText(account?.userUsername)
    || null
}

function providerIdentity(account) {
  if (!account) return {}
  return {
    type: optionalText(account.type),
    display_name: optionalText(account.displayName),
    username: optionalText(account.username),
    user_display_name: optionalText(account.userDisplayName),
    user_username: optionalText(account.userUsername),
    external_id: optionalText(account.externalId),
  }
}

async function insertDestinationResults(client, attemptId, destinations) {
  const inserted = await client
    .from('marketing_publish_destination_results')
    .insert(destinations.map(destination => ({
      attempt_id: attemptId,
      platform: destination.platform,
      provider_identity: destination.provider_identity,
      provider_status: 'preparing',
    })))
    .select('*')
  return inserted
}

async function persistProviderPost(client, attempt, results, post, uploadId) {
  const updatedAttempt = await updateAttempt(client, attempt.id, providerUpdate(post, { uploadId }))
  if (updatedAttempt.error) return updatedAttempt

  const updatedResults = await Promise.all(results.map(result => updateDestinationResult(
    client,
    result.id,
    destinationResultUpdate(post, result.platform),
  )))
  const failed = updatedResults.find(result => result.error)
  if (failed) return { data: null, error: failed.error }
  return { data: { attempt: updatedAttempt.data, results: updatedResults.map(result => result.data) }, error: null }
}

async function markDestinationResultsError(client, results, error) {
  const updated = await Promise.all(results.map(result => updateDestinationResult(client, result.id, {
    provider_status: 'error',
    provider_error: error,
  })))
  const failed = updated.find(result => result.error)
  return failed ? { data: null, error: failed.error } : { data: updated.map(result => result.data), error: null }
}

function providerUpdate(post, { uploadId } = {}) {
  return {
    ...(uploadId ? { upload_id: uploadId } : {}),
    provider_post_id: optionalText(post?.id),
    provider_status: normalizeProviderStatus(post?.status),
    provider_error: providerPostError(post),
    provider_external_data: isPlainObject(post?.externalData) ? post.externalData : {},
  }
}

function destinationResultUpdate(post, platform) {
  const externalData = isPlainObject(post?.externalData) ? post.externalData : {}
  const platformData = isPlainObject(externalData[platform]) ? externalData[platform] : {}
  const error = providerPlatformError(post, platform)
  const permalink = optionalText(platformData.permalink)
  const providerPostId = optionalText(platformData.id)
  const status = error
    ? 'error'
    : hasPublishedPlatformEvidence(platformData, normalizeProviderStatus(post?.status))
      ? 'posted'
      : normalizeProviderStatus(platformData.status || post?.status)

  return {
    provider_post_id: providerPostId,
    provider_status: status,
    provider_error: error,
    provider_permalink: permalink,
    provider_external_data: platformData,
  }
}

function hasPublishedPlatformEvidence(platformData, providerStatus) {
  return providerStatus === 'posted' || (
    providerStatus === 'error'
    && Boolean(optionalText(platformData?.id) || optionalText(platformData?.permalink))
  )
}

function providerPostError(post) {
  return optionalText(post?.error) || optionalText(post?.errors) || null
}

function providerPlatformError(post, platform) {
  const value = post?.errors?.[platform]
  if (typeof value === 'string') return optionalText(value)
  if (isPlainObject(value)) return optionalText(value.userFacingMessage) || optionalText(value.errorMessage) || optionalText(value.message) || optionalText(value.error)
  return null
}

async function uploadLogo() {
  const image = await readFile(ASSET_FILE_PATH)
  const form = new FormData()
  form.set('file', new Blob([image], { type: 'image/png' }), 'cicero-web-studio-logo.png')
  form.set('teamId', process.env.BUNDLE_SOCIAL_TEAM_ID)
  const body = await providerRequest('/upload/', { method: 'POST', body: form })
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) throw new ProviderError(502, 'bundle.social did not return an upload ID.')
  return { id }
}

async function createProviderPost(caption, referenceKey, uploadId) {
  const body = await providerRequest('/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamId: process.env.BUNDLE_SOCIAL_TEAM_ID,
      title: 'Cicero Web Studio',
      postDate: new Date(Date.now() + 30_000).toISOString(),
      status: 'SCHEDULED',
      referenceKey,
      socialAccountTypes: DESTINATION_DEFINITIONS.map(destination => destination.platform),
      data: {
        LINKEDIN: { text: caption, uploadIds: [uploadId] },
        FACEBOOK: { type: 'POST', text: caption, uploadIds: [uploadId] },
        INSTAGRAM: { type: 'POST', text: caption, uploadIds: [uploadId] },
      },
    }),
  })
  return body?.post || body
}

async function getProviderPost(id) {
  const body = await providerRequest(`/post/${encodeURIComponent(id)}`)
  return body?.post || body
}

async function lookupProviderPost(referenceKey) {
  try {
    const body = await providerRequest(`/post/reference-key/${encodeURIComponent(referenceKey)}`)
    return body?.post || body || null
  } catch (error) {
    if (error instanceof ProviderError && error.status === 404) return null
    throw error
  }
}

async function providerRequest(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), MARKETING_ENDPOINT_TIMEOUT_MS)
  try {
    const response = await fetch(`${PROVIDER_BASE_URL}${path}`, {
      ...options,
      headers: { 'x-api-key': process.env.BUNDLE_SOCIAL_API_KEY, ...options.headers },
      signal: controller.signal,
    })
    const text = await response.text()
    if (text.length > 100_000) throw new ProviderError(502, 'bundle.social returned an oversized response.')
    let body = {}
    if (text) {
      try { body = JSON.parse(text) } catch { throw new ProviderError(502, 'bundle.social returned invalid JSON.') }
    }
    if (!response.ok) throw new ProviderError(response.status, providerMessage(body, response.status))
    return body
  } catch (error) {
    if (error?.name === 'AbortError') throw new ProviderError(504, 'bundle.social request timed out.')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeProviderStatus(value) {
  const status = typeof value === 'string' ? value.toLowerCase() : 'processing'
  return PROVIDER_STATUS.has(status) ? status : 'processing'
}

function serializeDestinations(destinations) {
  return destinations.map(destination => ({
    platform: destination.platform,
    name: destination.name,
    verification_state: destination.verification_state,
    channel_name: destination.channel_name,
    error: destination.error,
  }))
}

function serializeAttempt(attempt) {
  if (!attempt) return null
  return {
    id: attempt.id,
    reference_key: attempt.reference_key,
    caption: attempt.caption,
    asset_path: attempt.asset_path,
    destination: attempt.destination,
    provider_status: attempt.provider_status,
    provider_error: attempt.provider_error,
    provider_permalink: attempt.provider_permalink,
    created_at: attempt.created_at,
  }
}

function serializeDestinationResult(result) {
  return {
    id: result.id,
    platform: result.platform,
    provider_status: result.provider_status,
    provider_error: result.provider_error,
    provider_permalink: result.provider_permalink,
    created_at: result.created_at,
    updated_at: result.updated_at,
  }
}

function isM4Attempt(attempt) {
  return attempt?.destination === M4_DESTINATION
}

async function getOwnerContext(client, token) {
  const authenticated = await client.auth.getUser(token)
  const user = authenticated.data?.user
  if (authenticated.error || !user) return { error: 'The session is invalid or expired.', status: 401 }
  const membership = await client.from('workspace_members').select('workspace_id, role').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: true }).limit(1).maybeSingle()
  if (membership.error) return { error: 'Marketing publishing access could not be verified.', status: 502 }
  if (!membership.data || membership.data.role !== 'owner') return { error: 'An active workspace owner must confirm a Marketing post.', status: 403 }
  return { workspaceId: membership.data.workspace_id, userId: user.id }
}

function getLatestAttempt(client, workspaceId) {
  return client.from('marketing_publish_attempts').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(1).maybeSingle()
}

async function getAttemptHistory(client, workspaceId, currentAttemptId) {
  const records = await client.from('marketing_publish_attempts').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(10)
  if (records.error) return { data: null, error: records.error }
  return { data: (records.data || []).filter(attempt => attempt.id !== currentAttemptId), error: null }
}

function getAttemptByReferenceKey(client, referenceKey) {
  return client.from('marketing_publish_attempts').select('*').eq('reference_key', referenceKey).maybeSingle()
}

async function getDestinationResults(client, attemptId) {
  return client.from('marketing_publish_destination_results').select('*').eq('attempt_id', attemptId).order('platform', { ascending: true })
}

async function getDestinationStorageAvailability(client) {
  const result = await client.from('marketing_publish_destination_results').select('id').limit(1)
  return result.error
    ? { ready: false, error: 'Destination storage is not available yet.' }
    : { ready: true, error: null }
}

function updateAttempt(client, id, values) {
  return client.from('marketing_publish_attempts').update(values).eq('id', id).select('*').single()
}

function updateDestinationResult(client, id, values) {
  return client.from('marketing_publish_destination_results').update(values).eq('id', id).select('*').single()
}

function createServiceClient() {
  return createClient(process.env.GENERATION_SUPABASE_URL, process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
}

function getMissingServerEnv() {
  return ['GENERATION_SUPABASE_URL', 'GENERATION_SUPABASE_SERVICE_ROLE_KEY', 'BUNDLE_SOCIAL_API_KEY', 'BUNDLE_SOCIAL_TEAM_ID'].filter(name => !process.env[name]?.trim())
}

function getBearerToken(req) {
  const value = req.headers?.authorization
  return typeof value === 'string' ? value.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '' : ''
}

function parseRequestBody(body) {
  if (!body) return {}
  if (typeof body !== 'string') return isPlainObject(body) ? body : {}
  try { const parsed = JSON.parse(body); return isPlainObject(parsed) ? parsed : {} } catch { return {} }
}

function validatePublishRequest(body) {
  if (!REFERENCE_KEY_PATTERN.test(body.reference_key || '')) return 'A valid publish reference is required.'
  if (typeof body.caption !== 'string' || !body.caption.trim()) return 'A caption is required.'
  if (body.caption.trim().length > 3000) return 'Caption must be 3,000 characters or fewer.'
  return ''
}

function normalizeIdentifier(value) { return typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '' }
function providerMessage(body, status) { return (optionalText(body?.error) || optionalText(body?.message) || `bundle.social returned HTTP ${status}.`).slice(0, 1000) }
function optionalText(value) { return typeof value === 'string' ? value.trim() || null : Array.isArray(value) ? value.map(optionalText).filter(Boolean).join('; ').slice(0, 1000) || null : null }
function isPlainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
function safeErrorMessage(error) { return error instanceof Error && error.message ? error.message.slice(0, 1000) : 'bundle.social request failed.' }
function providerFailure(res, error, attempt = null, destinations = [], results = []) { return res.status(error instanceof ProviderError && error.status === 409 ? 409 : 502).json({ ok: false, error: safeErrorMessage(error), attempt, destinations: serializeDestinations(destinations), destination_results: results.map(serializeDestinationResult) }) }
function databaseFailure(res, error) { return res.status(502).json({ ok: false, error: error?.message || 'Marketing publish record could not be updated.' }) }

class ProviderError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
