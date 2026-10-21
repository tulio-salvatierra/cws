import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { getSession } } }))
import LayaResponseHistory from '../LayaResponseHistory'

const items = ['decision_review', 'goal_pace', 'deal_fit'].map((evaluator, i) => ({
  id: String(i), evaluator, subject_type: i ? 'lead' : 'business_decision', subject_id: `subject-${i}`,
  response: i ? 'dismiss' : 'act', reason: `Saved reason ${i}`, created_at: '2026-10-21T20:00:00Z',
  input_snapshot: { historical_value: `original-${i}` },
  evaluation: { policy_version: 'saved-v1', business_date: '2026-10-20', verdict: 'needs_data' },
}))
const page = (rows = items, next = null) => ({ can_view: true, available: true, items: rows, limit: 30, type: 'all', next_cursor: next })
const response = history => ({ ok: true, json: async () => ({ laya_response_history: history }) })
beforeEach(() => { getSession.mockResolvedValue({ data: { session: { access_token: 'owner-jwt' } } }); vi.stubGlobal('fetch', vi.fn()) })
afterEach(() => vi.unstubAllGlobals())

describe('paginated Laya history', () => {
  it('filters each type across server history with exact saved evidence and GET only', async () => {
    render(<LayaResponseHistory history={page()} />)
    expect(screen.getAllByRole('article')).toHaveLength(3)
    for (const [index, evaluator] of ['decision_review', 'goal_pace', 'deal_fit'].entries()) {
      fetch.mockResolvedValueOnce(response(page([items[index]])))
      fireEvent.change(screen.getByLabelText('Review type'), { target: { value: evaluator } })
      await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
      expect(await screen.findByText(`Reason: Saved reason ${index}`)).toBeInTheDocument()
      fireEvent.click(screen.getByText('Saved input snapshot and evaluation'))
      expect(screen.getByText(new RegExp(`original-${index}`))).toHaveTextContent('saved-v1')
      expect(fetch).toHaveBeenLastCalledWith(`/api/ceo-today?view=laya_history&type=${evaluator}`, { headers: { Authorization: 'Bearer owner-jwt' } })
    }
    expect(screen.queryByRole('button', {name:/activate|publish|send|save/i})).not.toBeInTheDocument()
  })
  it('loads older pages, returns newer, and resets pagination on type change', async () => {
    fetch.mockResolvedValueOnce(response(page([items[1]], 'next-2'))).mockResolvedValueOnce(response(page([items[2]])))
    render(<LayaResponseHistory history={page([items[0]], 'next-1')} />)
    expect(screen.getByRole('button', {name:'Newer responses'})).toBeDisabled()
    fireEvent.click(screen.getByRole('button', {name:'Older responses'}))
    expect(await screen.findByText('Reason: Saved reason 1')).toBeInTheDocument()
    expect(screen.getByText(/Page 2/)).toBeInTheDocument()
    expect(fetch).toHaveBeenLastCalledWith('/api/ceo-today?view=laya_history&type=all&cursor=next-1', expect.anything())
    fireEvent.click(screen.getByRole('button', {name:'Newer responses'}))
    expect(screen.getByText('Reason: Saved reason 0')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
    fireEvent.change(screen.getByLabelText('Review type'), { target: {value:'deal_fit'} })
    expect(await screen.findByText('Reason: Saved reason 2')).toBeInTheDocument()
    expect(screen.getByText(/Page 1/)).toBeInTheDocument()
    expect(screen.getByRole('button', {name:'Older responses'})).toBeDisabled()
  })
  it('keeps page/filter on failure and retries the exact position', async () => {
    fetch.mockResolvedValueOnce({ok:false,json:async()=>({error:'Read failed'})}).mockResolvedValueOnce(response(page([items[2]])))
    render(<LayaResponseHistory history={page([items[0]], 'older')} />)
    fireEvent.click(screen.getByRole('button',{name:'Older responses'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('Read failed')
    expect(screen.getByText('Reason: Saved reason 0')).toBeInTheDocument()
    expect(screen.getByText(/Page 1/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Retry history'}))
    expect(await screen.findByText('Reason: Saved reason 2')).toBeInTheDocument()
    expect(fetch.mock.calls[0]).toEqual(fetch.mock.calls[1])
  })
  it('ignores a stale request after fresh CEO data and hides all rows from nonowners', async () => {
    let finish
    fetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const {rerender,container} = render(<LayaResponseHistory history={page([items[0]],'next')} />)
    fireEvent.click(screen.getByRole('button',{name:'Older responses'}))
    await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1))
    rerender(<LayaResponseHistory history={page([items[1]])} />)
    finish(response(page([items[2]])))
    await waitFor(()=>expect(screen.getByText('Reason: Saved reason 1')).toBeInTheDocument())
    expect(screen.queryByText('Reason: Saved reason 2')).not.toBeInTheDocument()
    rerender(<LayaResponseHistory history={{can_view:false,items}} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('distinguishes unavailable, empty and filtered empty pages', async () => {
    const {rerender} = render(<LayaResponseHistory history={{can_view:true,available:false,items}} />)
    expect(screen.getByRole('alert')).toHaveTextContent('unavailable')
    expect(screen.queryByText(/Saved reason/)).not.toBeInTheDocument()
    rerender(<LayaResponseHistory history={page([])} />)
    expect(screen.getByText('No saved Laya responses yet.')).toBeInTheDocument()
    fetch.mockResolvedValueOnce(response(page([])))
    fireEvent.change(screen.getByLabelText('Review type'),{target:{value:'deal_fit'}})
    expect(await screen.findByText('No saved responses for this type.')).toBeInTheDocument()
  })
})
