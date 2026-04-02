import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import YouTubeCard from '../YouTubeCard'

const mockDraft = {
  id: 'draft-1',
  topic: 'Web Design Tips',
  platform_posts: [
    {
      id: 'pp-yt-1',
      platform: 'youtube',
      status: 'youtube_ready',
      image_url: null,
      copy: JSON.stringify({
        title: 'Top 5 Web Design Tips for Chicago Businesses',
        description: '[00:00] Intro\n[00:30] Tip 1\nVisit cicerowebstudio.xyz for more.',
        tags: 'web design, chicago, small business website',
      }),
    },
  ],
}

describe('YouTubeCard', () => {
  it('renders the video title', () => {
    render(<YouTubeCard draft={mockDraft} onMarkUploaded={vi.fn()} />)
    expect(screen.getByText('Top 5 Web Design Tips for Chicago Businesses')).toBeInTheDocument()
  })

  it('renders tags as chips', () => {
    render(<YouTubeCard draft={mockDraft} onMarkUploaded={vi.fn()} />)
    expect(screen.getByText('web design')).toBeInTheDocument()
    expect(screen.getByText('chicago')).toBeInTheDocument()
  })

  it('calls onMarkUploaded with the platform_post id when button clicked', () => {
    const onMarkUploaded = vi.fn()
    render(<YouTubeCard draft={mockDraft} onMarkUploaded={onMarkUploaded} />)
    fireEvent.click(screen.getByRole('button', { name: /mark as uploaded/i }))
    expect(onMarkUploaded).toHaveBeenCalledWith('pp-yt-1')
  })
})
