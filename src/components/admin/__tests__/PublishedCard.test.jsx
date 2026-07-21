import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublishedCard from '../PublishedCard'

const mockDraft = {
  id: 'draft-1',
  topic: 'Top 5 Web Design Trends in Chicago',
  updated_at: '2026-04-01T10:00:00Z',
  platform_posts: [
    { id: 'pp-1', platform: 'instagram', status: 'published', image_url: null },
    { id: 'pp-2', platform: 'facebook',  status: 'published', image_url: null },
    { id: 'pp-3', platform: 'x',         status: 'failed',    image_url: null },
    { id: 'pp-4', platform: 'linkedin',  status: 'published', image_url: null },
    { id: 'pp-5', platform: 'pinterest', status: 'published', image_url: null },
    { id: 'pp-6', platform: 'whatsapp',  status: 'published', image_url: null },
    { id: 'pp-7', platform: 'youtube',   status: 'youtube_ready', image_url: null },
  ],
}

describe('PublishedCard', () => {
  it('renders the topic', () => {
    render(<PublishedCard draft={mockDraft} />)
    expect(screen.getByText(/Top 5 Web Design/i)).toBeInTheDocument()
  })

  it('shows checkmark badge for published platform', () => {
    render(<PublishedCard draft={mockDraft} />)
    expect(screen.getByText('IG ✓')).toBeInTheDocument()
  })

  it('shows failure badge for failed platform', () => {
    render(<PublishedCard draft={mockDraft} />)
    expect(screen.getByText('X ✗')).toBeInTheDocument()
  })

  it('shows pending badge for youtube_ready platform', () => {
    render(<PublishedCard draft={mockDraft} />)
    expect(screen.getByText('YT ⏳')).toBeInTheDocument()
  })
})
