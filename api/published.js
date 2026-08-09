/* global process */

import { createHash, timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export const PUBLISHED_SECRET_HEADER = 'x-published-webhook-secret'
export const PUBLISHED_PLATFORMS = [
  'instagram',
  'facebook',
  'x',
  'linkedin',
  'pinterest',
  'whatsapp',
  'youtube',
]

const PUBLISHED_SOURCES = ['manual', 'n8n', 'cws-os']
const OUTCOME_SCORES = ['worked', 'flat', 'flopped']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const missingEnv = getMissingEnv()
  if (missingEnv.length) {
    return res.status(500).json({
      ok: false,
      error: `Missing published-post environment variables: ${missingEnv.join(', ')}`,
    })
  }

  const suppliedSecret = getHeader(req, PUBLISHED_SECRET_HEADER)
  if (!secretsMatch(suppliedSecret, process.env.PUBLISHED_WEBHOOK_SECRET)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const body = parseRequestBody(req.body)
  const validationError = validatePayload(body)
  if (validationError) {
    return res.status(400).json({ ok: false, error: validationError })
  }

  const workspaceId = body.workspace_id || process.env.PUBLISHED_WORKSPACE_ID
  if (!workspaceId) {
    return res.status(400).json({
      ok: false,
      error: 'workspace_id is required when PUBLISHED_WORKSPACE_ID is not configured.',
    })
  }

  const client = createServiceClient()
  const externalPostId = normalizeOptionalText(body.external_post_id)

  if (externalPostId) {
    const existing = await findExistingRecord(client, body.platform, externalPostId)
    if (existing.error) return databaseError(res, existing.error)
    if (existing.data) {
      return res.status(200).json({
        ok: true,
        created: false,
        id: existing.data.id,
        record: existing.data,
      })
    }
  }

  const insertPayload = buildInsertPayload(body, workspaceId, externalPostId)
  const created = await client.from('published_posts').insert(insertPayload).select('*').single()

  if (created.error?.code === '23505' && externalPostId) {
    const existing = await findExistingRecord(client, body.platform, externalPostId)
    if (existing.error || !existing.data) return databaseError(res, existing.error || created.error)
    return res.status(200).json({
      ok: true,
      created: false,
      id: existing.data.id,
      record: existing.data,
    })
  }

  if (created.error) return databaseError(res, created.error)

  return res.status(201).json({
    ok: true,
    created: true,
    id: created.data.id,
    record: created.data,
  })
}

function createServiceClient() {
  return createClient(
    process.env.PUBLISHED_SUPABASE_URL,
    process.env.PUBLISHED_SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}

function getMissingEnv() {
  const missing = []
  if (!process.env.PUBLISHED_SUPABASE_URL) missing.push('PUBLISHED_SUPABASE_URL')
  if (!process.env.PUBLISHED_SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('PUBLISHED_SUPABASE_SERVICE_ROLE_KEY')
  }
  if (!process.env.PUBLISHED_WEBHOOK_SECRET) missing.push('PUBLISHED_WEBHOOK_SECRET')
  return missing
}

function getHeader(req, name) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

function secretsMatch(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string' || !actual || !expected) {
    return false
  }

  const actualDigest = createHash('sha256').update(actual).digest()
  const expectedDigest = createHash('sha256').update(expected).digest()
  return timingSafeEqual(actualDigest, expectedDigest)
}

function parseRequestBody(body) {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof body === 'object' && !Array.isArray(body) ? body : {}
}

function validatePayload(body) {
  if (!body.platform) return 'platform is required.'
  if (!PUBLISHED_PLATFORMS.includes(body.platform)) {
    return `Invalid platform. Accepted values: ${PUBLISHED_PLATFORMS.join(', ')}.`
  }
  if (!body.published_at) return 'published_at is required.'
  if (Number.isNaN(Date.parse(body.published_at))) {
    return 'published_at must be a valid date and time.'
  }
  if (body.source && !PUBLISHED_SOURCES.includes(body.source)) {
    return `Invalid source. Accepted values: ${PUBLISHED_SOURCES.join(', ')}.`
  }
  if (body.outcome_score && !OUTCOME_SCORES.includes(body.outcome_score)) {
    return `Invalid outcome_score. Accepted values: ${OUTCOME_SCORES.join(', ')}.`
  }
  return ''
}

function buildInsertPayload(body, workspaceId, externalPostId) {
  const optionalFields = [
    'channel_id',
    'campaign_id',
    'content_variant_id',
    'external_url',
    'language',
    'outcome_score',
    'outcome_note',
    'outcome_recorded_at',
    'created_by',
  ]
  const payload = {
    workspace_id: workspaceId,
    platform: body.platform,
    external_post_id: externalPostId,
    published_at: body.published_at,
    source: body.source || 'manual',
    raw_payload: body,
  }

  for (const field of optionalFields) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      payload[field] = body[field]
    }
  }

  if (payload.outcome_score && !payload.outcome_recorded_at) {
    payload.outcome_recorded_at = new Date().toISOString()
  }

  return payload
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') return value || null
  return value.trim() || null
}

function findExistingRecord(client, platform, externalPostId) {
  return client
    .from('published_posts')
    .select('*')
    .eq('platform', platform)
    .eq('external_post_id', externalPostId)
    .maybeSingle()
}

function databaseError(res, error) {
  return res.status(502).json({
    ok: false,
    error: error?.message || 'Published-post database request failed.',
  })
}
