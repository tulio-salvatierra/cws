import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../lib/supabase', () => {
  const mockOn = vi.fn()
  const mockSubscribe = vi.fn()
  const mockRemoveChannel = vi.fn()
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockOrder = vi.fn()
  
  const mockChann = { on: mockOn, subscribe: mockSubscribe }
  
  mockOn.mockReturnValue(mockChann)
  mockSubscribe.mockReturnValue(mockChann)
  
  return {
    supabase: {
      from: vi.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: [
                { id: '1', topic: 'Test topic', status: 'pending_review', keywords: ['web design'], created_at: '2026-01-01', platform_posts: [] }
              ],
              error: null
            })
          })
        })
      })),
      channel: vi.fn(() => mockChann),
      removeChannel: mockRemoveChannel,
    },
  }
})

import { useDrafts } from '../../hooks/useDrafts.js'

describe('useDrafts', () => {
  it('returns loading true initially', () => {
    const { result } = renderHook(() => useDrafts())
    expect(result.current.loading).toBe(true)
  })

  it('returns drafts after fetch', async () => {
    const { result } = renderHook(() => useDrafts())
    await act(async () => {})
    expect(result.current.drafts).toHaveLength(1)
    expect(result.current.drafts[0].topic).toBe('Test topic')
    expect(result.current.loading).toBe(false)
  })
})
