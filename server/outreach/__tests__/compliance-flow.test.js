/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ context: null, send: vi.fn() }))
vi.mock('../shared.js', async (original) => ({ ...(await original()), authenticateOwner: vi.fn(async () => mocks.context), createOutreachClient: vi.fn(() => mocks.context.client), missingOutreachEnv: vi.fn(() => []) }))
vi.mock('../../../api/lib/resend.js', () => ({ getFromEmail: () => 'Cicero Web Studio <test@example.com>', sendResendEmail: mocks.send }))
import draftHandler from '../draft.js'
import sendHandler from '../send.js'
import unsubscribeHandler from '../unsubscribe.js'
import suppressHandler from '../suppress.js'
import mailingHandler from '../mailing-list-send.js'
import { commercialBody, emailPreference, isEmailSuppressed } from '../compliance.js'
import { createSalesConfirmationToken } from '../shared.js'

const leadId = '11111111-1111-4111-8111-111111111111'
const preferenceId = '22222222-2222-4222-8222-222222222222'
const subscriberId = '33333333-3333-4333-8333-333333333333'
function response() { const res = { status: vi.fn(() => res), json: vi.fn((body) => { res.body = body; return res }), setHeader: vi.fn() }; return res }
async function call(handler, body, method = 'POST', query = {}) { const res = response(); await handler({ method, body, query }, res); return res }

// A constrained Supabase fake executes filters and persistence, so tests traverse
// the actual draft/sign/send/opt-out handlers without credentials or network calls.
function database() {
  const tables = {
    leads: [{ id: leadId, workspace_id: 'workspace', email: 'Person@Example.com', name: 'Person', company: 'Example', status: 'contacted' }],
    email_templates: [{ id: 'template', workspace_id: 'workspace', type: 'intro', lang: 'en', subject: 'An idea for {{company}}', body: 'Hello {{name}}.' }, { id: 'newsletter', workspace_id: 'workspace', type: 'mailing_list', lang: 'en', subject: 'Studio update', body: 'Hello {{name}}.\n\nUnsubscribe: {{unsubscribe_url}}' }],
    mailing_list_subscribers: [{ id: subscriberId, workspace_id: 'workspace', email: 'person@example.com', name: 'Person', unsubscribed_at: null }],
    outreach_email_preferences: [], outreach_sends: [],
  }
  const client = { from(table) {
    const filters = []; let operation; let values; let options; let one = false
    const q = {
      select: () => q, eq: (key, value) => { filters.push((row) => row[key] === value); return q },
      is: (key, value) => { filters.push((row) => (row[key] ?? null) === value); return q },
      in: (key, list) => { filters.push((row) => list.includes(row[key])); return q }, limit: () => q,
      insert: (v) => { operation = 'insert'; values = v; return q },
      upsert: (v, o) => { operation = 'upsert'; values = v; options = o; return q },
      update: (v) => { operation = 'update'; values = v; return q },
      single: () => { one = true; return q }, maybeSingle: () => { one = true; return q },
      then(resolve, reject) { return Promise.resolve().then(() => {
        let rows = tables[table].filter((row) => filters.every((filter) => filter(row)))
        if (operation === 'insert' || operation === 'upsert') {
          const existing = operation === 'upsert' && tables[table].find((row) => row.workspace_id === values.workspace_id && row.email === values.email)
          if (existing && !options?.ignoreDuplicates) Object.assign(existing, values)
          if (!existing) { const row = { id: table === 'outreach_email_preferences' ? preferenceId : `send-${tables[table].length}`, unsubscribed_at: null, ...values }; tables[table].push(row); rows = [row] }
          else rows = [existing]
        }
        if (operation === 'update') rows.forEach((row) => Object.assign(row, values))
        return { data: one ? rows[0] || null : rows, error: null }
      }).then(resolve, reject) },
    }; return q
  } }
  return { tables, client }
}
let db
beforeEach(() => {
  vi.stubEnv('OUTREACH_POSTAL_ADDRESS', '123 Test Street, Example, IL 60000')
  vi.stubEnv('GENERATION_SUPABASE_SERVICE_ROLE_KEY', 'test-only-signing-secret')
  db = database(); mocks.context = { client: db.client, workspaceId: 'workspace', user: { id: 'owner' } }
  mocks.send.mockReset().mockResolvedValue({ data: { id: 'mock-provider-id' }, error: null })
})
const prepare = () => call(draftHandler, { lead_id: leadId, template_id: 'template' })
const send = (draft) => call(sendHandler, { lead_id: leadId, template_id: 'template', send_type: 'intro', subject: draft.subject, body: draft.body, owner_confirmation_token: draft.owner_confirmation_token })

