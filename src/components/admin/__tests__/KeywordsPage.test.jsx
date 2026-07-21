import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../../../Hooks/useKeywords', () => ({
  useKeywords: vi.fn(),
}))

import { useKeywords } from '../../../Hooks/useKeywords'
import KeywordsPage from '../../../pages/admin/KeywordsPage'

const mockApprove = vi.fn()
const mockReject = vi.fn()
const mockBlock = vi.fn()
const mockUnblock = vi.fn()
const mockUpdatePriority = vi.fn()
const mockAdd = vi.fn()

const baseState = {
  suggested: [],
  active: [],
  blocked: [],
  loading: false,
  error: null,
  approveKeyword: mockApprove,
  rejectKeyword: mockReject,
  blockKeyword: mockBlock,
  unblockKeyword: mockUnblock,
  updatePriority: mockUpdatePriority,
  addKeyword: mockAdd,
}

describe('KeywordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useKeywords.mockReturnValue(baseState)
  })

  it('renders the page heading', () => {
    render(<KeywordsPage />)
    expect(screen.getByText('Keyword Strategy')).toBeInTheDocument()
  })

  it('shows empty state when no suggestions', () => {
    render(<KeywordsPage />)
    expect(screen.getByText(/WF5 runs every Monday/i)).toBeInTheDocument()
  })

  it('renders a suggestion card and calls approve', () => {
    useKeywords.mockReturnValue({
      ...baseState,
      suggested: [{ id: 'kw-1', term: 'chicago web design', priority: 4, status: 'suggested', rationale: 'High search volume' }],
    })
    render(<KeywordsPage />)
    expect(screen.getByText('chicago web design')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /approve/i }))
    expect(mockApprove).toHaveBeenCalledWith('kw-1')
  })

  it('renders active keywords table', () => {
    useKeywords.mockReturnValue({
      ...baseState,
      active: [{ id: 'kw-2', term: 'small business website', priority: 3, status: 'active', use_count: 5 }],
    })
    render(<KeywordsPage />)
    expect(screen.getByText('small business website')).toBeInTheDocument()
  })

  it('calls blockKeyword when block is clicked', () => {
    useKeywords.mockReturnValue({
      ...baseState,
      active: [{ id: 'kw-2', term: 'small business website', priority: 3, status: 'active', use_count: 0 }],
    })
    render(<KeywordsPage />)
    fireEvent.click(screen.getByRole('button', { name: /block/i }))
    expect(mockBlock).toHaveBeenCalledWith('kw-2')
  })
})
