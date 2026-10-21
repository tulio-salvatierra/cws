import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LayaResponseHistory from '../LayaResponseHistory'

const items = ['decision_review', 'goal_pace', 'deal_fit'].map((evaluator, i) => ({
  id: String(i), evaluator, subject_type: i ? 'lead' : 'business_decision', subject_id: `subject-${i}`,
  response: i ? 'dismiss' : 'act', reason: `Saved reason ${i}`, created_at: '2026-10-21T20:00:00Z',
  input_snapshot: { historical_value: `original-${i}` },
  evaluation: { policy_version: 'saved-v1', business_date: '2026-10-20', verdict: 'needs_data' },
}))

describe('unified Laya history', () => {
  it('filters all saved review types and preserves exact historical evidence without writes', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    render(<LayaResponseHistory history={{ can_view: true, available: true, items, limit: 30 }} />)
    expect(screen.getAllByRole('article')).toHaveLength(3)
    for (const [index, evaluator] of ['decision_review', 'goal_pace', 'deal_fit'].entries()) {
      fireEvent.change(screen.getByLabelText('Review type'), { target: { value: evaluator } })
      expect(screen.getAllByRole('article')).toHaveLength(1)
      expect(screen.getByText(`Reason: Saved reason ${index}`)).toBeInTheDocument()
      fireEvent.click(screen.getByText('Saved input snapshot and evaluation'))
      expect(screen.getByText(new RegExp(`original-${index}`))).toHaveTextContent('saved-v1')
    }
    fireEvent.change(screen.getByLabelText('Review type'), { target: { value: 'all' } })
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
    fetch.mockRestore()
  })
  it('hides snapshots and reasons from nonowners even if supplied', () => {
    const { container } = render(<LayaResponseHistory history={{ can_view: false, items }} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('distinguishes unavailable, empty and unmatched history', () => {
    const { rerender } = render(<LayaResponseHistory history={{ can_view: true, available: false, items }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('unavailable')
    expect(screen.queryByText(/Saved reason/)).not.toBeInTheDocument()
    rerender(<LayaResponseHistory history={{ can_view: true, available: true, items: [] }} />)
    expect(screen.getByText('No saved Laya responses yet.')).toBeInTheDocument()
    rerender(<LayaResponseHistory history={{ can_view: true, available: true, items: [items[0]] }} />)
    fireEvent.change(screen.getByLabelText('Review type'), { target: { value: 'deal_fit' } })
    expect(screen.getByText('No matching responses in this history window.')).toBeInTheDocument()
  })
})
