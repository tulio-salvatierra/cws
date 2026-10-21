import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import UnsubscribePage from './UnsubscribePage'

beforeEach(() => { window.history.replaceState({}, '', '/unsubscribe?token=22222222-2222-4222-8222-222222222222'); vi.stubGlobal('fetch', vi.fn()) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('public unsubscribe page', () => {
  it('does not mutate on load; submits only after the recipient clicks and shows success', async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<UnsubscribePage />)
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe', exact: true }))
    expect(await screen.findByRole('status')).toHaveTextContent('no longer receive')
    expect(fetch).toHaveBeenCalledWith('/api/outreach/unsubscribe', expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: '22222222-2222-4222-8222-222222222222' }) }))
  })
  it('preserves legacy subscriber links and lets recipients retry a failed save', async () => {
    window.history.replaceState({}, '', '/unsubscribe?subscriber_id=legacy')
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Please try again.' }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    render(<UnsubscribePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe', exact: true }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Please try again.')
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe', exact: true }))
    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ subscriber_id: 'legacy' })
  })
  it('shows a useful error without submitting when the link is missing', () => {
    window.history.replaceState({}, '', '/unsubscribe')
    render(<UnsubscribePage />)
    expect(screen.getByRole('button', { name: 'Unsubscribe', exact: true })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Open the unsubscribe link')
    expect(fetch).not.toHaveBeenCalled()
  })
})
