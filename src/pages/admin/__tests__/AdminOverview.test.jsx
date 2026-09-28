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

  it('shows pending assessments separately without adding authority or changing priorities', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({ ...ceoToday, laya_reviews: { available: true, pending: [{ id: 'review-1', title: 'Five ChatGPT tips', available: false }] } }))
    render(<MemoryRouter><AdminOverview /></MemoryRouter>)
    const link = await screen.findByRole('link', { name: /Review: Five ChatGPT tips/ })
    expect(link).toHaveAttribute('href', '/admin/marketing#laya-run-review-1')
    expect(screen.getByRole('heading', { name: 'Call Chicago General Contractor' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publish|approve/i })).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('keeps department actions visible when the assessment history fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({ ...ceoToday, laya_reviews: { available: false, pending: [] } }))
    render(<MemoryRouter><AdminOverview /></MemoryRouter>)
    await screen.findByText(/Assessment history is unavailable/)
    expect(screen.getByRole('heading', { name: 'Call Chicago General Contractor' })).toBeInTheDocument()
  })

  it('renders concise routed department actions from the authenticated CEO read', async () => {
    render(<MemoryRouter><AdminOverview /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'CEO Today' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Call Chicago General Contractor', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('New prospect with no successful initial outreach.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Sales' })).toHaveAttribute('href', '/admin/sales')
    expect(screen.getByRole('link', { name: 'Go to Marketing' })).toHaveAttribute('href', '/admin/marketing')
    expect(screen.getByRole('heading', { name: 'Departments', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Operations Review active client work/ })).toHaveAttribute('href', '/admin/operations')
    expect(screen.queryByRole('link', { name: 'Workspace' })).not.toBeInTheDocument()
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

  it('renders an Operations DELIVER card without mutating its source state when set aside', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({
      ok: true,
      actions: [{
        id: 'operations:project-a',
        department: 'OPERATIONS',
        business_priority: 'DELIVER',
        human_action: 'Review Ecclection Website',
        why_now: 'Waiting on client: Project-specific requirements.',
        href: '/admin/operations/project-a',
        cta_label: 'Review project',
      }],
    }))

    render(<MemoryRouter><AdminOverview /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Review Ecclection Website', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Waiting on client: Project-specific requirements.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review project' })).toHaveAttribute('href', '/admin/operations/project-a')
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(screen.queryByRole('heading', { name: 'Review Ecclection Website', level: 2 })).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()
  })

  it('renders a read-only CONTROL MONEY card and keeps Not now local', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({
      ok: true,
      actions: [{
        id: 'accounting:financial_obligation:due-a',
        department: 'ACCOUNTING',
        business_priority: 'CONTROL MONEY',
        human_action: 'Review Accounting for Carolina Skin Centre',
        why_now: '$70.00 is due 2026-09-13.',
        href: '/admin/accounting',
        cta_label: 'Review Accounting',
      }],
    }))

    render(<MemoryRouter><AdminOverview /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Review Accounting for Carolina Skin Centre', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('$70.00 is due 2026-09-13.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review Accounting' })).toHaveAttribute('href', '/admin/accounting')
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(screen.queryByRole('heading', { name: 'Review Accounting for Carolina Skin Centre', level: 2 })).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()
  })

  it('renders a read-only PROTECT verification card and keeps Not now local', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({
      ok: true,
      actions: [{
        id: 'compliance:requirement-a',
        department: 'COMPLIANCE',
        business_priority: 'PROTECT',
        human_action: 'Verify Illinois annual report',
        why_now: 'Verify whether Illinois annual report applies. Authority to review: Illinois Secretary of State.',
        href: '/admin/compliance',
        cta_label: 'Review Compliance',
      }],
    }))

    render(<MemoryRouter><AdminOverview /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Verify Illinois annual report', level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/Verify whether Illinois annual report applies/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review Compliance' })).toHaveAttribute('href', '/admin/compliance')
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(screen.queryByRole('heading', { name: 'Verify Illinois annual report', level: 2 })).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()
  })
})
