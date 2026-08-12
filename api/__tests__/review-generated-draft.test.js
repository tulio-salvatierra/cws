/* global process */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))

import handler from '../review-generated-draft'

function createResponse() {
  const response = { status: vi.fn(() => response), json: vi.fn(() => response) }
  return response
}

function request(body, token = 'access-token') {
  return {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  }
}

function createClient({ rpcData = {}, rpcError = null, authError = null } = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authError ? null : { id: 'owner-1' } },
        error: authError,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: rpcData, error: rpcError }),
  }
}

describe('generated draft review API', () => {
  beforeEach(() => {
    process.env.GENERATION_SUPABASE_URL = 'https://project.supabase.co'
    process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    createClientMock.mockReset()
  })

  afterEach(() => {
    delete process.env.GENERATION_SUPABASE_URL
    delete process.env.GENERATION_SUPABASE_SERVICE_ROLE_KEY
  })

  it('requires authentication before creating a client', async () => {
    const response = createResponse()
    await handler(request({ run_id: 'run-1', action: 'reject' }, ''), response)
    expect(response.status).toHaveBeenCalledWith(401)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('validates acceptance fields before authentication or database work', async () => {
    const response = createResponse()
    await handler(request({ run_id: 'run-1', action: 'accept' }), response)
    expect(response.status).toHaveBeenCalledWith(400)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('passes an accepted edited draft to the atomic review function', async () => {
    const client = createClient({
      rpcData: {
        run_id: 'run-1',
        status: 'completed',
        action: 'accept',
        content_variant_id: 'variant-1',
      },
    })
    createClientMock.mockReturnValue(client)
    const response = createResponse()

    await handler(request({
      run_id: 'run-1',
      action: 'accept',
      campaign_id: 'campaign-1',
      code: 'cws-ai-one',
      working_title: '  Clear website message  ',
      draft_text: '  Edited review copy.  ',
      feedback: '  Tightened the opening.  ',
    }), response)

    expect(client.rpc).toHaveBeenCalledWith('review_generated_draft', {
      p_run_id: 'run-1',
      p_actor_user_id: 'owner-1',
      p_action: 'accept',
      p_feedback: 'Tightened the opening.',
      p_campaign_id: 'campaign-1',
      p_code: 'CWS-AI-ONE',
      p_working_title: 'Clear website message',
      p_draft_text: 'Edited review copy.',
    })
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      content_variant_id: 'variant-1',
    }))
  })

  it('rejects without passing variant fields', async () => {
    const client = createClient({
      rpcData: { run_id: 'run-1', status: 'superseded', action: 'reject' },
    })
    createClientMock.mockReturnValue(client)
    const response = createResponse()

    await handler(request({ run_id: 'run-1', action: 'reject', feedback: 'Not aligned.' }), response)

    expect(client.rpc).toHaveBeenCalledWith('review_generated_draft', expect.objectContaining({
      p_action: 'reject',
      p_campaign_id: null,
      p_code: null,
      p_working_title: null,
      p_draft_text: null,
    }))
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('maps duplicate variant codes to a stable conflict response', async () => {
    createClientMock.mockReturnValue(createClient({
      rpcError: { code: '23505', message: 'duplicate key value' },
    }))
    const response = createResponse()

    await handler(request({
      run_id: 'run-1',
      action: 'accept',
      campaign_id: 'campaign-1',
      code: 'CWS-AI-ONE',
      working_title: 'Clear website message',
      draft_text: 'Edited review copy.',
    }), response)

    expect(response.status).toHaveBeenCalledWith(409)
    expect(response.json).toHaveBeenCalledWith({
      ok: false,
      error: 'That variant code already exists in this workspace. Choose a different code.',
    })
  })
})
