import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { getSession } } }))

import SignNegocioListoForm from '../SignNegocioListoForm'

const lead = { id: '33333333-3333-4333-8333-333333333333', business: 'Third City Cafe', email: 'owner@thirdcity.example', phone: '+17735550100' }

describe('SignNegocioListoForm', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'owner-token' } } })
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, setup_paid_on: '2026-11-09', billing_start_date: '2026-11-23', monthly_cents: 25000, square: { requested: true, ok: true, start_date: '2026-11-23' } }) })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows the 14-day start and posts the signing to Accounting', async () => {
    const onClose = vi.fn()
    render(<SignNegocioListoForm lead={lead} onCancel={vi.fn()} onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('$300 setup paid on'), { target: { value: '2026-11-09' } })
    fireEvent.change(screen.getByLabelText('Plan'), { target: { value: 'crecer' } })
    expect(screen.getByText('Nov 23, 2026', { selector: 'strong' })).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Record signing' }))
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('/api/accounting')
    expect(JSON.parse(options.body)).toMatchObject({ action: 'sign_negocio_listo', lead_id: lead.id, client_name: 'Third City Cafe', plan: 'crecer', setup_paid_on: '2026-11-09', setup_method: 'zelle', create_square_subscription: true })
    expect(await screen.findByRole('status')).toHaveTextContent('Square will email the first invoice on Nov 23, 2026')
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows the server error and keeps the form', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false, error: 'The agreement could not be recorded: Owner required' }) })
    render(<SignNegocioListoForm lead={lead} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record signing' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Owner required')
    expect(screen.getByRole('button', { name: 'Record signing' })).toBeInTheDocument()
  })
})
