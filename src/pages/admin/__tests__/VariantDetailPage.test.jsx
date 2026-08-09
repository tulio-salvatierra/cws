import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { mockFrom, mockUpdate } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUpdate: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: vi.fn() },
  },
}))

import VariantDetailPage from '../VariantDetailPage'

const variant = {
  id: 'variant-1',
  code: 'CWS-001-EN-MASTER',
  locale: 'en',
  working_title: 'Cicero Web Studio Intro — English Master',
  status: 'recorded',
  transcript: 'Original script',
  tone: 'Strategic and direct',
  editing_notes: 'Keep the opening tight',
  caption_text: 'Original caption',
  export_reference: '',
  campaign_id: 'campaign-1',
}

const updatedVariant = {
  ...variant,
  status: 'rough_cut',
  transcript: 'Updated script',
  editing_notes: 'Add a stronger closing beat',
}

function query({ data = [], error = null, singleData = data } = {}) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    update: vi.fn((payload) => {
      mockUpdate(payload)
      return chain
    }),
    single: vi.fn(() => Promise.resolve({ data: singleData, error })),
    then: (resolve, reject) => Promise.resolve({ data, error }).then(resolve, reject),
  }
  return chain
}

describe('VariantDetailPage', () => {
  it('saves editable content and an independent lifecycle status', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'workspace_members') return query({ singleData: { workspace_id: 'workspace-1' } })
      if (table === 'content_variants') return query({ singleData: updatedVariant })
      return query({ data: [], singleData: null })
    })

    render(
      <MemoryRouter initialEntries={['/admin/variants/variant-1']}>
        <Routes>
          <Route path="/admin/variants/:variantId" element={<VariantDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: 'Cicero Web Studio Intro — English Master' })).toBeInTheDocument()
    await user.clear(screen.getByRole('textbox', { name: 'Transcript / script' }))
    await user.type(screen.getByRole('textbox', { name: 'Transcript / script' }), 'Updated script')
    await user.clear(screen.getByRole('textbox', { name: 'Editing notes' }))
    await user.type(screen.getByRole('textbox', { name: 'Editing notes' }), 'Add a stronger closing beat')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'rough_cut')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      transcript: 'Updated script',
      editing_notes: 'Add a stronger closing beat',
      status: 'rough_cut',
    }))
    expect(await screen.findByRole('status')).toHaveTextContent('Variant saved.')
  })
})
