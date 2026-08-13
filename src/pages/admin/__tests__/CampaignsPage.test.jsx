import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('../../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import CampaignsPage from '../CampaignsPage'

function query({ data = [], singleData = data } = {}) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: singleData, error: null })),
    then: (resolve, reject) => Promise.resolve({ data, error: null }).then(resolve, reject),
  }
  return chain
}

describe('CampaignsPage', () => {
  it('hides archived tests by default and can reveal them', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'workspace_members') return query({ singleData: { workspace_id: 'workspace-1' } })
      if (table === 'channels') return query({ data: [{ id: 'channel-1', name: 'Cicero Web Studio' }] })
      if (table === 'campaigns') return query({ data: [
        { id: 'campaign-1', code: 'CWS-001', title: 'Production campaign', status: 'editing', channel_id: 'channel-1', is_test: false, test_archived: false },
        { id: 'campaign-test', code: 'CWS-TEST', title: 'Archived feature test', status: 'published', channel_id: 'channel-1', is_test: true, test_archived: true },
      ] })
      return query()
    })

    render(<MemoryRouter><CampaignsPage /></MemoryRouter>)
    const user = userEvent.setup()

    expect(await screen.findByText('Production campaign')).toBeInTheDocument()
    expect(screen.queryByText('Archived feature test')).not.toBeInTheDocument()
    expect(screen.getByText('1 campaign')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show archived tests (1)' }))
    expect(screen.getByText('Archived feature test')).toBeInTheDocument()
    expect(screen.getByText('Test · archived')).toBeInTheDocument()
  })
})
