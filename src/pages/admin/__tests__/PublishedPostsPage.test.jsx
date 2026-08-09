import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublishedPostsPage from '../PublishedPostsPage'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { from: fromMock } }))

function membershipQuery() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { workspace_id: 'workspace-1' }, error: null }),
          })),
        })),
      })),
    })),
  }
}

function publishedPostsQuery(posts, updateResult) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: posts, error: null }),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue(updateResult),
          })),
        })),
      })),
    })),
  }
}

describe('PublishedPostsPage', () => {
  beforeEach(() => fromMock.mockReset())

  it('shows newest publish records in the content publish-log tab', async () => {
    const posts = [{
      id: 'post-1',
      platform: 'youtube',
      published_at: '2026-08-09T12:00:00Z',
      language: 'en',
      source: 'manual',
      outcome_score: null,
      outcome_note: null,
      external_url: 'https://youtube.example/post-1',
    }]
    fromMock.mockImplementation(table => table === 'workspace_members'
      ? membershipQuery()
      : publishedPostsQuery(posts, { data: null, error: null }))

    render(<PublishedPostsPage />)

    expect(await screen.findByText('youtube')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Publish log' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', 'https://youtube.example/post-1')
  })

  it('saves an outcome score, note, and recorded timestamp', async () => {
    const posts = [{
      id: 'post-1',
      platform: 'youtube',
      published_at: '2026-08-09T12:00:00Z',
      language: 'en',
      source: 'n8n',
      outcome_score: null,
      outcome_note: null,
      external_url: null,
    }]
    const query = publishedPostsQuery(posts, {
      data: { outcome_score: 'worked', outcome_note: 'Strong response', outcome_recorded_at: '2026-08-09T13:00:00Z' },
      error: null,
    })
    fromMock.mockImplementation(table => table === 'workspace_members' ? membershipQuery() : query)

    render(<PublishedPostsPage />)
    fireEvent.change(await screen.findByLabelText('Outcome for youtube post'), { target: { value: 'worked' } })
    fireEvent.change(screen.getByLabelText('Outcome note for youtube post'), { target: { value: 'Strong response' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByText('Outcome saved.')).toBeInTheDocument())
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({
      outcome_score: 'worked',
      outcome_note: 'Strong response',
      outcome_recorded_at: expect.any(String),
    }))
  })
})
