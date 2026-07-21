import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SlideOver from '../SlideOver'

const mockDraft = {
  id: 'draft-1',
  topic: 'React vs Next.js',
  platform_posts: [
    { id: 'pp-1', platform: 'instagram', copy: 'IG copy here', image_url: null },
    { id: 'pp-2', platform: 'linkedin',  copy: 'LI copy here', image_url: null },
  ],
}

describe('SlideOver', () => {
  it('renders the draft topic', () => {
    render(<SlideOver draft={mockDraft} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} />)
    expect(screen.getByText('React vs Next.js')).toBeInTheDocument()
  })

  it('renders a tab for each platform', () => {
    render(<SlideOver draft={mockDraft} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} />)
    expect(screen.getByRole('tab', { name: /instagram/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /linkedin/i })).toBeInTheDocument()
  })

  it('shows first platform copy by default', () => {
    render(<SlideOver draft={mockDraft} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} />)
    expect(screen.getByText('IG copy here')).toBeInTheDocument()
  })

  it('switches copy when tab clicked', () => {
    render(<SlideOver draft={mockDraft} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: /linkedin/i }))
    expect(screen.getByText('LI copy here')).toBeInTheDocument()
  })

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn()
    render(<SlideOver draft={mockDraft} onClose={onClose} onApprove={vi.fn()} onReject={vi.fn()} />)
    fireEvent.click(screen.getByTestId('backdrop'))
    expect(onClose).toHaveBeenCalled()
  })
})
