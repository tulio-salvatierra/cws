import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { mockEq, mockFrom, mockUpdate } = vi.hoisted(() => ({
  mockEq: vi.fn(),
  mockFrom: vi.fn(),
  mockUpdate: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import CampaignDetailPage from '../CampaignDetailPage'

const campaign = {
  id: 'campaign-1',
  code: 'CWS-001',
  title: 'Cicero Web Studio Intro Advertisement',
  status: 'editing',
  description: 'Pilot campaign',
}

function query({ data = [], singleData = data } = {}) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((column, value) => {
      mockEq(column, value)
      return chain
    }),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    update: vi.fn((payload) => {
      mockUpdate(payload)
      return chain
    }),
    single: vi.fn(() => Promise.resolve({ data: singleData, error: null })),
    then: (resolve, reject) => Promise.resolve({ data, error: null }).then(resolve, reject),
  }
  return chain
}

describe('CampaignDetailPage', () => {
  it('saves a workspace-scoped campaign lifecycle status', async () => {
    let campaignQueryCount = 0
    mockFrom.mockImplementation((table) => {
      if (table === 'workspace_members') return query({ singleData: { workspace_id: 'workspace-1' } })
      if (table === 'content_variants') return query({ data: [] })
      if (table === 'campaigns') {
        campaignQueryCount += 1
        return query({ singleData: campaignQueryCount === 1 ? campaign : { ...campaign, status: 'review' } })
      }
      return query()
    })

    render(
      <MemoryRouter initialEntries={['/admin/campaigns/campaign-1']}>
        <Routes>
          <Route path="/admin/campaigns/:campaignId" element={<CampaignDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: 'CWS-001' })).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Campaign status' }), 'review')
    await user.click(screen.getByRole('button', { name: 'Save status' }))

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'review' })
    expect(mockEq).toHaveBeenCalledWith('id', 'campaign-1')
    expect(mockEq).toHaveBeenCalledWith('workspace_id', 'workspace-1')
    expect(await screen.findByRole('status')).toHaveTextContent('Campaign status saved.')
    expect(screen.getByRole('combobox', { name: 'Campaign status' })).toHaveValue('review')
  })
})
