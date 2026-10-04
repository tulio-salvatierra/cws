import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { getSession } } }))

import CompliancePage from '../CompliancePage.jsx'

function response(payload) { return { ok: true, json: vi.fn().mockResolvedValue(payload) } }

const requirement = {
  id: 'requirement-a', title: 'Illinois annual report', category: 'filing', authority_name: 'Illinois Secretary of State', source_url: 'https://www.ilsos.gov/', jurisdiction: 'Illinois', description: 'Annual business filing.', applicability_status: 'needs_verification', verified_by_owner_at: null, recurrence_type: 'annual', recurrence_interval: null, next_due_date: null, compliance_state: 'unverified', human_reason: 'Owner verification is required before this can be treated as a CWS obligation.', completions: [],
}
const state = {
  ok: true,
  compliance: {
    summary: { verified_requirements: 0, needs_verification: 1, approaching: 0, due: 0, overdue: 0, attention_message: '1 requirement needs owner verification.' },
    requirements: [requirement], recent_completions: [], ceo_projection: [{ requirement_id: 'requirement-a', compliance_state: 'compliance_needs_verification' }],
  },
}

describe('CompliancePage', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'access-token' } } })
    globalThis.fetch = vi.fn().mockResolvedValue(response(state))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('loads the durable Compliance read model with an authenticated GET and does not present an unverified record as all-clear', async () => {
    render(<CompliancePage />)
    expect(await screen.findByRole('heading', { name: 'Compliance' })).toBeInTheDocument()
    expect(screen.getByText('1 requirement needs owner verification.')).toBeInTheDocument()
    expect(screen.getByText('Illinois annual report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verify applies' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark not applicable' })).toBeInTheDocument()
    expect(screen.queryByText(/Nothing requiring attention/i)).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/compliance', { headers: { Authorization: 'Bearer access-token' } })
    expect(globalThis.fetch.mock.calls[0][1]?.method).toBeUndefined()
  })

  it('requires an explicit owner confirmation before changing an unverified requirement to applies', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(state))
      .mockResolvedValueOnce(response({ ok: true, requirement: { ...requirement, applicability_status: 'applies' } }))
      .mockResolvedValueOnce(response(state))
    render(<CompliancePage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Verify applies' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))
    expect(globalThis.fetch.mock.calls[1][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ action: 'verify_compliance_requirement_applies', compliance_requirement_id: 'requirement-a' }) })
  })

  it('creates only a possible requirement through an explicit owner POST', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response({ ...state, compliance: { ...state.compliance, requirements: [], summary: { ...state.compliance.summary, needs_verification: 0, attention_message: 'No verified Compliance deadlines currently require attention.' } } }))
      .mockResolvedValueOnce(response({ ok: true, requirement: { id: 'created' } }))
      .mockResolvedValueOnce(response(state))
    render(<CompliancePage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add possible requirement' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Illinois annual report' } })
    fireEvent.change(screen.getByLabelText('Authority'), { target: { value: 'Illinois Secretary of State' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Annual business filing.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save requirement' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))
    expect(globalThis.fetch.mock.calls[1][1]).toMatchObject({ method: 'POST', body: expect.stringContaining('"action":"create_possible_compliance_requirement"') })
    expect(globalThis.fetch.mock.calls[1][1].body).not.toContain('verified_by_owner')
  })
})
