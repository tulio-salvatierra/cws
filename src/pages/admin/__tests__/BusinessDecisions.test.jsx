import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ update: vi.fn(), from: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { from: mocks.from } }))
import BusinessDecisions from '../BusinessDecisions'
const row = { id: 'a', workspace_id: 'w', title: 'Offer candidate', decision: 'Keep this offer', status: 'proposed', review_by: '2026-12-31', revisit_condition: 'Four signed agreements', updated_at: 'v1', review_reasons: [] }
const reload = vi.fn()
const show = (overrides = {}) => render(<BusinessDecisions summary={{ available: true, items: [row], can_manage: true, ...overrides }} onReload={reload} />)
beforeEach(() => {
  vi.clearAllMocks()
  const chain = { eq: vi.fn(() => chain), select: vi.fn().mockResolvedValue({ data: [{ id: 'a' }] }) }
  mocks.update.mockReturnValue(chain)
  mocks.from.mockReturnValue({ update: mocks.update })
})
describe('Business decisions owner controls', () => {
  it('shows a source-backed advisory without adding mutation authority', () => {
    const evaluation = { verdict: 'needs_data', policy_version: 'decision-review-v1', business_date: '2026-10-21', time_zone: 'America/Chicago', next_action: 'Complete review details.', missing_data: ['review_by'], assumptions: ['Owner-observed conditions only.'], why: [{ claim: 'Review date is not recorded.', source: { table: 'business_decisions', id: row.id, fields: { review_by: null } } }] }
    show({ can_manage: false, items: [{ ...row, evaluation }] })
    expect(screen.getByText('Laya · needs data')).toBeInTheDocument()
    expect(screen.getByText('Complete review details.')).toBeInTheDocument()
    expect(screen.getByText(/Missing or invalid data: review_by/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Why · Source evidence'))
    expect(screen.getByText('Review date is not recorded.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Source: business_decisions/ })).toHaveAttribute('href', '#business-decision-a')
    expect(screen.getByText(/never activates or changes a decision/)).toBeInTheDocument()
    expect(screen.queryByText('Review activation')).not.toBeInTheDocument()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('does not write on rendering, reload, or reviewing activation', () => {
    show()
    fireEvent.click(screen.getByText('Review activation'))
    expect(screen.getByText('I activate this decision')).toBeInTheDocument()
    expect(mocks.update).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Cancel activation'))
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('requires the explicit owner action and reloads the durable result', async () => {
    show()
    fireEvent.click(screen.getByText('Review activation'))
    fireEvent.click(screen.getByText('I activate this decision'))
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(mocks.update).toHaveBeenCalledWith({ status: 'active' })
    const chain = mocks.update.mock.results[0].value
    expect(chain.eq).toHaveBeenCalledWith('updated_at', 'v1')
    expect(chain.eq).toHaveBeenCalledWith('workspace_id', 'w')
  })
  it('does not offer activation to a member', () => {
    show({ can_manage: false })
    expect(screen.queryByText('Review activation')).not.toBeInTheDocument()
  })
  it('explains missing review terms before allowing activation', () => {
    show({ items: [{ ...row, revisit_condition: null }] })
    fireEvent.click(screen.getByText('Review activation'))
    expect(screen.getByText(/Set a review date/)).toBeInTheDocument()
    expect(screen.queryByText('I activate this decision')).not.toBeInTheDocument()
  })
  it('reports stale writes without claiming success', async () => {
    show()
    const chain = { eq: vi.fn(() => chain), select: vi.fn().mockResolvedValue({ data: [] }) }
    mocks.update.mockReturnValue(chain)
    fireEvent.click(screen.getByText('Review activation'))
    fireEvent.click(screen.getByText('I activate this decision'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/decision changed/)
    expect(reload).not.toHaveBeenCalled()
  })
})
