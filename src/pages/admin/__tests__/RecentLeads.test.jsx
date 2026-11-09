import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { getSession } } }))

import RecentLeads from '../RecentLeads'

const lead = { id: 'lead-1', business: 'Third City Cafe', contact_name: null, email: null, phone: '+17735550100', locality: 'Chicago', status: 'new', response_state: 'no_response', sales_classification: 'prospect', added_on: '2026-11-08', contacted_on: null, hypothesis: 'New cafe with an empty Google profile.', address: '5534 W North Ave' }
const summary = { available: true, since: '2026-11-03', total: 1, items: [lead] }
const sent = () => JSON.parse(globalThis.fetch.mock.calls[0][1].body)

function renderList(onReload = vi.fn().mockResolvedValue()) {
  render(<MemoryRouter><RecentLeads summary={summary} onReload={onReload} /></MemoryRouter>)
  return onReload
}

describe('RecentLeads', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'owner-token' } } })
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('lists the lead with its context and a phone link, without calling anything on load', () => {
    renderList()
    expect(screen.getByRole('heading', { name: 'Third City Cafe' })).toBeInTheDocument()
    expect(screen.getByText('New cafe with an empty Google profile.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Call' })).toHaveAttribute('href', 'tel:+17735550100')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('logs a call through the Sales endpoint and reloads', async () => {
    const reload = renderList()
    fireEvent.click(screen.getByRole('button', { name: 'Log call' }))
    await waitFor(() => expect(reload).toHaveBeenCalled())
    expect(globalThis.fetch.mock.calls[0][0]).toBe('/api/command-queue')
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer owner-token')
    expect(sent()).toEqual({ action: 'record_call', lead_id: 'lead-1' })
    expect(screen.getByRole('status')).toHaveTextContent('Third City Cafe: call logged. Recorded only; nothing was sent.')
  })

  it('marks replied while sending back the phone, locality and classification', async () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: 'Replied' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(sent()).toEqual({ action: 'update_lead_sales_state', lead_id: 'lead-1', sales_classification: 'prospect', response_state: 'warm', status: 'responded', phone: '+17735550100', locality: 'Chicago' })
  })

  it('saves a dated follow-up as a promised action', async () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: 'Follow-up…' }))
    fireEvent.change(screen.getByLabelText('Due'), { target: { value: '2026-11-12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save follow-up' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(sent()).toEqual({ action: 'create_promised_action', lead_id: 'lead-1', action_text: 'Follow up with Third City Cafe', due_on: '2026-11-12' })
  })

  it('shows the server error and keeps the list', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false, error: 'Lead not found.' }) })
    const reload = renderList()
    fireEvent.click(screen.getByRole('button', { name: 'Not interested' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Lead not found.')
    expect(reload).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Third City Cafe' })).toBeInTheDocument()
  })

  it('shows the recorded angle, website status, facts and opener', () => {
    const angled = { ...lead, angle: 'Unlinked site', website_status: 'not_linked', website: 'sites.google.com/view/example', angle_facts: ['No website on Google', '108 reviews'], angle_opener: 'I can connect your site to Google for free.', angle_upsell: 'Básico', angle_checked_at: '2026-11-09' }
    render(<MemoryRouter><RecentLeads summary={{ ...summary, items: [angled] }} onReload={vi.fn()} /></MemoryRouter>)
    expect(screen.getByText('Unlinked site')).toBeInTheDocument()
    expect(screen.getByText('Site not linked on Google')).toHaveAttribute('title', 'sites.google.com/view/example')
    expect(screen.getByText('108 reviews')).toBeInTheDocument()
    expect(screen.getByText(/I can connect your site to Google for free\./)).toBeInTheDocument()
    expect(screen.queryByText('New cafe with an empty Google profile.')).not.toBeInTheDocument()
  })
})
