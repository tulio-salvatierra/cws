/* global process */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { createClient } from '@supabase/supabase-js'
import { buildMarketingOccurrencePlan, nextOpenMarketingSlot } from '../src/marketing/weeklySlots.js'

export const MARKETING_ENDPOINT_TIMEOUT_MS = 10_000
export const MARKETING_POLL_INTERVAL_MS = 30_000
export const OWNER_CONFIRMATION_TTL_MS = 10 * 60 * 1000

const PROVIDER_BASE_URL = 'https://api.bundle.social/api/v1'
const M4_DESTINATION = 'multi:cicero-web-studio'
const REFERENCE_KEY_PATTERN = /^cws-marketing(?:-(?:linkedin|m4|m5))?:[0-9a-f-]{36}$/i
const SLOT_KEY_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}:post-[ab]$/
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
  if (getMissingDatabaseEnv().length) return res.status(503).json({ ok: false, error: 'Marketing is not configured.' })

  const client = createServiceClient()
  const context = await getOwnerContext(client, token)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  const body = req.method === 'POST' ? parseRequestBody(req.body) : null
  if (isSlotResolutionRequest(body)) return resolveMissedSlot(res, client, context, body)

  if (getMissingProviderEnv().length) return res.status(503).json({ ok: false, error: 'Marketing publishing is not configured.' })
  const destinations = await verifyDestinations()
  if (req.method === 'GET') return getMarketingStatus(res, client, context, destinations)
  return createMarketingPost(res, client, context, destinations, body)
}

async function getMarketingStatus(res, client, context, destinations) {
  const storage = await getMarketingStorageAvailability(client)
  const loaded = await loadMarketingAttempts(client, context.workspaceId)
  if (loaded.error) return databaseFailure(res, loaded.error)

  const resolutions = await loadSlotResolutions(client, context.workspaceId)
  if (resolutions.error) return databaseFailure(res, resolutions.error)

  const reconciled = await reconcileUnfinishedSlotAttempts(client, loaded.data)
  if (reconciled.error) return databaseFailure(res, reconciled.error)

  return res.status(200).json(marketingStatusResponse(destinations, storage, reconciled.data, resolutions.data, context))
}

