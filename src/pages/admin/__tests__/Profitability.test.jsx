import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Profitability from '../Profitability'
import { businessToday } from '../../../lib/businessExpenses'
const date = businessToday()
const props = { receipts: [], expenses: [], projectCosts: [], subscriptions: [], month: date.slice(0,7), loaded: true, onMonthChange: vi.fn(), onAction: vi.fn() }
describe('profitability overview', () => {
  it('shows a loss when confirmed costs exceed received cash', () => {
    render(<Profitability {...props} expenses={[{ amount_cents: 2300, paid_on: date }]} />)
    expect(screen.getByText('More money went out than came in.')).toBeInTheDocument()
    expect(screen.getAllByText('-$23.00').length).toBe(2)
  })
  it('does not show zero profit while Accounting has not loaded', () => {
    render(<Profitability {...props} loaded={false} />)
    expect(screen.queryByText('Cash profit / loss')).not.toBeInTheDocument()
  })
  it('requires a date confirmation before marking an old project cost paid', async () => {
    const action = vi.fn().mockResolvedValue({ ok: true })
    render(<Profitability {...props} onAction={action} projectCosts={[{ id: 'p1', description: 'Domain', incurred_on: date, amount_cents: 2000 }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm payment date' }))
    expect(action).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm project cost paid' }))
    await waitFor(() => expect(action).toHaveBeenCalledWith({ action: 'mark_project_cost_paid', id: 'p1', paid_on: date }))
  })
})
