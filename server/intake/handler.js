import { Buffer } from 'node:buffer'
import process from 'node:process'
import { createHash } from 'node:crypto'
import { readConfigs } from './configs.js'
import { MAX_BYTES, validateAnswers, summarize, hasAnswer } from '../../src/lib/intake/model.js'
import { getFromEmail, sendResendEmail } from '../../api/lib/resend.js'
// Best-effort per warm instance; no answers or raw IP addresses are retained.
const attempts = new Map()
const WINDOW = 15 * 60 * 1000
export function allowAttempt(ip, now = Date.now()) {
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key)
  const key = createHash('sha256').update(ip).digest('hex')
  const entry = attempts.get(key) ?? { count: 0, until: now + WINDOW }
  if (entry.count >= 5 || (!attempts.has(key) && attempts.size >= 10000)) return false
  entry.count++; attempts.set(key, entry); return true
}
export default async function intakeHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'Method not allowed' }) }
  if (Number(req.headers?.['content-length']) > MAX_BYTES) return res.status(413).json({ ok: false, error: 'Answers are too large. Please shorten them and try again.' })
  let payload
  try { const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body); if (!raw || Buffer.byteLength(raw) > MAX_BYTES) return res.status(413).json({ ok: false, error: 'Answers are too large.' }); payload = JSON.parse(raw) } catch { return res.status(400).json({ ok: false, error: 'Invalid answers.' }) }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return res.status(400).json({ ok: false, error: 'Invalid answers.' })
  const ip = process.env.VERCEL ? String(req.headers?.['x-vercel-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown').split(',')[0].trim() : req.socket?.remoteAddress ?? 'local'
  if (!allowAttempt(ip)) { res.setHeader('Retry-After', '900'); return res.status(429).json({ ok: false, error: 'Too many attempts. Please wait 15 minutes or copy/download your answers.' }) }
  if (payload.website) return res.status(200).json({ ok: true })
  const config = readConfigs().find(c => c.slug === payload.slug)
  if (!config) return res.status(404).json({ ok: false, error: 'Intake not found.' })
  try { validateAnswers(config, payload.answers) } catch (error) { return res.status(400).json({ ok: false, error: error.message }) }
  if (!payload.answers.services.some(s => hasAnswer(s.fields.status)) && !Object.values(payload.answers.sections).some(s => Object.values(s).some(hasAnswer))) return res.status(400).json({ ok: false, error: 'Please answer at least one question.' })
  const recipient = process.env.INTAKE_NOTIFY_EMAIL
  if (!process.env.RESEND_API_KEY || !getFromEmail() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient ?? '')) return res.status(503).json({ ok: false, error: 'Email is unavailable. Please copy or download your answers for Tulio.' })
  const raw = JSON.stringify({ slug: config.slug, answers: payload.answers }, null, 2)
  try {
    const result = await sendResendEmail({ from: getFromEmail(), to: [recipient], subject: `Intake — ${config.clientName}`, text: summarize(config, payload.answers), attachments: [{ filename: `intake-${config.slug}.json`, content: Buffer.from(raw).toString('base64') }] }, { idempotencyKey: 'intake-' + createHash('sha256').update(recipient + raw).digest('hex') })
    if (result.error) throw new Error('Provider rejected request')
    return res.status(200).json({ ok: true })
  } catch { return res.status(502).json({ ok: false, error: 'Your answers could not be sent. Please copy or download them, or try again.' }) }
}
