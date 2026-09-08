/* global process */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

export const MARKETING_ENDPOINT_TIMEOUT_MS = 10_000
export const MARKETING_POLL_INTERVAL_MS = 30_000
export const EXPECTED_DESTINATION = 'LinkedIn — Cicero Web Studio Company Page'

const PROVIDER_BASE_URL = 'https://api.bundle.social/api/v1'
const ASSET_PATH = '/images/logo.png'
const ASSET_FILE_PATH = join(process.cwd(), 'public', 'images', 'logo.png')
const REFERENCE_KEY_PATTERN = /^cws-marketing-linkedin:[0-9a-f-]{36}$/i
const PROVIDER_STATUS = new Set(['preparing', 'scheduled', 'processing', 'posted', 'retrying', 'error'])
const TERMINAL_STATUS = new Set(['posted', 'error'])

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  }

  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Authentication required.' })

  if (getMissingServerEnv().length) {
    return res.status(503).json({ ok: false, error: 'Marketing publishing is not configured.' })
  }

  const client = createServiceClient()
  const context = await getOwnerContext(client, token)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  try {
    const destination = await verifyDestination()
    if (req.method === 'GET') return getMarketingStatus(res, client, context, destination)
    return createMarketingPost(req, res, client, context, destination)
  } catch (error) {
    return providerFailure(res, error)
  }
}

async function getMarketingStatus(res, client, context, destination) {
  const current = await getLatestAttempt(client, context.workspaceId)
  if (current.error) return databaseFailure(res, current.error)

  let attempt = current.data
  if (attempt && !TERMINAL_STATUS.has(attempt.provider_status)) {
    const refreshed = await reconcileAttempt(client, attempt)
    if (refreshed.error) return databaseFailure(res, refreshed.error)
    attempt = refreshed.data
  }

  const availability = getNewAttemptAvailability(attempt)

  return res.status(200).json({
    ok: true,
    destination,
    attempt: serializeAttempt(availability.previousFailedAttempt ? null : attempt),
    previous_failed_attempt: serializeAttempt(availability.previousFailedAttempt),
    can_start_new_attempt: availability.canStartNewAttempt,
    poll_after_ms: attempt && !TERMINAL_STATUS.has(attempt.provider_status)
      ? MARKETING_POLL_INTERVAL_MS
      : null,
  })
}

