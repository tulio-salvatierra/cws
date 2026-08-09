import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import LegacyWorkspaceRedirect from '../LegacyWorkspaceRedirect'

describe('LegacyWorkspaceRedirect', () => {
  it('preserves dynamic ids when moving legacy workspace URLs under admin', () => {
    render(
      <MemoryRouter initialEntries={['/workspace/campaigns/campaign-1']}>
        <Routes>
          <Route path="/workspace/campaigns/:campaignId" element={<LegacyWorkspaceRedirect to="/admin/campaigns/:campaignId" />} />
          <Route path="/admin/campaigns/:campaignId" element={<p>campaign destination</p>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('campaign destination')).toBeInTheDocument()
  })
})
