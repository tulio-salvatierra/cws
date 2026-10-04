/* global process */

import { createHash, randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { createClient } from '@supabase/supabase-js'
import { handleMarketingAssessment } from '../server/laya/marketing.js'
import {
  ASSET_AGENT_KEY,
  buildImageInstructions,
  CREATIVE_IMAGE_BUCKET,
  extractImageBase64,
  extractOutputText,
  findStoryIdea,
  imagePrompt,
  normalizeStoryIdeas,
  STORY_IDEA_AGENT_KEY,
  STORY_IDEA_SCHEMA,
  storyIdeaInstructions,
} from '../server/marketing/creative.js'

const DEFAULT_TEXT_MODEL = 'gpt-5.6'
const DEFAULT_IMAGE_MODEL = 'gpt-5.6'
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  if (getMissingDatabaseEnv().length) return res.status(503).json({ ok: false, error: 'Marketing creative is not configured.' })

  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Authentication required.' })
  const client = createServiceClient()
  const context = await getOwnerContext(client, token)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })

  if (req.method === 'GET' && new URL(req.url || '/', 'http://localhost').searchParams.get('feature') === 'laya') return handleMarketingAssessment(req, res, client, context)
  if (req.method === 'GET') return getCreativeStatus(res, client, context)

  const body = parseRequestBody(req.body)
  if (['assess_marketing_asset', 'review_laya_assessment'].includes(body.action)) return handleMarketingAssessment(req, res, client, context, body)
  if (body.action === 'generate_story_ideas') return generateStoryIdeas(res, client, context, body)
  if (body.action === 'generate_visual_draft') return generateVisualDraft(res, client, context, body)
  if (body.action === 'approve_visual_draft') return approveVisualDraft(res, client, context, body)
  return res.status(400).json({ ok: false, error: 'Unknown Marketing creative action.' })
}

async function getCreativeStatus(res, client, context) {
  const [runs, assets] = await Promise.all([
    client.from('agent_runs')
      .select('id, agent_key, status, input, output, error_message, created_at, updated_at')
      .eq('workspace_id', context.workspaceId)
      .eq('agent_key', STORY_IDEA_AGENT_KEY)
      .order('created_at', { ascending: false })
      .limit(24),
    client.from('marketing_creative_assets')
      .select('*')
      .eq('workspace_id', context.workspaceId)
      .order('created_at', { ascending: false })
      .limit(48),
  ])
  const failure = [runs, assets].find(result => result.error)
  if (failure) return databaseFailure(res, failure.error)

  const serializedAssets = await Promise.all((assets.data || []).map(asset => serializeCreativeAsset(client, asset)))
  return res.status(200).json({
    ok: true,
    idea_runs: (runs.data || []).map(serializeIdeaRun),
    creative_assets: serializedAssets,
  })
}

async function generateStoryIdeas(res, client, context, body) {
  if (getMissingOpenAiEnv().length) return res.status(503).json({ ok: false, error: 'Marketing creative requires server-side OpenAI configuration.' })
  const offerId = optionalUuid(body.offer_id)
  const requestKey = optionalUuid(body.request_key)
  if (!offerId || !requestKey) return res.status(400).json({ ok: false, error: 'A valid offer and generation request are required.' })

  const offer = await getOffer(client, context.workspaceId, offerId)
  if (offer.error) return databaseFailure(res, offer.error)
  if (!offer.data || offer.data.status === 'retired') return res.status(404).json({ ok: false, error: 'That offer is not available for Marketing creative.' })

  const existing = await findRunByRequestKey(client, context.workspaceId, STORY_IDEA_AGENT_KEY, requestKey)
  if (existing.error) return databaseFailure(res, existing.error)
  if (existing.data) return res.status(200).json({ ok: true, replayed: true, run: serializeIdeaRun(existing.data) })

  const queued = await queueRun(client, context, {
    agentKey: STORY_IDEA_AGENT_KEY,
    input: { request_key: requestKey, offer_id: offer.data.id, offer_snapshot: offerSnapshot(offer.data) },
  })
  if (queued.error) {
    if (queued.error.code === '23505') {
      const replay = await findRunByRequestKey(client, context.workspaceId, STORY_IDEA_AGENT_KEY, requestKey)
      if (replay.error) return databaseFailure(res, replay.error)
      if (replay.data) return res.status(200).json({ ok: true, replayed: true, run: serializeIdeaRun(replay.data) })
    }
    return databaseFailure(res, queued.error)
  }

  const running = await updateRun(client, queued.data.id, { status: 'running' })
  if (running.error) return databaseFailure(res, running.error)

  try {
    const generated = await requestStoryIdeas({ offer: offer.data, userId: context.userId })
    const reviewed = await updateRun(client, queued.data.id, {
      status: 'needs_review',
      output: { ...generated, offer_id: offer.data.id, generated_at: new Date().toISOString() },
      error_message: null,
    })
    if (reviewed.error) return databaseFailure(res, reviewed.error)
    return res.status(201).json({ ok: true, run: serializeIdeaRun(reviewed.data) })
  } catch (error) {
    const failed = await updateRun(client, queued.data.id, { status: 'failed', output: null, error_message: safeErrorMessage(error) })
    if (failed.error) return databaseFailure(res, failed.error)
    return res.status(502).json({ ok: false, error: safeErrorMessage(error), run_id: queued.data.id })
  }
}

