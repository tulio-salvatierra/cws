import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { mockFrom, mockGetUser, mockInsert, mockUpdate } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
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
    insert: vi.fn((payload) => {
      mockInsert(payload)
      return chain
    }),
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
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  it('creates a new pending approval after revisions are requested', async () => {
    const revisedApproval = {
      id: 'approval-1',
      status: 'revision_requested',
      feedback: 'Tighten the opening.',
      reviewed_at: '2026-08-08T12:00:00Z',
    }
    const pendingApproval = {
      id: 'approval-2',
      status: 'pending',
      feedback: null,
      reviewed_at: null,
      content_snapshot: { transcript: 'Original script' },
    }

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockFrom.mockImplementation((table) => {
      if (table === 'workspace_members') return query({ singleData: { workspace_id: 'workspace-1' } })
      if (table === 'content_variants') return query({ singleData: variant })
      if (table === 'approvals') {
        return mockInsert.mock.calls.length === 0
          ? query({ data: [revisedApproval], singleData: pendingApproval })
          : query({ singleData: pendingApproval })
      }
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
    expect(await screen.findByText('revision requested')).toBeInTheDocument()
    expect(screen.getByText('Tighten the opening.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Re-submit for review' }))

    expect(mockInsert).toHaveBeenCalledWith({
      workspace_id: 'workspace-1',
      content_variant_id: 'variant-1',
      created_by: 'user-1',
      status: 'pending',
    })
    expect(await screen.findByText('pending')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('ready_for_review')
    expect(screen.queryByRole('button', { name: 'Re-submit for review' })).not.toBeInTheDocument()
  })

  it('requires explicit confirmation before recording an owner approval', async () => {
    const pendingApproval = {
      id: 'approval-1',
      status: 'pending',
      feedback: null,
      reviewed_at: null,
    }
    const approvedApproval = {
      ...pendingApproval,
      status: 'approved',
      feedback: 'Ready to proceed.',
      reviewed_at: '2026-08-09T15:43:26Z',
    }

    mockFrom.mockImplementation((table) => {
      if (table === 'workspace_members') return query({ singleData: { workspace_id: 'workspace-1' } })
      if (table === 'content_variants') return query({ singleData: variant })
      if (table === 'approvals') return query({ data: [pendingApproval], singleData: approvedApproval })
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
    expect(await screen.findByText('Submitted for owner review')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Reviewer feedback' }), 'Ready to proceed.')
    await user.click(screen.getByRole('button', { name: 'Approve' }))

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog', { name: 'Confirm review decision' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm approval' }))

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'approved', feedback: 'Ready to proceed.' })
    expect(await screen.findByText('Ready to proceed.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('approved')
  })

  it('explains that requesting review captures a snapshot without approving or publishing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockFrom.mockImplementation((table) => {
      if (table === 'workspace_members') return query({ singleData: { workspace_id: 'workspace-1' } })
      if (table === 'content_variants') return query({ singleData: variant })
      if (table === 'approvals') return query({ data: [], singleData: { id: 'approval-1', status: 'pending', content_snapshot: {} } })
      return query({ data: [], singleData: null })
    })

    render(
      <MemoryRouter initialEntries={['/admin/variants/variant-1']}>
        <Routes>
          <Route path="/admin/variants/:variantId" element={<VariantDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Submitting captures an immutable snapshot/)).toBeInTheDocument()
    expect(screen.getByText(/It does not approve or publish anything/)).toBeInTheDocument()
  })

  it('requires an explicit confirmation to record an approved export without publishing', async () => {
    const approvedVariant = {
      ...variant,
      status: 'approved',
      caption_text: 'Final social caption',
      export_reference: 'CWS-AI-E0104603-v1.mp4',
      exported_by: null,
      exported_at: null,
      export_snapshot: null,
    }
    const exportedVariant = {
      ...approvedVariant,
      status: 'exported',
      exported_by: 'user-1',
      exported_at: '2026-08-12T16:30:00Z',
      export_snapshot: { snapshot_version: 1 },
    }
    let contentVariantQueryCount = 0

    mockFrom.mockImplementation((table) => {
      if (table === 'workspace_members') return query({ singleData: { workspace_id: 'workspace-1' } })
      if (table === 'content_variants') {
        contentVariantQueryCount += 1
        return contentVariantQueryCount === 1
          ? query({ singleData: approvedVariant })
          : query({ singleData: exportedVariant })
      }
      if (table === 'approvals') return query({ data: [{ id: 'approval-1', status: 'approved', feedback: 'approved' }] })
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
    expect(await screen.findByRole('heading', { name: 'Prepare the approved variant for external export' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'exported' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark exported' }))
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog', { name: 'Confirm export handoff' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm exported' }))

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      caption_text: 'Final social caption',
      export_reference: 'CWS-AI-E0104603-v1.mp4',
      status: 'exported',
    }))
    expect(await screen.findByRole('heading', { name: 'Export recorded' })).toBeInTheDocument()
    expect(screen.getByText('No publication action was triggered.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Caption text' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Export filename or reference' })).toBeDisabled()
  })

  it('keeps the export action disabled until caption and reference are present', async () => {
    const approvedVariant = {
      ...variant,
      status: 'approved',
      caption_text: '',
      export_reference: '',
      exported_by: null,
      exported_at: null,
      export_snapshot: null,
    }

    mockFrom.mockImplementation((table) => {
      if (table === 'workspace_members') return query({ singleData: { workspace_id: 'workspace-1' } })
      if (table === 'content_variants') return query({ singleData: approvedVariant })
      if (table === 'approvals') return query({ data: [{ id: 'approval-1', status: 'approved' }] })
      return query({ data: [], singleData: null })
    })

    render(
      <MemoryRouter initialEntries={['/admin/variants/variant-1']}>
        <Routes>
          <Route path="/admin/variants/:variantId" element={<VariantDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('button', { name: 'Mark exported' })).toBeDisabled()
  })
})
