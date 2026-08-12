/* global process */

import { createClient } from '@supabase/supabase-js'

const ACTIONS = ['accept', 'reject']
const CODE_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const missingEnv = getMissingEnv()
  if (missingEnv.length) {
    return res.status(500).json({
      ok: false,
      error: `Missing draft-review environment variables: ${missingEnv.join(', ')}`,
    })
  }

  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ ok: false, error: 'Authentication required.' })

  const body = parseRequestBody(req.body)
  const validationError = validatePayload(body)
  if (validationError) return res.status(400).json({ ok: false, error: validationError })

  const client = createServiceClient()
  const authenticated = await client.auth.getUser(token)
  const user = authenticated.data?.user
  if (authenticated.error || !user) {
    return res.status(401).json({ ok: false, error: 'The session is invalid or expired.' })
  }

  const reviewed = await client.rpc('review_generated_draft', {
    p_run_id: body.run_id,
    p_actor_user_id: user.id,
    p_action: body.action,
    p_feedback: normalizeOptionalText(body.feedback),
    p_campaign_id: body.action === 'accept' ? body.campaign_id : null,
    p_code: body.action === 'accept' ? body.code.trim().toUpperCase() : null,
    p_working_title: body.action === 'accept' ? body.working_title.trim() : null,
    p_draft_text: body.action === 'accept' ? body.draft_text.trim() : null,
  })

  if (reviewed.error) {
    if (reviewed.error.code === '23505') {
      return res.status(409).json({
        ok: false,
        error: 'That variant code already exists in this workspace. Choose a different code.',
      })
    }
    return res.status(400).json({
      ok: false,
      error: reviewed.error.message || 'Generated draft review failed.',
    })
  }

  return res.status(200).json({ ok: true, ...reviewed.data })
}

function createServiceClient() {
  return createClient(
    process.env.GENERATION_SUPABASE_URL,
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function getMissingEnv() {
  const missing = []
  if (!process.env.GENERATION_SUPABASE_URL) missing.push('GENERATION_SUPABASE_URL')
  if (!process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('GENERATION_SUPABASE_SERVICE_ROLE_KEY')
  }
  return missing
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
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof body === 'object' && !Array.isArray(body) ? body : {}
}

function validatePayload(body) {
  if (!body.run_id) return 'run_id is required.'
  if (!ACTIONS.includes(body.action)) return 'action must be accept or reject.'
  if (body.feedback && (typeof body.feedback !== 'string' || body.feedback.length > 2000)) {
    return 'feedback must be 2000 characters or fewer.'
  }
  if (body.action === 'reject') return ''
  if (!body.campaign_id) return 'campaign_id is required when accepting a draft.'
  if (typeof body.code !== 'string' || !CODE_PATTERN.test(body.code.trim().toUpperCase())) {
    return 'code must contain uppercase letters, numbers, and single hyphens only.'
  }
  if (typeof body.working_title !== 'string' || !body.working_title.trim()) {
    return 'working_title is required when accepting a draft.'
  }
  if (body.working_title.trim().length > 200) return 'working_title must be 200 characters or fewer.'
  if (typeof body.draft_text !== 'string' || !body.draft_text.trim()) {
    return 'draft_text is required when accepting a draft.'
  }
  if (body.draft_text.trim().length > 20000) return 'draft_text must be 20000 characters or fewer.'
  return ''
}

function normalizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() || null : null
}