async function createMarketingPost(req, res, client, context, destination) {
  const body = parseRequestBody(req.body)
  const validationError = validatePublishRequest(body)
  if (validationError) return res.status(400).json({ ok: false, error: validationError })

  const existing = await getAttemptByReferenceKey(client, body.reference_key)
  if (existing.error) return databaseFailure(res, existing.error)
  if (existing.data) return respondWithExistingAttempt(res, client, existing.data, destination)

  const latest = await getLatestAttempt(client, context.workspaceId)
  if (latest.error) return databaseFailure(res, latest.error)
  const availability = getNewAttemptAvailability(latest.data)
  if (!availability.canStartNewAttempt) {
    return res.status(409).json({
      ok: false,
      error: 'A Marketing attempt already exists and cannot be retried.',
      attempt: serializeAttempt(latest.data),
      previous_failed_attempt: null,
      can_start_new_attempt: false,
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
      destination: 'linkedin:cicero-web-studio',
      provider_status: 'preparing',
      provider_external_data: {},
    })
    .select('*')
    .single()

  if (inserted.error?.code === '23505') {
    const duplicate = await getAttemptByReferenceKey(client, body.reference_key)
    if (duplicate.error || !duplicate.data) return databaseFailure(res, duplicate.error || inserted.error)
    return respondWithExistingAttempt(res, client, duplicate.data, destination)
  }
  if (inserted.error) return databaseFailure(res, inserted.error)

  const attempt = inserted.data

  try {
    const upload = await uploadLogo()
    const createdPost = await createProviderPost(body.caption.trim(), body.reference_key, upload.id)
    const updated = await updateAttempt(client, attempt.id, providerUpdate(createdPost, { uploadId: upload.id }))
    if (updated.error) return databaseFailure(res, updated.error)

    return res.status(202).json({
      ok: true,
      destination,
      attempt: serializeAttempt(updated.data),
      previous_failed_attempt: serializeAttempt(availability.previousFailedAttempt),
      can_start_new_attempt: false,
      poll_after_ms: MARKETING_POLL_INTERVAL_MS,
    })
  } catch (error) {
    let recovered = null
    try {
      recovered = await lookupProviderPost(body.reference_key)
    } catch {
      recovered = null
    }
    if (recovered) {
      const updated = await updateAttempt(client, attempt.id, providerUpdate(recovered))
      if (updated.error) return databaseFailure(res, updated.error)
      return res.status(202).json({
        ok: true,
        destination,
        attempt: serializeAttempt(updated.data),
        previous_failed_attempt: serializeAttempt(availability.previousFailedAttempt),
        can_start_new_attempt: false,
        poll_after_ms: MARKETING_POLL_INTERVAL_MS,
      })
    }

    const failed = await updateAttempt(client, attempt.id, {
      provider_status: 'error',
      provider_error: safeErrorMessage(error),
    })
    if (failed.error) return databaseFailure(res, failed.error)
    return providerFailure(res, error, serializeAttempt(failed.data))
  }
}

async function respondWithExistingAttempt(res, client, attempt, destination) {
  const reconciled = await reconcileAttempt(client, attempt)
  if (reconciled.error) return databaseFailure(res, reconciled.error)

  const current = reconciled.data
  return res.status(200).json({
    ok: true,
    duplicate: true,
    destination,
    attempt: serializeAttempt(current),
    previous_failed_attempt: null,
    can_start_new_attempt: false,
    poll_after_ms: !TERMINAL_STATUS.has(current.provider_status)
      ? MARKETING_POLL_INTERVAL_MS
      : null,
  })
}

async function reconcileAttempt(client, attempt) {
  try {
    if (attempt.provider_post_id) {
      const post = await getProviderPost(attempt.provider_post_id)
      return updateAttempt(client, attempt.id, providerUpdate(post, { uploadId: attempt.upload_id }))
    }

    const post = await lookupProviderPost(attempt.reference_key)
    if (post) return updateAttempt(client, attempt.id, providerUpdate(post, { uploadId: attempt.upload_id }))
    return { data: attempt, error: null }
  } catch (error) {
    return { data: null, error: { message: safeErrorMessage(error) } }
  }
}

async function verifyDestination() {
  let connected
  try {
    // bundle.social's current OpenAPI exposes the type-specific lookup, not the former account-list route.
    connected = await providerRequest(`/social-account/by-type?type=LINKEDIN&teamId=${encodeURIComponent(process.env.BUNDLE_SOCIAL_TEAM_ID)}`)
  } catch (error) {
    if (error instanceof ProviderError && error.status === 404) {
      throw missingCwsDestination()
    }
    throw error
  }

  // `channels` is the list of available LinkedIn destinations. It is not proof
  // that bundle.social has selected the Company Page for this integration.
  // Only accept the provider's active account identity so an available page
  // cannot make a selected personal profile look publishable.
  if (connected?.type !== 'LINKEDIN' || !matchesCwsCompanyPage(connected)) {
    throw missingCwsDestination()
  }

  return {
    ready: true,
    name: EXPECTED_DESTINATION,
    channel_name: connected.displayName
      || connected.username
      || connected.userDisplayName
      || connected.userUsername
      || EXPECTED_DESTINATION,
  }
}

function missingCwsDestination() {
  return new ProviderError(409, 'The bundle.social team does not have the selected Cicero Web Studio LinkedIn Company Page.')
}

function matchesCwsCompanyPage(channel) {
  const candidates = [
    channel?.name,
    channel?.displayName,
    channel?.username,
    channel?.userDisplayName,
    channel?.userUsername,
    channel?.address,
    channel?.id,
    channel?.externalId,
  ]
  return candidates.some(value => normalizeIdentifier(value).includes('cicerowebstudio'))
}

function normalizeIdentifier(value) {
  return typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
}

async function uploadLogo() {
  const image = await readFile(ASSET_FILE_PATH)
  const form = new FormData()
  form.set('file', new Blob([image], { type: 'image/png' }), 'cicero-web-studio-logo.png')
  form.set('teamId', process.env.BUNDLE_SOCIAL_TEAM_ID)

  const body = await providerRequest('/upload/', { method: 'POST', body: form })
  // The upload API returns the media record, whose identifier is `id`.
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) throw new ProviderError(502, 'bundle.social did not return an upload ID.')
  return { id }
}

async function createProviderPost(caption, referenceKey, uploadId) {
  // bundle.social requires a timestamp even for immediate publishing. M2 exposes no scheduling choice.
  const postDate = new Date(Date.now() + 30_000).toISOString()
  const body = await providerRequest('/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamId: process.env.BUNDLE_SOCIAL_TEAM_ID,
      title: 'Cicero Web Studio',
      postDate,
      status: 'SCHEDULED',
      referenceKey,
      socialAccountTypes: ['LINKEDIN'],
      data: { LINKEDIN: { text: caption, uploadIds: [uploadId] } },
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
      headers: {
        'x-api-key': process.env.BUNDLE_SOCIAL_API_KEY,
        ...options.headers,
      },
      signal: controller.signal,
    })
    const text = await response.text()
    if (text.length > 100_000) throw new ProviderError(502, 'bundle.social returned an oversized response.')

    let body = {}
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        throw new ProviderError(502, 'bundle.social returned invalid JSON.')
      }
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