async function createMarketingPost(res, client, context, destinations, body) {
  const validationError = validatePublishRequest(body)
  if (validationError) return res.status(400).json({ ok: false, error: validationError })
  if (!allDestinationsVerified(destinations)) {
    return res.status(409).json({
      ok: false,
      error: 'Every Marketing destination must be positively verified before owner confirmation can publish.',
      destinations: serializeDestinations(destinations),
    })
  }

  const storage = await getMarketingStorageAvailability(client)
  if (!storage.ready) {
    return res.status(503).json({
      ok: false,
      error: 'Marketing destination storage is not ready for publishing.',
      destinations: serializeDestinations(destinations),
    })
  }

  const loaded = await loadMarketingAttempts(client, context.workspaceId)
  if (loaded.error) return databaseFailure(res, loaded.error)
  const resolutions = await loadSlotResolutions(client, context.workspaceId)
  if (resolutions.error) return databaseFailure(res, resolutions.error)
  const plan = buildMarketingOccurrencePlan({ attempts: loaded.data, resolutions: resolutions.data })
  const slots = plan.slots
  const slot = slots.find(candidate => candidate.slotKey === body.slot_key)
  if (!slot || !slot.asset || slot.asset.id !== body.asset_id) {
    return res.status(409).json({ ok: false, error: 'This weekly Marketing slot is not ready with the selected evergreen asset.' })
  }
  if (slot.attempt) {
    return res.status(409).json({ ok: false, error: 'This weekly Marketing slot already has a confirmed attempt and is locked.' })
  }
  const authorizableSlot = nextAuthorizableSlot(slots)
  if (!authorizableSlot || authorizableSlot.slotKey !== slot.slotKey) {
    return res.status(409).json({ ok: false, error: 'This Marketing slot requires its own owner confirmation after the prior slot is complete.' })
  }
  if (!isValidOwnerConfirmationToken(body.owner_confirmation_token, context, slot)) {
    return res.status(403).json({ ok: false, error: 'This owner confirmation is expired, invalid, or bound to a different Marketing slot.' })
  }

  const existing = await getAttemptByReferenceKey(client, body.reference_key)
  if (existing.error) return databaseFailure(res, existing.error)
  if (existing.data) return respondWithExistingAttempt(res, client, existing.data)

  const inserted = await client
    .from('marketing_publish_attempts')
    .insert({
      workspace_id: context.workspaceId,
      created_by: context.userId,
      reference_key: body.reference_key,
      caption: body.caption.trim(),
      asset_id: slot.asset.id,
      asset_path: slot.asset.assetPath,
      destination: M4_DESTINATION,
      marketing_slot_key: slot.slotKey,
      provider_status: 'preparing',
      provider_external_data: {},
    })
    .select('*')
    .single()

  if (inserted.error?.code === '23505') {
    const duplicate = await getAttemptBySlotKey(client, context.workspaceId, slot.slotKey)
    if (duplicate.error || !duplicate.data) return databaseFailure(res, duplicate.error || inserted.error)
    return respondWithExistingAttempt(res, client, duplicate.data)
  }
  if (inserted.error) return databaseFailure(res, inserted.error)

  const attempt = inserted.data
  const prepared = await insertDestinationResults(client, attempt.id, destinations)
  if (prepared.error) {
    await updateAttempt(client, attempt.id, { provider_status: 'error', provider_error: 'Marketing destination records could not be prepared.' })
    return databaseFailure(res, prepared.error)
  }

  try {
    const upload = await uploadAsset(slot.asset)
    const createdPost = await createProviderPost(body.caption.trim(), body.reference_key, upload.id)
    const persisted = await persistProviderPost(client, attempt, prepared.data, createdPost, upload.id)
    if (persisted.error) return databaseFailure(res, persisted.error)
    return res.status(202).json({ ok: true })
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
      return res.status(202).json({ ok: true })
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

// Move and Skip are internal Marketing decisions. They deliberately run before
// destination verification and never call bundle.social.
async function resolveMissedSlot(res, client, context, body) {
  const validationError = validateSlotResolutionRequest(body)
  if (validationError) return res.status(400).json({ ok: false, error: validationError })

  const loaded = await loadMarketingAttempts(client, context.workspaceId)
  if (loaded.error) return databaseFailure(res, loaded.error)
  const resolutions = await loadSlotResolutions(client, context.workspaceId)
  if (resolutions.error) return databaseFailure(res, resolutions.error)

  const plan = buildMarketingOccurrencePlan({ attempts: loaded.data, resolutions: resolutions.data })
  const slot = plan.missedSlots.find(candidate => candidate.slotKey === body.slot_key)
  const oldestMissedSlot = plan.missedSlots[0]
  if (!slot || !slot.asset || !oldestMissedSlot || oldestMissedSlot.slotKey !== slot.slotKey) {
    return res.status(409).json({ ok: false, error: 'Only the oldest unresolved missed Marketing slot can receive an owner decision.' })
  }
  if (slot.asset.id !== body.asset_id) {
    return res.status(409).json({ ok: false, error: 'This owner decision is bound to a different Marketing asset.' })
  }
  if (!isValidOwnerConfirmationToken(body.owner_confirmation_token, context, slot)) {
    return res.status(403).json({ ok: false, error: 'This owner confirmation is expired, invalid, or bound to a different Marketing slot.' })
  }

  const target = body.action === 'move'
    ? nextOpenMarketingSlot({ attempts: loaded.data, resolutions: resolutions.data })
    : null
  if (body.action === 'move' && !target) {
    return res.status(409).json({ ok: false, error: 'No future Marketing slot is available to receive this post.' })
  }

  const inserted = await client
    .from('marketing_slot_resolutions')
    .insert({
      workspace_id: context.workspaceId,
      occurrence_slot_key: slot.slotKey,
      origin_slot_key: slot.originalSlotKey || slot.slotKey,
      action: body.action,
      target_slot_key: target?.slotKey || null,
      asset_id: slot.asset.id,
      asset_path: slot.asset.assetPath,
      caption: body.caption.trim(),
      created_by: context.userId,
    })
    .select('*')
    .single()

  if (inserted.error?.code === '23505') {
    return res.status(409).json({ ok: false, error: 'This missed Marketing slot already has an owner decision.' })
  }
  if (inserted.error) return databaseFailure(res, inserted.error)

  return res.status(200).json({
    ok: true,
    decision: body.action,
    occurrence_slot_key: slot.slotKey,
    target_slot_key: target?.slotKey || null,
  })
}

async function respondWithExistingAttempt(res, client, attempt) {
  if (!isSlotAttempt(attempt)) {
    return res.status(409).json({ ok: false, error: 'That reference belongs to a historical Marketing attempt.' })
  }
  const results = await getDestinationResults(client, attempt.id)
  if (results.error) return databaseFailure(res, results.error)
  const reconciled = await reconcileAttempt(client, attempt, results.data)
  if (reconciled.error) return databaseFailure(res, reconciled.error)
  return res.status(200).json({ ok: true, duplicate: true })
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

async function loadMarketingAttempts(client, workspaceId) {
  const attempts = await client
    .from('marketing_publish_attempts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (attempts.error) return { data: null, error: attempts.error }

  const withResults = await Promise.all((attempts.data || []).map(async attempt => {
    if (!isMultiDestinationAttempt(attempt)) return { ...attempt, destination_results: [] }
    const results = await getDestinationResults(client, attempt.id)
    if (results.error) return { error: results.error }
    return { ...attempt, destination_results: results.data || [] }
  }))
  const failed = withResults.find(record => record.error)
  return failed ? { data: null, error: failed.error } : { data: withResults, error: null }
}

async function reconcileUnfinishedSlotAttempts(client, attempts) {
  const reconciled = await Promise.all(attempts.map(async attempt => {
    if (!isSlotAttempt(attempt) || attempt.destination_results.every(result => TERMINAL_STATUS.has(result.provider_status))) return attempt
    const result = await reconcileAttempt(client, attempt, attempt.destination_results)
    if (result.error) return { error: result.error }
    return { ...result.data.attempt, destination_results: result.data.results }
  }))
  const failed = reconciled.find(record => record.error)
  return failed ? { data: null, error: failed.error } : { data: reconciled, error: null }
}

function marketingStatusResponse(destinations, storage, attempts, resolutions, context) {
  const plan = buildMarketingOccurrencePlan({ attempts, resolutions })
  const slots = plan.slots
  const activeSlotKeys = new Set(slots.map(slot => slot.slotKey))
  const history = attempts.filter(attempt => !activeSlotKeys.has(attempt.marketing_slot_key))
  const hasUnfinishedAttempt = slots.some(slot => slot.attempt && slot.destinationResults.some(result => !TERMINAL_STATUS.has(result.provider_status)))
  const authorizableSlot = storage.ready ? nextAuthorizableSlot(slots) : null

  return {
    ok: true,
    destinations: serializeDestinations(destinations),
    slots: slots.map(slot => serializeSlot(slot, slot === authorizableSlot ? createOwnerConfirmationToken(context, slot) : null)),
    attempt_history: history.map(serializeAttempt),
    storage_ready: storage.ready,
    storage_error: storage.error,
    missed_slot_signal: plan.missedSlotSignal,
    missed_slot_decisions: resolutions.map(serializeSlotResolution),
    poll_after_ms: hasUnfinishedAttempt ? MARKETING_POLL_INTERVAL_MS : null,
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

async function uploadAsset(asset) {
  const image = await readFile(join(process.cwd(), 'public', asset.assetPath))
  const form = new FormData()
  form.set('file', new Blob([image], { type: mimeTypeForAsset(asset.assetPath) }), asset.assetPath.split('/').at(-1))
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
    asset_id: attempt.asset_id || null,
    asset_path: attempt.asset_path,
    destination: attempt.destination,
    marketing_slot_key: attempt.marketing_slot_key || null,
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

function serializeSlot(slot, ownerConfirmationToken = null) {
  return {
    key: slot.key,
    slot_key: slot.slotKey,
    label: slot.label,
    weekday: slot.weekday,
    slot_date: slot.slotDate,
    state: slot.state,
    original_slot_key: slot.originalSlotKey || slot.slotKey,
    resolution: serializeSlotResolution(slot.resolution),
    carried_from: slot.carriedResolution ? {
      occurrence_slot_key: slot.carriedResolution.occurrence_slot_key,
      origin_slot_key: slot.carriedResolution.origin_slot_key,
      decided_at: slot.carriedResolution.decided_at || slot.carriedResolution.created_at,
    } : null,
    asset: slot.asset ? {
      id: slot.asset.id,
      asset_path: slot.asset.assetPath,
      label: slot.asset.label,
      price: slot.asset.price,
      default_caption: slot.asset.defaultCaption,
      fallback: slot.asset.fallback === true,
    } : null,
    caption: slot.caption,
    owner_confirmation_token: ownerConfirmationToken,
    attempt: serializeAttempt(slot.attempt),
    destination_results: slot.destinationResults.map(serializeDestinationResult),
  }
}

function serializeSlotResolution(resolution) {
  if (!resolution) return null
  return {
    occurrence_slot_key: resolution.occurrence_slot_key,
    origin_slot_key: resolution.origin_slot_key,
    action: resolution.action,
    target_slot_key: resolution.target_slot_key,
    asset_id: resolution.asset_id,
    asset_path: resolution.asset_path,
    caption: resolution.caption,
    decided_at: resolution.decided_at || resolution.created_at,
  }
}

function isMultiDestinationAttempt(attempt) {
  return attempt?.destination === M4_DESTINATION
}

function isSlotAttempt(attempt) {
  return isMultiDestinationAttempt(attempt) && Boolean(attempt?.marketing_slot_key)
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

function getAttemptByReferenceKey(client, referenceKey) {
  return client.from('marketing_publish_attempts').select('*').eq('reference_key', referenceKey).maybeSingle()
}

function getAttemptBySlotKey(client, workspaceId, slotKey) {
  return client.from('marketing_publish_attempts').select('*').eq('workspace_id', workspaceId).eq('marketing_slot_key', slotKey).maybeSingle()
}

async function getDestinationResults(client, attemptId) {
  return client.from('marketing_publish_destination_results').select('*').eq('attempt_id', attemptId).order('platform', { ascending: true })
}

async function loadSlotResolutions(client, workspaceId) {
  const result = await client
    .from('marketing_slot_resolutions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })
    .limit(100)
  return result.error ? { data: null, error: result.error } : { data: result.data || [], error: null }
}

async function getMarketingStorageAvailability(client) {
  const [destinations, resolutions] = await Promise.all([
    client.from('marketing_publish_destination_results').select('id').limit(1),
    client.from('marketing_slot_resolutions').select('id').limit(1),
  ])
  if (destinations.error) return { ready: false, error: 'Destination storage is not available yet.' }
  if (resolutions.error) return { ready: false, error: 'Missed-slot decision storage is not available yet.' }
  return { ready: true, error: null }
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

function getMissingDatabaseEnv() { return ['GENERATION_SUPABASE_URL', 'GENERATION_SUPABASE_SERVICE_ROLE_KEY'].filter(name => !process.env[name]?.trim()) }
function getMissingProviderEnv() { return ['BUNDLE_SOCIAL_API_KEY', 'BUNDLE_SOCIAL_TEAM_ID'].filter(name => !process.env[name]?.trim()) }

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
  if (!SLOT_KEY_PATTERN.test(body.slot_key || '')) return 'A valid weekly Marketing slot is required.'
  if (typeof body.asset_id !== 'string' || !body.asset_id.trim()) return 'A valid evergreen asset is required.'
  if (typeof body.owner_confirmation_token !== 'string' || body.owner_confirmation_token.length > 1024) return 'A valid owner confirmation is required.'
  if (typeof body.caption !== 'string' || !body.caption.trim()) return 'A caption is required.'
  if (body.caption.trim().length > 3000) return 'Caption must be 3,000 characters or fewer.'
  return ''
}

function isSlotResolutionRequest(body) {
  return body?.action === 'move' || body?.action === 'skip'
}

function validateSlotResolutionRequest(body) {
  if (!['move', 'skip'].includes(body.action)) return 'A valid missed-slot decision is required.'
  if (!SLOT_KEY_PATTERN.test(body.slot_key || '')) return 'A valid weekly Marketing slot is required.'
  if (typeof body.asset_id !== 'string' || !body.asset_id.trim()) return 'A valid evergreen asset is required.'
  if (typeof body.owner_confirmation_token !== 'string' || body.owner_confirmation_token.length > 1024) return 'A valid owner confirmation is required.'
  if (typeof body.caption !== 'string' || !body.caption.trim()) return 'A caption is required.'
  if (body.caption.trim().length > 3000) return 'Caption must be 3,000 characters or fewer.'
  return ''
}

function nextAuthorizableSlot(slots) {
  for (const slot of slots) {
    if (slot.state === 'resolved') continue
    if (slot.attempt) {
      if (slot.state === 'posted') continue
      return null
    }
    if (slot.state === 'missed' || slot.state === 'ready') return slot.asset ? slot : null
  }
  return null
}

export function createOwnerConfirmationToken(context, slot, now = Date.now()) {
  const payload = {
    version: 1,
    workspace_id: context.workspaceId,
    user_id: context.userId,
    slot_key: slot.slotKey,
    asset_id: slot.asset.id,
    expires_at: now + OWNER_CONFIRMATION_TTL_MS,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function isValidOwnerConfirmationToken(value, context, slot, now = Date.now()) {
  const [encoded, receivedSignature, extra] = value.split('.')
  if (!encoded || !receivedSignature || extra) return false

  const expectedSignature = createHmac('sha256', process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY).update(encoded).digest('base64url')
  const received = Buffer.from(receivedSignature)
  const expected = Buffer.from(expectedSignature)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    return payload?.version === 1
      && payload.workspace_id === context.workspaceId
      && payload.user_id === context.userId
      && payload.slot_key === slot.slotKey
      && payload.asset_id === slot.asset.id
      && Number.isFinite(payload.expires_at)
      && payload.expires_at > now
  } catch {
    return false
  }
}

function normalizeIdentifier(value) { return typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '' }
function mimeTypeForAsset(assetPath) { return assetPath.endsWith('.png') ? 'image/png' : assetPath.endsWith('.webp') ? 'image/webp' : 'image/jpeg' }
function providerMessage(body, status) { return (optionalText(body?.error) || optionalText(body?.message) || `bundle.social returned HTTP ${status}.`).slice(0, 1000) }
function optionalText(value) { return typeof value === 'string' ? value.trim() || null : Array.isArray(value) ? value.map(optionalText).filter(Boolean).join('; ').slice(0, 1000) || null : null }
function isPlainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
function safeErrorMessage(error) { return error instanceof Error && error.message ? error.message.slice(0, 1000) : 'bundle.social request failed.' }
function providerFailure(res, error, attempt = null, destinations = [], results = []) { return res.status(error instanceof ProviderError && error.status === 409 ? 409 : 502).json({ ok: false, error: safeErrorMessage(error), attempt, destinations: serializeDestinations(destinations), destination_results: results.map(serializeDestinationResult) }) }
function databaseFailure(res, error) { return res.status(502).json({ ok: false, error: error?.message || 'Marketing publish record could not be updated.' }) }

class ProviderError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
