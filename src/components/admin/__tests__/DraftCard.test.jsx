import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DraftCard from '../DraftCard'

const mockDraft = {
  id: 'draft-1',
  topic: '5 Reasons Your Business Needs a Custom Website',
  keywords: ['web design', 'chicago'],
  created_at: '2026-03-28T06:00:00Z',
  platform_posts: [
    { id: 'pp-1', platform: 'instagram', copy: 'IG copy', image_url: 'https://example.com/img.jpg' },
    { id: 'pp-2', platform: 'linkedin', copy: 'LI copy', image_url: 'https://example.com/img.jpg' },
  ],
}

describe('DraftCard', () => {
  it('renders the topic', () => {
    render(<DraftCard draft={mockDraft} onApprove={vi.fn()} onReject={vi.fn()} onExpand={vi.fn()} />)
    expect(screen.getByText(/5 Reasons Your Business/i)).toBeInTheDocument()
  })

  it('renders platform badges', () => {
    render(<DraftCard draft={mockDraft} onApprove={vi.fn()} onReject={vi.fn()} onExpand={vi.fn()} />)
    expect(screen.getByText('IG')).toBeInTheDocument()
    expect(screen.getByText('LI')).toBeInTheDocument()
  })

  it('calls onApprove when approve button clicked', () => {
    const onApprove = vi.fn()
    render(<DraftCard draft={mockDraft} onApprove={onApprove} onReject={vi.fn()} onExpand={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /approve/i }))
    expect(onApprove).toHaveBeenCalledWith('draft-1')
  })

  it('calls onReject when reject button clicked', () => {
    const onReject = vi.fn()
    render(<DraftCard draft={mockDraft} onApprove={vi.fn()} onReject={onReject} onExpand={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /reject/i }))
    expect(onReject).toHaveBeenCalledWith('draft-1')
  })
})
