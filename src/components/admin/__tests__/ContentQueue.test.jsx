import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../../../Hooks/useDrafts', () => ({
  useDrafts: vi.fn(),
  useYouTubeDrafts: vi.fn(),
}))

import { useDrafts, useYouTubeDrafts } from '../../../Hooks/useDrafts'
import ContentQueue from '../ContentQueue'

const emptyState = { drafts: [], loading: false, error: null, approveDraft: vi.fn(), rejectDraft: vi.fn() }
const ytEmptyState = { drafts: [], loading: false, error: null, markUploaded: vi.fn() }

describe('ContentQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDrafts.mockReturnValue(emptyState)
    useYouTubeDrafts.mockReturnValue(ytEmptyState)
  })

  it('renders Pending tab by default', () => {
    render(<ContentQueue />)
    expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument()
  })

  it('renders Published tab button', () => {
    render(<ContentQueue />)
    expect(screen.getByRole('button', { name: /published/i })).toBeInTheDocument()
  })

  it('renders YouTube tab button', () => {
    render(<ContentQueue />)
    expect(screen.getByRole('button', { name: /youtube/i })).toBeInTheDocument()
  })

  it('shows pending empty state on load', () => {
    render(<ContentQueue />)
    expect(screen.getByText(/no drafts pending review/i)).toBeInTheDocument()
  })

  it('switches to Published tab on click', () => {
    render(<ContentQueue />)
    fireEvent.click(screen.getByRole('button', { name: /published/i }))
    expect(screen.getByText(/no published posts yet/i)).toBeInTheDocument()
  })

  it('switches to YouTube tab on click', () => {
    render(<ContentQueue />)
    fireEvent.click(screen.getByRole('button', { name: /youtube/i }))
    expect(screen.getByText(/no youtube metadata ready/i)).toBeInTheDocument()
  })
})
