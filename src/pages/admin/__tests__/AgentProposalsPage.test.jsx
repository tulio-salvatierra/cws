import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { mockGetSession } = vi.hoisted(() => ({ mockGetSession: vi.fn() }))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
  },
}))

import AgentProposalsPage from '../AgentProposalsPage'

function renderPage() {
  return render(<MemoryRouter><AgentProposalsPage /></MemoryRouter>)
}

describe('AgentProposalsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('renders pending proposals with source, summary, and timestamp', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'access-token' } },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        proposals: [{
          id: 'run-1',
          agent_key: 'company_todos',
          created_at: '2026-08-23T18:00:00Z',
          output: { summary: 'Call back the highest-intent lead.' },
        }],
      }),
    }))

    renderPage()

    expect(await screen.findByRole('heading', { name: 'company todos' })).toBeInTheDocument()
    expect(screen.getByText('Call back the highest-intent lead.')).toBeInTheDocument()
    expect(screen.getByText(new Date('2026-08-23T18:00:00Z').toLocaleString())).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/agent-proposals', expect.objectContaining({
      method: 'GET',
      headers: { Authorization: 'Bearer access-token' },
    }))
  })

  it('renders a plain empty state without treating it as an error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'access-token' } },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ proposals: [] }),
    }))

    renderPage()

    expect(await screen.findByText('no pending proposals')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('marks a proposal discussed through the authenticated API', async () => {
    const user = userEvent.setup()
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'access-token' } },
    })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          proposals: [{
            id: '50cddc54-6447-4530-9a36-6770300c5fd4',
            agent_key: 'marketing',
            created_at: '2026-08-23T18:00:00Z',
            output: { summary: 'Review the homepage CTA.' },
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          proposal: { id: '50cddc54-6447-4530-9a36-6770300c5fd4', status: 'completed' },
        }),
      }))

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Mark discussed' }))

    expect(fetch).toHaveBeenLastCalledWith('/api/agent-proposals', expect.objectContaining({
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ proposal_id: '50cddc54-6447-4530-9a36-6770300c5fd4' }),
    }))
    expect(await screen.findByText('no pending proposals')).toBeInTheDocument()
  })
})
