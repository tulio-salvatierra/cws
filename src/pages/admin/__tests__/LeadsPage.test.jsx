import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getSession } },
}))

import LeadsPage from '../LeadsPage.jsx'

function response(payload) { return { ok: true, json: vi.fn().mockResolvedValue(payload) } }

describe('LeadsPage Google Business Profile reference', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'access-token' } } })
    globalThis.fetch = vi.fn().mockResolvedValue(response({
      ok: true,
      leads: [{
        id: 'lead-a',
        name: 'Ada',
        company: 'Ada Plumbing',
        email: null,
        phone: '+13125550123',
        status: 'new',
        google_business_profile_url: 'https://www.google.com/maps?cid=123',
        last_contacted_at: null,
      }],
    }))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('shows an optional manual reference field and a safe outbound profile link without a Google request', async () => {
    render(<MemoryRouter><LeadsPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Leads' })).toBeInTheDocument()
    expect(screen.getByLabelText('Google Business Profile URL')).toHaveAttribute('type', 'url')
    expect(screen.getByRole('link', { name: 'Open profile' })).toHaveAttribute('href', 'https://www.google.com/maps?cid=123')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/outreach/leads', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
    }))
    expect(globalThis.fetch.mock.calls).toHaveLength(1)
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()
  })
})
