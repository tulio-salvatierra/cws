// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import config from '../../../src/content/intake/sherry.json'
import { validateConfig } from '../../../src/lib/intake/schema.js'
import { initialAnswers, serviceFields, summarize, validateAnswers } from '../../../src/lib/intake/model.js'
const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock('../../../api/lib/resend.js', () => ({ getFromEmail: () => 'CWS <sender@example.com>', sendResendEmail: send }))
import handler from '../handler.js'
let count = 0
const makeResponse = () => ({ code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v }, status(code) { this.code = code; return this }, json(body) { this.body = body; return this } })
function request(answers = initialAnswers(config), patch = {}) { return { method: 'POST', headers: {}, socket: { remoteAddress: `test-${++count}` }, body: { slug: config.slug, answers }, ...patch } }
beforeEach(() => { send.mockReset().mockResolvedValue({ data: { id: 'test' }, error: null }); process.env.RESEND_API_KEY = 'test-only'; process.env.INTAKE_NOTIFY_EMAIL = 'owner@example.com' })
describe('intake config and summaries', () => {
  it('validates Sherry and preserves name-only experience prefills', () => { expect(validateConfig(config)).toBe(config); const answers = initialAnswers(config); expect(answers.sections.business.experience[0]).toEqual({ name: 'Manny', years: '', work: '' }); expect(validateAnswers(config, answers)).toBe(answers) })
  it.each(['slug', 'allowAddService', 'serviceFields'])('fails clearly for invalid %s', key => { const copy = structuredClone(config); copy[key] = null; expect(() => validateConfig(copy, 'sherry.json')).toThrow('sherry.json') })
  it('rejects duplicate fields, unknown presets and invalid prefill types', () => { const copy = structuredClone(config); copy.sections[0].fields.push(copy.sections[0].fields[0]); expect(() => validateConfig(copy)).toThrow('duplicate'); const preset = structuredClone(config); preset.services[0].presets.fake = ['x']; expect(() => validateConfig(preset)).toThrow('preset fake'); const prefill = structuredClone(config); prefill.sections[0].fields[4].prefill = 42; expect(() => validateConfig(prefill)).toThrow('prefill') })
  it('renders ordered steps and experience without empty fields; unsure comes last', () => {
    const answers = initialAnswers(config); const s = answers.services[0]; s.fields.status = { selected: ['Later'], other: '', added: [], notSure: false }; s.fields.steps.order = [...s.fields.steps.selected].reverse(); s.fields.equipment = { selected: [], other: '', added: [], notSure: true }; const summary = summarize(config, answers)
    expect(summary).toContain('- Name: Manny'); expect(summary).not.toContain('Years:'); expect(summary).toContain('- 1. Place service sticker'); expect(summary).toContain('Still deciding: Equipment you use'); expect(summary.indexOf('Service status:')).toBeLessThan(summary.indexOf('Steps you perform:')); expect(summary).not.toContain('Website phone:')
  })
  it('rejects forged fields, options, missing services and custom services when disabled', () => {
    const a = initialAnswers(config); a.services[0].fields.status.selected = ['Invented']; expect(() => validateAnswers(config, a)).toThrow('choices')
    const b = initialAnswers(config); b.sections.business.unexpected = 'x'; expect(() => validateAnswers(config, b)).toThrow('section')
    const c = initialAnswers(config); c.services.pop(); expect(() => validateAnswers(config, c)).toThrow('Missing')
    const d = initialAnswers(config); d.services.push({ id: 'custom-test', name: 'Custom', fields: {} }); expect(() => validateAnswers({ ...config, allowAddService: false }, d)).toThrow('Unknown service')
  })
  it('does not invent presets for custom services', () => { expect(serviceFields(config).find(f => f.id === 'steps').options).toEqual([]) })
  it('keeps generated intake routing separate from public sitemap and noindex', () => { const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')); expect(vercel.headers.some(h => h.source === '/intake/:path*' && h.headers[0].value.includes('noindex'))).toBe(true); expect(vercel.rewrites.at(-1).source).toContain('intake'); expect(readFileSync('public/sitemap.xml', 'utf8')).not.toContain('/intake') })
})
describe('email boundary', () => {
  it('sends trusted subject and text with raw JSON attachment to env recipient', async () => { const req = request(); const res = makeResponse(); await handler(req, res); expect(res.code).toBe(200); const [mail, options] = send.mock.calls[0]; expect(mail.to).toEqual(['owner@example.com']); expect(mail.subject).toBe('Intake — Your new cleaning company'); expect(mail.text).toBe(summarize(config, req.body.answers)); expect(JSON.parse(Buffer.from(mail.attachments[0].content, 'base64').toString()).answers).toEqual(req.body.answers); expect(options.idempotencyKey).toMatch(/^intake-/) })
  it('does not send on GET, honeypot, malformed or unknown slug', async () => { for (const patch of [{ method: 'GET' }, { body: { website: 'bot' } }, { body: '{' }, { body: { slug: 'missing' } }]) await handler(request(undefined, patch), makeResponse()); expect(send).not.toHaveBeenCalled() })
  it('caps both declared and actual bytes', async () => { for (const patch of [{ headers: { 'content-length': '100001' } }, { body: 'x'.repeat(100001) }]) { const res = makeResponse(); await handler(request(undefined, patch), res); expect(res.code).toBe(413) } expect(send).not.toHaveBeenCalled() })
  it('limits repeated IP attempts and ignores arbitrary x-forwarded-for locally', async () => { const socket = { remoteAddress: `rate-${++count}` }; for (let i = 0; i < 6; i++) { const res = makeResponse(); await handler(request(undefined, { socket, headers: { 'x-forwarded-for': String(i) } }), res); expect(res.code).toBe(i < 5 ? 200 : 429) } expect(send).toHaveBeenCalledTimes(5) })
  it('fails closed when recipient is absent and exposes a fallback on provider failure', async () => { delete process.env.INTAKE_NOTIFY_EMAIL; const res = makeResponse(); await handler(request(), res); expect(res.code).toBe(503); expect(send).not.toHaveBeenCalled(); process.env.INTAKE_NOTIFY_EMAIL = 'owner@example.com'; send.mockResolvedValue({ error: { message: 'secret provider details' } }); const bad = makeResponse(); await handler(request(), bad); expect(bad.code).toBe(502); expect(bad.body.error).not.toContain('secret'); expect(bad.body.error).toContain('copy') })
})
