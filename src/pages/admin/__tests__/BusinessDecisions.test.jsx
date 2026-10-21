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