async function generateVisualDraft(res, client, context, body) {
  if (getMissingOpenAiEnv().length) return res.status(503).json({ ok: false, error: 'Marketing creative requires server-side OpenAI configuration.' })
  const ideaRunId = optionalUuid(body.idea_run_id)
  const requestKey = optionalUuid(body.request_key)
  const ideaId = typeof body.idea_id === 'string' && /^idea-[1-9][0-9]*$/.test(body.idea_id) ? body.idea_id : ''
  if (!ideaRunId || !requestKey || !ideaId) return res.status(400).json({ ok: false, error: 'A valid approved idea and visual-draft request are required.' })

  const ideaRun = await client.from('agent_runs').select('*')
    .eq('id', ideaRunId).eq('workspace_id', context.workspaceId).eq('agent_key', STORY_IDEA_AGENT_KEY).maybeSingle()
  if (ideaRun.error) return databaseFailure(res, ideaRun.error)
  const idea = findStoryIdea(ideaRun.data?.output, ideaId)
  const offerId = optionalUuid(ideaRun.data?.input?.offer_id)
  if (!idea || !offerId) return res.status(409).json({ ok: false, error: 'That Story idea is not available for visual generation.' })

  const offer = await getOffer(client, context.workspaceId, offerId)
  if (offer.error) return databaseFailure(res, offer.error)
  if (!offer.data || offer.data.status === 'retired') return res.status(409).json({ ok: false, error: 'That offer is no longer available for Marketing creative.' })

  const existingRun = await findRunByRequestKey(client, context.workspaceId, ASSET_AGENT_KEY, requestKey)
  if (existingRun.error) return databaseFailure(res, existingRun.error)
  if (existingRun.data) return res.status(200).json({ ok: true, replayed: true, run_id: existingRun.data.id })

  const queued = await queueRun(client, context, {
    agentKey: ASSET_AGENT_KEY,
    input: {
      request_key: requestKey,
      offer_id: offer.data.id,
      idea_run_id: ideaRunId,
      idea_id: idea.id,
      idea_snapshot: idea,
      offer_snapshot: offerSnapshot(offer.data),
      format: 'feed-4x5',
    },
  })
  if (queued.error) {
    if (queued.error.code === '23505') {
      const replay = await findRunByRequestKey(client, context.workspaceId, ASSET_AGENT_KEY, requestKey)
      if (replay.error) return databaseFailure(res, replay.error)
      if (replay.data) return res.status(200).json({ ok: true, replayed: true, run_id: replay.data.id })
    }
    return databaseFailure(res, queued.error)
  }

  const reserved = await reserveCreativeAsset(client, context, { offerId, ideaRunId, ideaId, assetRunId: queued.data.id })
  if (reserved.error) {
    await updateRun(client, queued.data.id, { status: 'superseded' })
    return databaseFailure(res, reserved.error)
  }
  if (reserved.replayed) {
    await updateRun(client, queued.data.id, { status: 'superseded' })
    return res.status(200).json({ ok: true, replayed: true, creative_asset: await serializeCreativeAsset(client, reserved.data) })
  }

  const running = await updateRun(client, queued.data.id, { status: 'running' })
  if (running.error) return databaseFailure(res, running.error)

  try {
    const generated = await requestImage({ offer: offer.data, idea, userId: context.userId })
    const bytes = Buffer.from(generated.base64, 'base64')
    if (!bytes.length || bytes.length > MAX_RESPONSE_BYTES) throw new Error('Generated image exceeded the allowed size.')
    const uploaded = await client.storage.from(CREATIVE_IMAGE_BUCKET).upload(reserved.data.storage_object_path, bytes, {
      contentType: 'image/png',
      upsert: false,
    })
    if (uploaded.error) throw new Error('Marketing visual draft storage failed.')

    const ready = await client.from('marketing_creative_assets').update({ status: 'ready', failure_message: null })
      .eq('id', reserved.data.id).eq('workspace_id', context.workspaceId).select('*').single()
    if (ready.error) return databaseFailure(res, ready.error)
    const reviewed = await updateRun(client, queued.data.id, {
      status: 'needs_review',
      output: { creative_asset_id: ready.data.id, format: 'feed-4x5', model: generated.model, response_id: generated.responseId, generated_at: new Date().toISOString() },
      error_message: null,
    })
    if (reviewed.error) return databaseFailure(res, reviewed.error)
    return res.status(201).json({ ok: true, creative_asset: await serializeCreativeAsset(client, ready.data) })
  } catch (error) {
    const message = safeErrorMessage(error)
    await client.from('marketing_creative_assets').update({ status: 'failed', failure_message: message })
      .eq('id', reserved.data.id).eq('workspace_id', context.workspaceId)
    const failed = await updateRun(client, queued.data.id, { status: 'failed', output: null, error_message: message })
    if (failed.error) return databaseFailure(res, failed.error)
    return res.status(502).json({ ok: false, error: message, creative_asset_id: reserved.data.id })
  }
}

