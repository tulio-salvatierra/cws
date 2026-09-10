/* global process */

import { describe, expect, it, vi } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))

import { createSalesConfirmationToken, validSalesConfirmationToken } from '../shared.js'

const context = { workspaceId: 'workspace-a', user: { id: 'owner-a' } }
const values = { leadId: 'lead-a', recipient: 'a@example.com', templateId: 'template-a', sendType: 'intro', subject: 'Hello', body: 'Body' }

describe('Sales owner confirmation', () => {
  it('is valid only for the exact owner, lead, recipient, type, and draft', () => {
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'test-secret'
    const token = createSalesConfirmationToken(context, values, 1000)
    expect(validSalesConfirmationToken(token, context, values, 1001)).toBe(true)
    expect(validSalesConfirmationToken(token, context, { ...values, leadId: 'lead-b' }, 1001)).toBe(false)
    expect(validSalesConfirmationToken(token, context, { ...values, recipient: 'b@example.com' }, 1001)).toBe(false)
    expect(validSalesConfirmationToken(token, context, { ...values, body: 'Changed' }, 1001)).toBe(false)
  })

  it('expires after ten minutes', () => {
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'test-secret'
    const token = createSalesConfirmationToken(context, values, 1000)
    expect(validSalesConfirmationToken(token, context, values, 601001)).toBe(false)
  })
})