describe('commercial email opt-out and exact-draft flow (no real emails)', () => {
  it('renders the full footer before signing, sends exactly reviewed text, and deduplicates retries', async () => {
    const draft = (await prepare()).body
    expect(draft.body).toContain('Commercial email from Cicero Web Studio.')
    expect(draft.body).toContain('123 Test Street')
    expect(draft.body).toContain(`?token=${preferenceId}`)
    expect((await send(draft)).status).toHaveBeenCalledWith(201)
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ subject: draft.subject, text: draft.body, to: ['Person@Example.com'] }), expect.anything())
    await send(draft)
    expect(mocks.send).toHaveBeenCalledTimes(1)
  })
  it.each(['body', 'subject'])('rejects editing %s after confirmation', async (field) => {
    const draft = (await prepare()).body
    draft[field] += ' changed'
    expect((await send(draft)).status).toHaveBeenCalledWith(403)
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it('rejects a signed draft with its footer removed and an unresolved subject', async () => {
    await prepare()
    const values = { leadId, recipient: 'Person@Example.com', templateId: 'template', sendType: 'intro', subject: 'Hi', body: 'No footer' }
    const token = createSalesConfirmationToken(mocks.context, values)
    expect((await send({ ...values, owner_confirmation_token: token })).status).toHaveBeenCalledWith(400)
    expect(mocks.send).not.toHaveBeenCalled()
    expect((await call(draftHandler, { lead_id: leadId, template_id: 'template', subject: '{{unknown}}' })).status).toHaveBeenCalledWith(400)
  })
  it('GET/reload never opts out; POST persists once and blocks an already-confirmed Sales draft', async () => {
    const draft = (await prepare()).body
    expect((await call(unsubscribeHandler, null, 'GET', { token: preferenceId })).body.ok).toBe(true)
    expect(db.tables.outreach_email_preferences[0].unsubscribed_at).toBeNull()
    expect((await call(unsubscribeHandler, { token: preferenceId })).body.ok).toBe(true)
    const timestamp = db.tables.outreach_email_preferences[0].unsubscribed_at
    await call(unsubscribeHandler, { token: preferenceId })
    expect(db.tables.outreach_email_preferences[0].unsubscribed_at).toBe(timestamp)
    expect((await send(draft)).status).toHaveBeenCalledWith(409)
    expect((await prepare()).status).toHaveBeenCalledWith(409)
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it('supports legacy subscriber links and blocks duplicate leads and mailing-list sends by email', async () => {
    await call(unsubscribeHandler, { subscriber_id: subscriberId })
    expect(await isEmailSuppressed(db.client, 'workspace', ' PERSON@EXAMPLE.COM ')).toBe(true)
    db.tables.leads.push({ ...db.tables.leads[0], id: 'duplicate' })
    expect((await call(draftHandler, { lead_id: 'duplicate', template_id: 'template' })).status).toHaveBeenCalledWith(409)
    expect((await call(mailingHandler, { action: 'prepare', template_id: 'newsletter', subscriber_ids: [subscriberId] })).status).toHaveBeenCalledWith(409)
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it('records a reply opt-out through the owner endpoint and never clears it on re-preparation', async () => {
    expect((await call(suppressHandler, { lead_id: leadId })).body.ok).toBe(true)
    await emailPreference(db.client, 'workspace', 'person@example.com')
    expect(db.tables.outreach_email_preferences[0]).toMatchObject({ reason: 'owner_recorded_opt_out', recorded_by: 'owner', email: 'person@example.com' })
    expect(db.tables.outreach_email_preferences[0].unsubscribed_at).toBeTruthy()
  })
  it('keeps tokens functional after signing-key rotation; rejects bad/unknown links without writes', async () => {
    await prepare()
    vi.stubEnv('GENERATION_SUPABASE_SERVICE_ROLE_KEY', 'rotated-test-secret')
    expect((await call(unsubscribeHandler, { token: preferenceId })).body.ok).toBe(true)
    const count = db.tables.outreach_email_preferences.length
    expect((await call(unsubscribeHandler, { token: 'invalid' })).status).toHaveBeenCalledWith(400)
    expect((await call(unsubscribeHandler, { token: leadId })).status).toHaveBeenCalledWith(400)
    expect(db.tables.outreach_email_preferences).toHaveLength(count)
  })
  it('fails closed without the address or when preference storage is unavailable', async () => {
    vi.stubEnv('OUTREACH_POSTAL_ADDRESS', '')
    expect((await prepare()).status).toHaveBeenCalledWith(503)
    vi.stubEnv('OUTREACH_POSTAL_ADDRESS', '123 Test Street')
    mocks.context.client = { from: (table) => table === 'outreach_email_preferences' ? { upsert: async () => ({ error: { message: 'offline' } }) } : db.client.from(table) }
    expect((await prepare()).status).toHaveBeenCalledWith(503)
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it('rebuilds an edited footer once and rejects stale address configuration after review', async () => {
    const draft = (await prepare()).body
    expect(commercialBody(draft.body, { id: preferenceId })).toBe(draft.body)
    vi.stubEnv('OUTREACH_POSTAL_ADDRESS', '456 Different Street')
    expect((await send(draft)).status).toHaveBeenCalledWith(400)
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it('requires exact recipient confirmation for mailing-list sends, with no send on prepare', async () => {
    const prepared = await call(mailingHandler, { action: 'prepare', template_id: 'newsletter', subscriber_ids: [subscriberId] })
    expect(prepared.body.drafts).toHaveLength(1)
    expect(prepared.body.drafts[0].body).not.toContain('{{')
    expect(mocks.send).not.toHaveBeenCalled()
    const edited = { ...prepared.body.drafts[0], body: prepared.body.drafts[0].body + ' edited' }
    expect((await call(mailingHandler, { action: 'send', template_id: 'newsletter', drafts: [edited] })).status).toHaveBeenCalledWith(400)
    const sent = await call(mailingHandler, { action: 'send', template_id: 'newsletter', drafts: prepared.body.drafts })
    expect(sent.status).toHaveBeenCalledWith(201)
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ text: prepared.body.drafts[0].body }), expect.anything())
  })
  it('never sends on GET, missing confirmation, expired confirmation, or recipient changes', async () => {
    expect((await call(sendHandler, null, 'GET')).status).toHaveBeenCalledWith(405)
    const draft = (await prepare()).body
    expect((await send({ ...draft, owner_confirmation_token: null })).status).toHaveBeenCalledWith(403)
    const values = { leadId, recipient: 'Person@Example.com', templateId: 'template', sendType: 'intro', subject: draft.subject, body: draft.body }
    expect((await send({ ...draft, owner_confirmation_token: createSalesConfirmationToken(mocks.context, values, 1) })).status).toHaveBeenCalledWith(403)
    db.tables.leads[0].email = 'different@example.com'
    expect((await send(draft)).status).toHaveBeenCalledWith(403)
    expect(mocks.send).not.toHaveBeenCalled()
  })
})

it('keeps owner-recorded opt-outs authenticated and scoped to the workspace', async () => {
  mocks.context = { error: 'Owner required', status: 403 }
  expect((await call(suppressHandler, { lead_id: leadId })).status).toHaveBeenCalledWith(403)
  expect(db.tables.outreach_email_preferences).toHaveLength(0)
  mocks.context = { client: db.client, workspaceId: 'other-workspace', user: { id: 'other-owner' } }
  expect((await call(suppressHandler, { lead_id: leadId })).status).toHaveBeenCalledWith(404)
  expect(db.tables.outreach_email_preferences).toHaveLength(0)
})