function providerUpdate(post, { uploadId } = {}) {
  const externalData = isPlainObject(post?.externalData) ? post.externalData : {}
  const linkedIn = isPlainObject(externalData.LINKEDIN) ? externalData.LINKEDIN : {}
  const providerStatus = normalizeProviderStatus(post?.status)
  const error = optionalText(post?.error) || optionalText(post?.errors) || null

  return {
    ...(uploadId ? { upload_id: uploadId } : {}),
    provider_post_id: optionalText(post?.id),
    provider_status: providerStatus,
    provider_error: error,
    provider_permalink: optionalText(linkedIn.permalink),
    provider_external_data: externalData,
  }
}

function normalizeProviderStatus(value) {
  const status = typeof value === 'string' ? value.toLowerCase() : 'processing'
  return PROVIDER_STATUS.has(status) ? status : 'processing'
}

function serializeAttempt(attempt) {
  if (!attempt) return null
  return {
    id: attempt.id,
    reference_key: attempt.reference_key,
    caption: attempt.caption,
    asset_path: attempt.asset_path,
    provider_status: attempt.provider_status,
    provider_error: attempt.provider_error,
    provider_permalink: attempt.provider_permalink,
    created_at: attempt.created_at,
  }
}

async function getOwnerContext(client, token) {
  const authenticated = await client.auth.getUser(token)
  const user = authenticated.data?.user
  if (authenticated.error || !user) return { error: 'The session is invalid or expired.', status: 401 }

  const membership = await client
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membership.error) return { error: 'Marketing publishing access could not be verified.', status: 502 }
  if (!membership.data || membership.data.role !== 'owner') {
    return { error: 'An active workspace owner must confirm a Marketing post.', status: 403 }
  }

  return { workspaceId: membership.data.workspace_id, userId: user.id }
}

function getLatestAttempt(client, workspaceId) {
  return client
    .from('marketing_publish_attempts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

function getAttemptByReferenceKey(client, referenceKey) {
  return client
    .from('marketing_publish_attempts')
    .select('*')
    .eq('reference_key', referenceKey)
    .maybeSingle()
}

function getNewAttemptAvailability(attempt) {
  const previousFailedAttempt = isRetryableFailedAttempt(attempt) ? attempt : null
  return {
    canStartNewAttempt: !attempt || Boolean(previousFailedAttempt),
    previousFailedAttempt,
  }
}

function isRetryableFailedAttempt(attempt) {
  return attempt?.provider_status === 'error'
    && !optionalText(attempt.provider_post_id)
    && !optionalText(attempt.provider_permalink)
}

function updateAttempt(client, id, values) {
  return client
    .from('marketing_publish_attempts')
    .update(values)
    .eq('id', id)
    .select('*')
    .single()
}

function createServiceClient() {
  return createClient(
    process.env.GENERATION_SUPABASE_URL,
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function getMissingServerEnv() {
  const required = [
    'GENERATION_SUPABASE_URL',
    'GENERATION_SUPABASE_SERVICE_ROLE_KEY',
    'BUNDLE_SOCIAL_API_KEY',
    'BUNDLE_SOCIAL_TEAM_ID',
  ]
  return required.filter(name => !process.env[name]?.trim())
}

function getBearerToken(req) {
  const value = req.headers?.authorization
  if (typeof value !== 'string') return ''
  return value.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || ''
}

function parseRequestBody(body) {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body)
      return isPlainObject(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return isPlainObject(body) ? body : {}
}

function validatePublishRequest(body) {
  if (!REFERENCE_KEY_PATTERN.test(body.reference_key || '')) return 'A valid publish reference is required.'
  if (typeof body.caption !== 'string' || body.caption.trim().length === 0) return 'A caption is required.'
  if (body.caption.trim().length > 3000) return 'Caption must be 3,000 characters or fewer.'
  return ''
}

function providerMessage(body, status) {
  const value = optionalText(body?.error) || optionalText(body?.message) || `bundle.social returned HTTP ${status}.`
  return value.slice(0, 1000)
}

function optionalText(value) {
  if (typeof value === 'string') return value.trim() || null
  if (Array.isArray(value)) return value.map(optionalText).filter(Boolean).join('; ').slice(0, 1000) || null
  return null
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function safeErrorMessage(error) {
  return error instanceof Error && error.message ? error.message.slice(0, 1000) : 'bundle.social request failed.'
}

function providerFailure(res, error, attempt = null) {
  const status = error instanceof ProviderError && error.status === 409 ? 409 : 502
  return res.status(status).json({ ok: false, error: safeErrorMessage(error), attempt })
}

function databaseFailure(res, error) {
  return res.status(502).json({ ok: false, error: error?.message || 'Marketing publish record could not be updated.' })
}

class ProviderError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