async function approveVisualDraft(res, client, context, body) {
  const assetId = optionalUuid(body.creative_asset_id)
  const caption = optionalText(body.caption)
  if (!assetId || !caption || caption.length > 3_000) return res.status(400).json({ ok: false, error: 'A valid visual draft and caption are required.' })
  if (!['linkedin_compatible', 'facebook_compatible', 'instagram_compatible'].every(key => body[key] === true)) {
    return res.status(400).json({ ok: false, error: 'Confirm compatibility with LinkedIn, Facebook, and Instagram before adding this image to the evergreen library.' })
  }

  const locked = await client.from('marketing_creative_assets').update({ status: 'approving' })
    .eq('id', assetId).eq('workspace_id', context.workspaceId).eq('status', 'ready').select('*').maybeSingle()
  if (locked.error) return databaseFailure(res, locked.error)
  if (!locked.data) {
    const current = await client.from('marketing_creative_assets').select('*').eq('id', assetId).eq('workspace_id', context.workspaceId).maybeSingle()
    if (current.error) return databaseFailure(res, current.error)
    if (current.data?.status === 'approved') return res.status(200).json({ ok: true, replayed: true, creative_asset: await serializeCreativeAsset(client, current.data) })
    return res.status(409).json({ ok: false, error: 'That visual draft is not ready to add to the evergreen library.' })
  }

  try {
    const media = await client.from('offer_media').insert({
      workspace_id: context.workspaceId,
      offer_id: locked.data.offer_id,
      storage_path: null,
      media_source: 'generated',
      storage_bucket: locked.data.storage_bucket,
      storage_object_path: locked.data.storage_object_path,
      source_agent_run_id: locked.data.asset_run_id,
      linkedin_compatible: true,
      facebook_compatible: true,
      instagram_compatible: true,
      status: 'active',
      created_by: context.userId,
    }).select('*').single()
    if (media.error) throw new Error('The generated image could not be added to the offer library.')

    const savedCaption = await client.from('offer_captions').insert({
      workspace_id: context.workspaceId,
      offer_id: locked.data.offer_id,
      locale: 'en',
      body: caption,
      status: 'active',
      created_by: context.userId,
    }).select('*').single()
    if (savedCaption.error) {
      await client.from('offer_media').update({ status: 'retired' }).eq('id', media.data.id).eq('workspace_id', context.workspaceId)
      throw new Error('The generated caption could not be added to the offer library.')
    }

    const approved = await client.from('marketing_creative_assets').update({
      status: 'approved',
      approved_media_id: media.data.id,
      approved_caption_id: savedCaption.data.id,
    }).eq('id', locked.data.id).eq('workspace_id', context.workspaceId).select('*').single()
    if (approved.error) throw new Error('The visual draft could not be finalized.')
    return res.status(200).json({ ok: true, creative_asset: await serializeCreativeAsset(client, approved.data) })
  } catch (error) {
    await client.from('marketing_creative_assets').update({ status: 'ready' }).eq('id', locked.data.id).eq('workspace_id', context.workspaceId).eq('status', 'approving')
    return res.status(502).json({ ok: false, error: safeErrorMessage(error) })
  }
}

