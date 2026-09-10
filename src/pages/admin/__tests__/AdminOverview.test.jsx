import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getSession } },
}))

import AdminOverview from '../AdminOverview'

function response(payload) {
  return { ok: true, json: vi.fn().mockResolvedValue(payload) }
}

const ceoToday = {
  ok: true,
  actions: [
    {
      id: 'sales:new:lead-a',
      department: 'SALES',
      business_priority: 'GET MONEY',
      human_action: 'Call Chicago General Contractor',
      why_now: 'New prospect with no successful initial outreach.',
      href: '/admin/sales',
      cta_label: 'Go to Sales',
    },
    {
      id: 'marketing:ready:post-b',
      department: 'MARKETING',
      business_priority: 'GET MONEY',
      human_action: 'Review Marketing post',
      why_now: 'Today’s Post B is ready for owner review.',
      href: '/admin/marketing',
      cta_label: 'Go to Marketing',
    },
  ],
}

describe('AdminOverview CEO Today', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'access-token' } } })
    globalThis.fetch = vi.fn().mockResolvedValue(response(ceoToday))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('renders concise routed department actions from the authenticated CEO read', async () => {
    render(<MemoryRouter><AdminOverview /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'CEO Today' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Call Chicago General Contractor', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('New prospect with no successful initial outreach.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Sales' })).toHaveAttribute('href', '/admin/sales')
    expect(screen.getByRole('link', { name: 'Go to Marketing' })).toHaveAttribute('href', '/admin/marketing')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/ceo-today', {
      headers: { Authorization: 'Bearer access-token' },
    })
    expect(globalThis.fetch.mock.calls.every(([, options = {}]) => !options.method || options.method === 'GET')).toBe(true)
  })

  it('keeps Not now local, recalculates immediately, and restores source actions on reload', async () => {
    const first = render(<MemoryRouter><AdminOverview /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Call Chicago General Contractor', level: 2 })

    fireEvent.click(screen.getAllByRole('button', { name: 'Not now' })[0])
    expect(screen.queryByRole('heading', { name: 'Call Chicago General Contractor', level: 2 })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Review Marketing post', level: 2 })).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()

    first.unmount()
    render(<MemoryRouter><AdminOverview /></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Call Chicago General Contractor', level: 2 })).toBeInTheDocument())
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })
})
