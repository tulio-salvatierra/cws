import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { mockFrom, mockGetSession } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetSession: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
  },
}))

import AgentRunsPage from '../AgentRunsPage'

function createQuery(table) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({
      data: table === 'workspace_members' ? { workspace_id: 'workspace-1' } : null,
      error: null,
    })),
    then: (resolve, reject) => Promise.resolve({
      data: table === 'agent_runs' ? [] : [],
      error: null,
    }).then(resolve, reject),
  }
  return chain
}

describe('AgentRunsPage generation test', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('generates and displays a CWS English review draft', async () => {
    const user = userEvent.setup()
    mockFrom.mockImplementation(createQuery)
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'access-token' } },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        output: {
          draft_text: 'A clear website tells customers what to do next.',
          brief_version: 1,
        },
      }),
    }))

    render(<MemoryRouter><AgentRunsPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Generate review draft' }))

    expect(await screen.findByRole('heading', { name: 'Generated draft' })).toBeInTheDocument()
    expect(screen.getByText('A clear website tells customers what to do next.')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/generate-draft', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
    }))
  })
})