async function reserveCreativeAsset(client, context, { offerId, ideaRunId, ideaId, assetRunId }) {
  const id = randomUUID()
  const inserted = await client.from('marketing_creative_assets').insert({
    id,
    workspace_id: context.workspaceId,
    offer_id: offerId,
    idea_run_id: ideaRunId,
    idea_id: ideaId,
    asset_run_id: assetRunId,
    storage_bucket: CREATIVE_IMAGE_BUCKET,
    storage_object_path: `generated/${context.workspaceId}/${id}.png`,
    status: 'generating',
    created_by: context.userId,
  }).select('*').single()
  if (!inserted.error) return { data: inserted.data, error: null, replayed: false }
  if (inserted.error.code !== '23505') return { data: null, error: inserted.error, replayed: false }

  const existing = await client.from('marketing_creative_assets').select('*')
    .eq('workspace_id', context.workspaceId).eq('idea_run_id', ideaRunId).eq('idea_id', ideaId).maybeSingle()
  if (existing.error || !existing.data) return { data: null, error: existing.error || inserted.error, replayed: false }

  // A failed agent run remains the durable audit record. A later explicit
  // owner retry reuses this one candidate asset, but receives a fresh private
  // object path so a partial upload can never collide with the retry.
  if (existing.data.status === 'failed') {
    const nextObjectId = randomUUID()
    const retried = await client.from('marketing_creative_assets').update({
      asset_run_id: assetRunId,
      storage_object_path: `generated/${context.workspaceId}/${nextObjectId}.png`,
      status: 'generating',
      failure_message: null,
    }).eq('id', existing.data.id).eq('workspace_id', context.workspaceId).eq('status', 'failed').select('*').maybeSingle()
    if (retried.error) return { data: null, error: retried.error, replayed: false }
    if (retried.data) return { data: retried.data, error: null, replayed: false }
  }
  return { data: existing.data, error: null, replayed: true }
}

async function requestStoryIdeas({ offer, userId }) {
  const model = process.env.OPENAI_MARKETING_TEXT_MODEL || process.env.OPENAI_GENERATION_MODEL || DEFAULT_TEXT_MODEL
  const response = await openAiRequest({
    model,
    max_output_tokens: 2_400,
    instructions: storyIdeaInstructions(),
    input: JSON.stringify({ offer: offerSnapshot(offer) }),
    text: { format: { type: 'json_schema', name: 'marketing_story_ideas', strict: true, schema: STORY_IDEA_SCHEMA } },
    safety_identifier: safetyIdentifier(userId),
  })
  const text = extractOutputText(response.payload)
  let parsed = null
  try { parsed = JSON.parse(text) } catch { throw new Error('OpenAI returned invalid Story-idea JSON.') }
  const output = normalizeStoryIdeas(parsed)
  if (!output) throw new Error('OpenAI returned Story ideas outside the required evidence and format limits.')
  return { ...output, model: response.payload.model || model, response_id: response.payload.id || null }
}

async function requestImage({ offer, idea, userId }) {
  const model = process.env.OPENAI_MARKETING_IMAGE_MODEL || DEFAULT_IMAGE_MODEL
  const response = await openAiRequest({
    model,
    instructions: buildImageInstructions(),
    input: imagePrompt({ offer, idea }),
    tools: [{ type: 'image_generation', size: '1024x1280', quality: 'medium', output_format: 'png' }],
    safety_identifier: safetyIdentifier(userId),
  })
  const base64 = extractImageBase64(response.payload)
  if (!base64) throw new Error('OpenAI did not return a generated image.')
  return { base64, model: response.payload.model || model, responseId: response.payload.id || null }
}

