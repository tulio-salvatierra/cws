import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { getSession } } }))

import OperationsPage from '../OperationsPage.jsx'

const state = {
  ok: true,
  operations: {
    ceo_projection: [],
    projects: [{
      id: '11111111-1111-4111-8111-111111111111', name: 'Northside Website', project_type: 'website_build', status: 'setup', delivery_state: 'waiting_on_client', blocker_count: 1, oldest_blocker_since: '2026-09-10T10:00:00.000Z', human_reason: 'Waiting on client: Business basics.', client: { name: 'Northside', contact_email: null, contact_phone: null }, readiness: { received_count: 2, applicable_count: 4, percent: 50 }, requirements: [{ id: '22222222-2222-4222-8222-222222222222', label: 'Business basics', category: 'business_basics', status: 'needed', timing: 'needed_now', responsible_party: 'client', notes: null, requested_at: '2026-09-10T10:00:00.000Z', received_at: null }],
    }],
  },
}

function response(payload) { return { ok: true, json: vi.fn().mockResolvedValue(payload) } }

describe('OperationsPage', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'access-token' } } })
    globalThis.fetch = vi.fn().mockResolvedValue(response(state))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('loads durable readiness state with one authenticated read and no external action', async () => {
    render(<MemoryRouter><OperationsPage /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Client readiness' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Northside Website' })).toBeInTheDocument()
    expect(screen.getAllByText(/Waiting on client/i).length).toBeGreaterThan(0)
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/operations', { headers: { Authorization: 'Bearer access-token' } })
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()
  })

  it('keeps requirement changes behind an explicit owner POST', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(state))
      .mockResolvedValueOnce(response({ ok: true, requirement: { id: '22222222-2222-4222-8222-222222222222' } }))
      .mockResolvedValueOnce(response(state))
    render(<MemoryRouter><OperationsPage projectId="11111111-1111-4111-8111-111111111111" /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Northside Website' })
    fireEvent.change(screen.getByLabelText('Business basics notes'), { target: { value: 'Awaiting logo.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save requirement' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))
    expect(globalThis.fetch.mock.calls[1][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ action: 'update_project_requirement', requirement_id: '22222222-2222-4222-8222-222222222222', status: 'needed', timing: 'needed_now', responsible_party: 'client', notes: 'Awaiting logo.' }) })
  })
})
