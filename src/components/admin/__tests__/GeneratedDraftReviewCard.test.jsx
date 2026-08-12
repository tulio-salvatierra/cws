import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { mockGetSession } = vi.hoisted(() => ({ mockGetSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getSession: mockGetSession } },
}))

import GeneratedDraftReviewCard from '../GeneratedDraftReviewCard'

const run = {
  id: 'e0104603-d197-461e-8ae3-780e1bb2ef35',
  agent_key: 'channel-draft-generator',
  command_level: 'propose',
  status: 'needs_review',
  input: { topic: 'Why a clear website message matters' },
  output: {
    channel_id: 'channel-1',
    brief_version: 1,
    draft_text: 'Generated draft copy.',
  },
  created_at: '2026-08-12T15:21:48Z',
}
const campaigns = [
  { id: 'campaign-1', channel_id: 'channel-1', code: 'CWS-001', title: 'Intro campaign' },
  { id: 'campaign-2', channel_id: 'other-channel', code: 'DRUM-001', title: 'Drum campaign' },
]

describe('GeneratedDraftReviewCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('requires explicit confirmation before accepting the draft', () => {
    render(<MemoryRouter><GeneratedDraftReviewCard run={run} campaigns={campaigns} onReviewed={vi.fn()} /></MemoryRouter>)
    expect(screen.getByRole('button', { name: 'Accept into campaign' })).toBeDisabled()
    expect(screen.getByRole('option', { name: 'CWS-001 · Intro campaign' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'DRUM-001 · Drum campaign' })).not.toBeInTheDocument()
  })

  it('submits edited copy to the protected review API', async () => {
    const user = userEvent.setup()
    const onReviewed = vi.fn()
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'access-token' } } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        ok: true,
        status: 'completed',
        content_variant_id: 'variant-1',
      }),
    }))
    render(<MemoryRouter><GeneratedDraftReviewCard run={run} campaigns={campaigns} onReviewed={onReviewed} /></MemoryRouter>)

    await user.clear(screen.getByLabelText('Draft text'))
    await user.type(screen.getByLabelText('Draft text'), 'Edited and accepted copy.')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Accept into campaign' }))

    expect(fetch).toHaveBeenCalledWith('/api/review-generated-draft', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
    }))
    const payload = JSON.parse(fetch.mock.calls[0][1].body)
    expect(payload).toEqual(expect.objectContaining({
      action: 'accept',
      campaign_id: 'campaign-1',
      draft_text: 'Edited and accepted copy.',
    }))
    expect(onReviewed).toHaveBeenCalledWith(expect.objectContaining({ content_variant_id: 'variant-1' }))
  })
})