async function openAiRequest(body) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    signal: AbortSignal.timeout(60_000),
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, store: false }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error?.message || 'OpenAI Marketing creative generation failed.')
  return { payload }
}

async function serializeCreativeAsset(client, asset) {
  let previewUrl = null
  if (['ready', 'approving', 'approved'].includes(asset.status)) {
    const signed = await client.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_object_path, 60 * 60)
    previewUrl = signed.error ? null : signed.data?.signedUrl || null
  }
  return {
    id: asset.id,
    offer_id: asset.offer_id,
    idea_run_id: asset.idea_run_id,
    idea_id: asset.idea_id,
    asset_run_id: asset.asset_run_id,
    status: asset.status,
    failure_message: asset.failure_message || null,
    preview_url: previewUrl,
    approved_media_id: asset.approved_media_id || null,
    approved_caption_id: asset.approved_caption_id || null,
    created_at: asset.created_at,
    updated_at: asset.updated_at,
  }
}

function serializeIdeaRun(run) {
  return {
    id: run.id,
    offer_id: optionalUuid(run.input?.offer_id),
    status: run.status,
    output: normalizeStoryIdeas(run.output),
    error_message: run.error_message || null,
    created_at: run.created_at,
    updated_at: run.updated_at,
  }
}

function offerSnapshot(offer) {
  return {
    name: optionalText(offer?.name),
    description: optionalText(offer?.description),
    price_display: offer?.price_display_override || null,
    default_project_type: offer?.default_project_type || null,
  }
}

async function getOffer(client, workspaceId, offerId) {
  return client.from('offers').select('*').eq('id', offerId).eq('workspace_id', workspaceId).maybeSingle()
}

async function queueRun(client, context, { agentKey, input }) {
  return client.from('agent_runs').insert({
    workspace_id: context.workspaceId,
    command_level: 'propose',
    agent_key: agentKey,
    status: 'queued',
    input,
    created_by: context.userId,
  }).select('*').single()
}

async function updateRun(client, id, values) {
  return client.from('agent_runs').update(values).eq('id', id).select('*').single()
}

async function findRunByRequestKey(client, workspaceId, agentKey, requestKey) {
  return client.from('agent_runs').select('*')
    .eq('workspace_id', workspaceId).eq('agent_key', agentKey).contains('input', { request_key: requestKey }).maybeSingle()
}

async function getOwnerContext(client, token) {
  const authenticated = await client.auth.getUser(token)
  const user = authenticated.data?.user
  if (authenticated.error || !user) return { error: 'The session is invalid or expired.', status: 401 }
  const membership = await client.from('workspace_members').select('workspace_id, role')
    .eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: true }).limit(1).maybeSingle()
  if (membership.error) return { error: 'Marketing creative access could not be verified.', status: 502 }
  if (!membership.data || membership.data.role !== 'owner') return { error: 'An active workspace owner must prepare Marketing creative.', status: 403 }
  return { workspaceId: membership.data.workspace_id, userId: user.id }
}

function getMissingDatabaseEnv() { return ['GENERATION_SUPABASE_URL', 'GENERATION_SUPABASE_SERVICE_ROLE_KEY'].filter(name => !process.env[name]?.trim()) }
function getMissingOpenAiEnv() { return process.env.OPENAI_API_KEY?.trim() ? [] : ['OPENAI_API_KEY'] }
function createServiceClient() { return createClient(process.env.GENERATION_SUPABASE_URL, process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }) }
function getBearerToken(req) { const value = req.headers?.authorization; return typeof value === 'string' ? value.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '' : '' }
function parseRequestBody(body) { if (!body) return {}; if (typeof body !== 'string') return isPlainObject(body) ? body : {}; try { const parsed = JSON.parse(body); return isPlainObject(parsed) ? parsed : {} } catch { return {} } }
function isPlainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
function optionalUuid(value) { return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null }
function optionalText(value) { return typeof value === 'string' && value.trim() ? value.trim() : '' }
function safetyIdentifier(userId) { return createHash('sha256').update(String(userId)).digest('hex') }
function safeErrorMessage(error) { const message = error instanceof Error ? error.message.trim() : ''; return message && message.length <= 500 ? message : 'Marketing creative generation failed.' }
function databaseFailure(res, error) { return res.status(502).json({ ok: false, error: error?.message || 'Marketing creative storage failed.' }) }
