import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))
vi.mock('../../../Hooks/useAuth', () => ({ useAuth: useAuthMock }))

import MarketingPage from '../MarketingPage'

const verifiedDestinations = [
  { platform: 'LINKEDIN', name: 'LinkedIn — Cicero Web Studio Company Page', verification_state: 'verified', channel_name: 'Cicero Web Studio' },
  { platform: 'FACEBOOK', name: 'Facebook — Cicero Web Studio Page', verification_state: 'verified', channel_name: 'Cicero Web Studio' },
  { platform: 'INSTAGRAM', name: 'Instagram — Cicero Web Studio Business Account', verification_state: 'verified', channel_name: 'cicerowebstudio' },
]
const assets = {
  postA: { id: 'website-launch', asset_path: '/images/en-launch.png', label: 'Website Launch', price: '$550', default_caption: 'Launch clearly.', fallback: false },
  postB: { id: 'bilingual-website', asset_path: '/images/en-bilingual.png', label: 'Bilingual Website', price: '$1,950', default_caption: 'Serve both audiences.', fallback: false },
}

function response(body) { return { ok: true, json: vi.fn().mockResolvedValue(body) } }
function slot(key, state = 'ready', attempt = null, destinationResults = []) {
  const isA = key === 'post-a'
  return {
    key,
    slot_key: `2026-09-07:${key}`,
    label: isA ? 'Post A' : 'Post B',
    weekday: isA ? 'Tuesday' : 'Friday',
    slot_date: isA ? '2026-09-08' : '2026-09-11',
    state,
    asset: isA ? assets.postA : assets.postB,
    owner_confirmation_token: isA ? 'post-a-confirmation-token' : null,
    caption: isA ? 'Launch clearly.' : 'Serve both audiences.',
    attempt,
    destination_results: destinationResults,
  }
}
function statusBody(overrides = {}) {
  return {
    destinations: verifiedDestinations,
    slots: [slot('post-a'), slot('post-b')],
    attempt_history: [
      { id: 'm2-failed', provider_status: 'error', provider_error: 'bundle.social did not return an upload ID.' },
      { id: 'm4-posted', provider_status: 'posted', provider_permalink: 'https://www.linkedin.com/feed/update/urn:li:share:7502889252628856832' },
    ],
    storage_ready: true,
    poll_after_ms: null,
    ...overrides,
  }
}

describe('MarketingPage M5', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ session: { access_token: 'access-token' } })
    globalThis.fetch = vi.fn().mockResolvedValue(response(statusBody()))
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('shows exactly two deterministic weekly slots with editable captions and no automatic post', async () => {
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeEnabled())
    expect(screen.getByRole('heading', { name: 'Tuesday' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Friday' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Awaiting prior slot' })).toBeDisabled()
    expect(screen.getByText('This slot needs its own owner confirmation after the prior slot is complete.')).toBeInTheDocument()
    expect(screen.queryByText('Fallback asset')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Website Launch' })).toHaveAttribute('src', '/images/en-launch.png')
    expect(screen.getByRole('img', { name: 'Bilingual Website' })).toHaveAttribute('src', '/images/en-bilingual.png')
    fireEvent.change(screen.getByLabelText('Post A caption'), { target: { value: 'A clearer CWS message.' } })
    expect(screen.getByTestId('marketing-preview-caption')).toHaveTextContent('A clearer CWS message.')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/marketing-linkedin', expect.objectContaining({ method: 'GET' }))
  })

  it('uses one owner confirmation for one slot and shows independent partial outcomes', async () => {
    const partialResults = [
      { id: 'li', platform: 'LINKEDIN', provider_status: 'posted', provider_permalink: 'https://linkedin.test/post' },
      { id: 'fb', platform: 'FACEBOOK', provider_status: 'posted', provider_permalink: 'https://facebook.test/post' },
      { id: 'ig', platform: 'INSTAGRAM', provider_status: 'error', provider_error: 'Instagram permission expired.' },
    ]
    globalThis.fetch
      .mockResolvedValueOnce(response(statusBody()))
      .mockResolvedValueOnce(response({ ok: true }))
      .mockResolvedValueOnce(response(statusBody({
        slots: [slot('post-a', 'processing', { id: 'm5-attempt', provider_status: 'error' }, partialResults), slot('post-b')],
      })))
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Post A' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Slot locked' })).toBeDisabled())
    expect(screen.getAllByText('Posted')).toHaveLength(2)
    expect(screen.getByText('Instagram permission expired.')).toBeInTheDocument()
    const [, options] = globalThis.fetch.mock.calls[1]
    expect(JSON.parse(options.body)).toMatchObject({ slot_key: '2026-09-07:post-a', asset_id: 'website-launch', owner_confirmation_token: 'post-a-confirmation-token' })
    expect(JSON.parse(options.body).reference_key).toMatch(/^cws-marketing-m5:/)
    expect(window.confirm).toHaveBeenCalledWith('Publish Post A — Website Launch — to LinkedIn, Facebook, and Instagram?')
  })

  it('cannot invoke Post B before the server authorizes that specific slot', async () => {
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Awaiting prior slot' }))
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('fails closed for an unverified destination while retaining M2/M3/M4 history', async () => {
    globalThis.fetch.mockResolvedValueOnce(response(statusBody({
      destinations: [verifiedDestinations[0], { ...verifiedDestinations[1], verification_state: 'not_verified', channel_name: 'Other Business', error: 'The active provider account is not the intended CWS destination.' }, verifiedDestinations[2]],
    })))
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getAllByText('Not verified')).toHaveLength(2))
    expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeDisabled()
    expect(screen.getAllByText('The active provider account is not the intended CWS destination.')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Open LinkedIn post →' })).toHaveAttribute('href', 'https://www.linkedin.com/feed/update/urn:li:share:7502889252628856832')
    expect(screen.getByText('bundle.social did not return an upload ID.')).toBeInTheDocument()
  })
})

describe('MarketingPage M6 missed slots', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ session: { access_token: 'access-token' } })
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('shows the lean missed-slot decision controls without publishing on view', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response(statusBody({
      slots: [slot('post-a', 'missed'), slot('post-b')],
      missed_slot_signal: { state: 'owner_decision_required', slot_key: '2026-09-07:post-a', asset_id: 'website-launch' },
    })))
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByText('Missed — decision required')).toBeInTheDocument())
    expect(screen.getByText('Original scheduled day: September 8')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish now' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Move to next slot' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/marketing-linkedin', expect.objectContaining({ method: 'GET' }))
  })

  it('saves Move as an internal action with the current edited caption and no publish reference', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(statusBody({ slots: [slot('post-a', 'missed'), slot('post-b')] })))
      .mockResolvedValueOnce(response({ ok: true, decision: 'move' }))
      .mockResolvedValueOnce(response(statusBody({ slots: [slot('post-a', 'resolved'), slot('post-b')] })))
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Move to next slot' })).toBeEnabled())
    fireEvent.change(screen.getByLabelText('Post A caption'), { target: { value: 'Keep this exact caption.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Move to next slot' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))
    const [, options] = globalThis.fetch.mock.calls[1]
    expect(JSON.parse(options.body)).toEqual(expect.objectContaining({
      action: 'move', slot_key: '2026-09-07:post-a', asset_id: 'website-launch', caption: 'Keep this exact caption.', owner_confirmation_token: 'post-a-confirmation-token',
    }))
    expect(JSON.parse(options.body).reference_key).toBeUndefined()
    expect(window.confirm).toHaveBeenCalledWith('Do you want to move this post to the next scheduled slot? This will not publish anything.')
  })
})
