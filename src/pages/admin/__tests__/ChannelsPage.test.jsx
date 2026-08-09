import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('../../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import ChannelsPage from '../ChannelsPage'

function query(result, finalMethod) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => finalMethod === 'order' ? Promise.resolve(result) : chain),
    limit: vi.fn(() => Promise.resolve(result)),
  }
  return chain
}

describe('ChannelsPage', () => {
  beforeEach(() => {
    mockFrom.mockImplementation((table) => {
      if (table === 'workspace_members') {
        return query({ data: [{ workspace_id: 'workspace-1' }], error: null }, 'limit')
      }

      return query({
        data: [
          {
            id: 'channel-1',
            name: 'Cicero Web Studio',
            slug: 'cicero-web-studio',
            audience: 'Founders who need a sharper digital presence.',
            voice: 'Strategic and direct.',
            formats: ['video', 'short-form'],
            production_requirements: 'Founder-led production.',
            revenue_goal: 'Qualified website projects.',
            success_metrics: 'Qualified conversations.',
          },
        ],
        error: null,
      }, 'order')
    })
  })

  it('loads and displays workspace channel context', async () => {
    render(
      <MemoryRouter>
        <ChannelsPage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Channels' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cicero Web Studio' })).toBeInTheDocument()
    expect(screen.getByText('Strategic and direct.')).toBeInTheDocument()
    expect(screen.getByText('video')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Workspace/ })).toHaveAttribute('href', '/admin/workspace')
  })

  it('shows the membership error instead of exposing channel data', async () => {
    mockFrom.mockImplementationOnce(() => query({ data: [], error: null }, 'limit'))

    render(
      <MemoryRouter>
        <ChannelsPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('No active workspace membership was found for this account.')).toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: 'Cicero Web Studio' })).not.toBeInTheDocument()
  })
})
