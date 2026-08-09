import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
  },
}))

import NewCampaignPage from '../NewCampaignPage'

function createQuery(table) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    single: vi.fn(() => {
      if (table === 'workspace_members') {
        return Promise.resolve({ data: { workspace_id: 'workspace-1' }, error: null })
      }

      return Promise.resolve({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      })
    }),
    then: (resolve, reject) => Promise.resolve({
      data: table === 'channels' ? [{ id: 'channel-1', name: 'Cicero Web Studio' }] : [],
      error: null,
    }).then(resolve, reject),
  }

  return chain
}

describe('NewCampaignPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockImplementation(createQuery)
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('shows a friendly workspace-scoped message for a duplicate campaign code', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <NewCampaignPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Code'), 'CWS-002')
    await user.type(screen.getByLabelText('Title'), 'Duplicate campaign')

    const submit = screen.getByRole('button', { name: 'Create campaign' })
    await waitFor(() => expect(submit).toBeEnabled())
    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Campaign code CWS-002 already exists in this workspace. Use a different code.',
    )
    expect(submit).toBeEnabled()
  })
})
