import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { mockFrom, mockGetUser, mockInsert } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
  mockInsert: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
  },
}))

import NewDecisionPage from '../NewDecisionPage'
import NewLearningPage from '../NewLearningPage'

function query(table) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn((payload) => {
      mockInsert(table, payload)
      return chain
    }),
    single: vi.fn(() => Promise.resolve({
      data: table === 'workspace_members' ? { workspace_id: 'workspace-1' } : { id: `${table}-1` },
      error: null,
    })),
  }
  return chain
}

function renderPage(element, path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="/admin/knowledge" element={<p>Knowledge landing</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('knowledge creation pages', () => {
  it('creates a proposed workspace decision', async () => {
    mockFrom.mockImplementation(query)
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const user = userEvent.setup()
    renderPage(<NewDecisionPage />, '/admin/knowledge/new-decision')

    await user.type(screen.getByRole('textbox', { name: 'Title' }), '  Approve pilot workflow  ')
    await user.type(screen.getByRole('textbox', { name: 'Context' }), '  CWS-001 is ready for review.  ')
    await user.type(screen.getByRole('textbox', { name: 'Decision' }), '  Use the new revision cycle.  ')
    await user.click(screen.getByRole('button', { name: 'Create decision' }))

    expect(mockInsert).toHaveBeenCalledWith('decisions', {
      workspace_id: 'workspace-1',
      title: 'Approve pilot workflow',
      context: 'CWS-001 is ready for review.',
      decision: 'Use the new revision cycle.',
      status: 'proposed',
      created_by: 'user-1',
    })
    expect(await screen.findByText('Knowledge landing')).toBeInTheDocument()
  })

  it('creates a workspace learning', async () => {
    mockFrom.mockImplementation(query)
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const user = userEvent.setup()
    renderPage(<NewLearningPage />, '/admin/knowledge/new-learning')

    await user.type(screen.getByRole('textbox', { name: 'Title' }), '  Keep variants independent  ')
    await user.type(screen.getByRole('textbox', { name: 'Category' }), '  Production  ')
    await user.type(screen.getByRole('textbox', { name: 'Learning' }), '  Review each language separately.  ')
    await user.click(screen.getByRole('button', { name: 'Create learning' }))

    expect(mockInsert).toHaveBeenCalledWith('learnings', {
      workspace_id: 'workspace-1',
      title: 'Keep variants independent',
      body: 'Review each language separately.',
      category: 'Production',
      created_by: 'user-1',
    })
    expect(await screen.findByText('Knowledge landing')).toBeInTheDocument()
  })
})
