import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import BusinessExpenses from '../BusinessExpenses.jsx'
import { businessToday } from '../../../lib/businessExpenses.js'

describe('Business expenses', () => {
  it('saves an annual subscription without recording a payment', async () => {
    const onAction = vi.fn().mockResolvedValue({ ok: true })
    render(<BusinessExpenses onAction={onAction} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add subscription' }))
    fireEvent.change(screen.getByLabelText('Name / vendor'), { target: { value: 'Hosting' } })
    fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '240' } })
    fireEvent.change(screen.getByLabelText('Billing frequency'), { target: { value: 'annual' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save subscription' }))
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'save_expense_subscription', amount_cents: 24000, cadence: 'annual' })))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
  it('requires confirmation of the actual variable charge before recording payment', async () => {
    const onAction = vi.fn().mockResolvedValue({ ok: true })
    render(<BusinessExpenses subscriptions={[{ id: 's1', name: 'API', category: 'Software', amount_cents: 2000, variable: true, cadence: 'monthly', status: 'active', billing_anchor: businessToday(), next_cycle: 0 }]} onAction={onAction} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mark API paid' }))
    expect(onAction).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Actual amount paid (USD)'), { target: { value: '23.49' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm expense payment' }))
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'pay_business_expense', kind: 'subscription', id: 's1', cycle: 0, amount_cents: 2349 })))
  })
})
