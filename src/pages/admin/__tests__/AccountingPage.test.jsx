import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AccountingPage from '../AccountingPage.jsx'
import { dollarsToCents } from '../../../lib/money.js'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { getSession } } }))

const state = {
  ok: true,
  clients: [{ id: 'client-a', name: 'Northside Auto', status: 'active' }],
  operations_projects: [],
  accounting: {
    summary: { expected_amount_cents: 150000, received_amount_cents: 75000, outstanding_amount_cents: 75000, overdue_amount_cents: 0, monthly_recurring_revenue_cents: 7000 },
    outstanding_obligations: [{ id: 'obligation-a', client: { name: 'Northside Auto' }, project: null, description: 'Final website payment', amount_cents: 75000, outstanding_amount_cents: 75000, financial_state: 'expected', due_date: null }],
    recent_receipts: [{ id: 'receipt-a', client_name: 'Northside Auto', obligation_description: 'Website deposit', amount_cents: 75000, payment_method: 'zelle', received_at: '2026-09-10T12:00:00.000Z', reference_note: null }],
    recurring_revenue: [{ id: 'recurring-a', client: { name: 'Northside Auto' }, description: 'Website care', amount_cents: 7000, status: 'active', provider: 'square', next_expected_at: '2026-10-01' }],
  },
}

function response(payload) { return { ok: true, json: vi.fn().mockResolvedValue(payload) } }

describe('AccountingPage', () => {
  beforeEach(() => { getSession.mockResolvedValue({ data: { session: { access_token: 'access-token' } } }); globalThis.fetch = vi.fn().mockResolvedValue(response(state)) })
  afterEach(() => vi.unstubAllGlobals())

  it('loads the durable read model with one authenticated GET and no provider action', async () => {
    render(<AccountingPage />)
    expect(await screen.findByRole('heading', { name: 'Accounting' })).toBeInTheDocument()
    expect(screen.getByText('$1,500.00')).toBeInTheDocument()
    expect(screen.getAllByText('$70.00').length).toBeGreaterThan(0)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/accounting', { headers: { Authorization: 'Bearer access-token' } })
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()
  })

  it('keeps financial truth behind explicit owner POSTs', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(response(state)).mockResolvedValueOnce(response({ ok: true, obligation: { id: 'created' } })).mockResolvedValueOnce(response(state))
    render(<AccountingPage />)
    await screen.findByRole('heading', { name: 'Accounting' })
    fireEvent.click(screen.getByRole('button', { name: 'Add expected payment' }))
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'client-a' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Website deposit' } })
    fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '750.00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save expected payment' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))
    expect(globalThis.fetch.mock.calls[1][1]).toMatchObject({ method: 'POST', body: expect.stringContaining('"amount_cents":75000') })
  })

  it('requires an explicit owner action to correct recurring revenue details', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(response(state)).mockResolvedValueOnce(response({ ok: true, recurring_revenue: { id: 'recurring-a' } })).mockResolvedValueOnce(response(state))
    render(<AccountingPage />)
    await screen.findByRole('heading', { name: 'Accounting' })
    fireEvent.click(screen.getByRole('button', { name: 'Edit details' }))
    expect(screen.getByRole('heading', { name: 'Edit recurring revenue' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-03-13' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save recurring revenue' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))
    expect(globalThis.fetch.mock.calls[1][1]).toMatchObject({ method: 'POST', body: expect.stringContaining('"action":"update_recurring_revenue"') })
    expect(globalThis.fetch.mock.calls[1][1].body).toContain('"started_at":"2026-03-13"')
  })

  it('parses money into integer cents without floating point input', () => {
    expect(dollarsToCents('70')).toBe(7000)
    expect(dollarsToCents('70.01')).toBe(7001)
    expect(dollarsToCents('0')).toBeNull()
    expect(dollarsToCents('-1')).toBeNull()
    expect(dollarsToCents('1.999')).toBeNull()
  })
})
