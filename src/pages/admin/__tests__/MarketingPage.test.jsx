import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))
vi.mock('../../../Hooks/useAuth', () => ({ useAuth: useAuthMock }))
// Keep publisher regression tests independent from the separately tested assessment panel.
vi.mock('../../../components/admin/LayaAssessmentPanel', () => ({ default: () => null }))

import MarketingPage from '../MarketingPage'

const verifiedDestinations = [
  { platform: 'GOOGLE_BUSINESS', name: 'Google Business Profile — Cicero Web Studio', verification_state: 'verified', channel_name: 'Cicero Web Studio' },
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

function creativeBody(overrides = {}) {
  return { idea_runs: [], creative_assets: [], ...overrides }
}

function catalogOffer() {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Website Refresh',
    description: 'A focused refresh for an existing business website.',
    price_mode: 'by_scope',
    price_cents: null,
    price_display: 'Price by scope',
    price_display_override: null,
    default_project_type: 'website',
    status: 'active',
    media: [],
    captions: [],
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
    expect(window.confirm).toHaveBeenCalledWith('Publish Post A — Website Launch — to LinkedIn, Facebook, Instagram, and Google Business Profile?\n\nAll four channels use the shared caption.')
  })

  it('cannot invoke Post B before the server authorizes that specific slot', async () => {
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Awaiting prior slot' }))
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('saves a draft offer as catalog reference data without confirming a post', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(statusBody({ offer_catalog: [] })))
      .mockResolvedValueOnce(response({ ok: true, offer_catalog: [{
        id: 'offer-a', name: 'Website Refresh', description: 'A focused refresh for an existing website.', price_mode: 'by_scope', price_cents: null, price_display: 'Price by scope', price_display_override: null, default_project_type: 'website', status: 'draft', media: [], captions: [],
      }] }))
      .mockResolvedValueOnce(response(creativeBody()))
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save offer' })).toBeEnabled())
    fireEvent.change(screen.getByLabelText('Offer name'), { target: { value: 'Website Refresh' } })
    fireEvent.change(screen.getByLabelText('Offer description'), { target: { value: 'A focused refresh for an existing website.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save offer' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))

    const [, options] = globalThis.fetch.mock.calls[1]
    expect(JSON.parse(options.body)).toMatchObject({
      action: 'save_marketing_offer',
      offer: { name: 'Website Refresh', status: 'draft', price_mode: 'by_scope', price_cents: null },
    })
    expect(JSON.parse(options.body).owner_confirmation_token).toBeUndefined()
    expect(screen.getByRole('heading', { name: 'Website Refresh' })).toBeInTheDocument()
  })

  it('shows saved captions and updates the selected record without publishing or duplicating it', async () => {
    const offer = { ...catalogOffer(), captions: [
      { id: 'caption-1', offer_id: catalogOffer().id, body: 'Find your business locally.', locale: 'en', platform: null, status: 'active' },
      { id: 'caption-2', offer_id: catalogOffer().id, body: 'A separate LinkedIn caption.', locale: 'en', platform: 'linkedin', status: 'draft' },
    ] }
    const updated = { ...offer.captions[0], body: 'Que encuentren tu negocio.', locale: 'es', platform: 'meta', status: 'draft' }
    globalThis.fetch = vi.fn().mockResolvedValueOnce(response(statusBody({ offer_catalog: [offer] })))
      .mockResolvedValueOnce(response(creativeBody()))
      .mockResolvedValueOnce(response({ ok: true, offer_catalog: [{ ...offer, captions: [updated, offer.captions[1]] }] }))
    render(<MarketingPage />)
    const library = await screen.findByRole('region', { name: 'Saved captions for Website Refresh' })
    expect(within(library).getByText('Find your business locally.')).toBeInTheDocument()
    expect(within(library).getByText('English · Shared (all channels) · active')).toBeInTheDocument()
    fireEvent.click(within(library).getByRole('button', { name: 'Edit caption 1 for Website Refresh' }))
    const editor = within(library).getByRole('form', { name: 'Edit saved caption for Website Refresh' })
    fireEvent.change(within(editor).getByLabelText('Caption text'), { target: { value: updated.body } })
    fireEvent.change(within(editor).getByLabelText('Language'), { target: { value: 'es' } })
    fireEvent.change(within(editor).getByLabelText('Channel'), { target: { value: 'meta' } })
    fireEvent.change(within(editor).getByLabelText('Status'), { target: { value: 'draft' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save caption changes' }))
    await screen.findByText('Caption updated.')
    expect(JSON.parse(globalThis.fetch.mock.calls[2][1].body)).toEqual({ action: 'save_marketing_offer_caption', caption: updated })
    expect(within(library).getByText(updated.body)).toHaveAttribute('lang', 'es')
    expect(within(library).getByText('Spanish · Meta (Facebook + Instagram) · draft')).toBeInTheDocument()
    expect(within(library).getByText('A separate LinkedIn caption.')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('keeps edits after a failed save and lets the owner cancel without changing saved text', async () => {
    const offer = { ...catalogOffer(), captions: [{ id: 'caption-1', body: 'Saved Spanish text.', locale: 'es', platform: null, status: 'active' }] }
    globalThis.fetch = vi.fn().mockResolvedValueOnce(response(statusBody({ offer_catalog: [offer] })))
      .mockResolvedValueOnce(response(creativeBody()))
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'The database is unavailable.' }) })
    render(<MarketingPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit caption 1 for Website Refresh' }))
    const editor = screen.getByRole('form', { name: 'Edit saved caption for Website Refresh' })
    fireEvent.change(within(editor).getByLabelText('Caption text'), { target: { value: 'Unsaved replacement.' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save caption changes' }))
    await screen.findByText('Your changes were not saved. Your edits are still here; please try again.')
    expect(within(editor).getByLabelText('Caption text')).toHaveValue('Unsaved replacement.')
    fireEvent.click(within(editor).getByRole('button', { name: 'Cancel caption edit' }))
    expect(screen.getByText('Saved Spanish text.')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Unsaved replacement.')).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  it('prevents saving an existing caption that exceeds its newly selected channel limit', async () => {
    const offer = { ...catalogOffer(), captions: [{ id: 'caption-1', body: 'x'.repeat(1501), locale: 'en', platform: null, status: 'active' }] }
    globalThis.fetch = vi.fn().mockResolvedValue(response(statusBody({ offer_catalog: [offer] })))
    render(<MarketingPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit caption 1 for Website Refresh' }))
    const editor = screen.getByRole('form', { name: 'Edit saved caption for Website Refresh' })
    fireEvent.change(within(editor).getByLabelText('Channel'), { target: { value: 'google_business' } })
    expect(within(editor).getByRole('button', { name: 'Save caption changes' })).toBeDisabled()
    expect(within(editor).getByRole('alert')).toHaveTextContent('Shorten this caption')
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('keeps Spanish captions visible without counting them or channel-only English captions as rotation-ready', async () => {
    const offer = { ...catalogOffer(), media: [{ status: 'active', linkedin_compatible: true, facebook_compatible: true, instagram_compatible: true }], captions: [
      { id: 'spanish', body: 'Encuentra tu negocio.', locale: 'es', platform: null, status: 'active' },
      { id: 'channel-only', body: 'LinkedIn only.', locale: 'en', platform: 'linkedin', status: 'active' },
    ] }
    globalThis.fetch = vi.fn().mockResolvedValue(response(statusBody({ offer_catalog: [offer] })))
    render(<MarketingPage />)
    expect(await screen.findByText('Encuentra tu negocio.')).toBeInTheDocument()
    expect(screen.getByText('Stored in Spanish; not used in the current English rotation.')).toBeInTheDocument()
    expect(screen.getByText(/No catalog offer is active and shared-channel ready yet/)).toBeInTheDocument()
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

describe('MarketingPage Creative Studio', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ session: { access_token: 'access-token' } })
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('creates ideas only through an explicit owner action and never confirms a post', async () => {
    const offer = catalogOffer()
    const run = {
      id: '22222222-2222-4222-8222-222222222222',
      offer_id: offer.id,
      status: 'needs_review',
      output: { ideas: [
        { id: 'idea-1', title: 'Clarify the next step', hook: 'A clearer route from interest to action.', caption: 'A concise review caption.', visual_prompt: 'A calm work space.', cta: 'Ask about a focused refresh.' },
        { id: 'idea-2', title: 'Show the work', hook: 'Make the service easier to understand.', caption: 'A second review caption.', visual_prompt: 'A bright workspace.', cta: 'Explore the service.' },
        { id: 'idea-3', title: 'Keep it current', hook: 'Small updates can keep information clear.', caption: 'A third review caption.', visual_prompt: 'A simple storefront detail.', cta: 'Start a conversation.' },
      ] },
    }
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(statusBody({ offer_catalog: [offer] })))
      .mockResolvedValueOnce(response(creativeBody()))
      .mockResolvedValueOnce(response({ ok: true, run }))
      .mockResolvedValueOnce(response(creativeBody({ idea_runs: [run] })))
      .mockResolvedValueOnce(response(statusBody({ offer_catalog: [offer] })))

    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate ideas for Website Refresh' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Generate ideas for Website Refresh' }))

    await waitFor(() => expect(screen.getByText('Clarify the next step')).toBeInTheDocument())
    const [, options] = globalThis.fetch.mock.calls[2]
    expect(globalThis.fetch.mock.calls[2][0]).toBe('/api/marketing-creative')
    expect(JSON.parse(options.body)).toMatchObject({ action: 'generate_story_ideas', offer_id: offer.id })
    expect(JSON.parse(options.body).request_key).toMatch(/^[0-9a-f-]{36}$/i)
    expect(globalThis.fetch.mock.calls.every(([url]) => url === '/api/marketing-linkedin' || url === '/api/marketing-creative')).toBe(true)
    expect(globalThis.fetch.mock.calls.some(([, request]) => request?.body?.includes('owner_confirmation_token'))).toBe(false)
    expect(window.confirm).not.toHaveBeenCalled()
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

describe('MarketingPage failed-slot recovery', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ session: { access_token: 'access-token' } })
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('closes an all-error slot without sending a caption, reference key, or publish request', async () => {
    const failedAttempt = { id: 'm5-attempt', provider_status: 'error' }
    const failedResults = [
      { id: 'li', platform: 'LINKEDIN', provider_status: 'error', provider_error: 'Image ratio is unsupported.' },
      { id: 'fb', platform: 'FACEBOOK', provider_status: 'error', provider_error: 'Image ratio is unsupported.' },
      { id: 'ig', platform: 'INSTAGRAM', provider_status: 'error', provider_error: 'Image ratio is unsupported.' },
    ]
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(statusBody({ slots: [slot('post-a', 'failed', failedAttempt, failedResults), slot('post-b')] })))
      .mockResolvedValueOnce(response({ ok: true, decision: 'close_failed' }))
      .mockResolvedValueOnce(response(statusBody({ slots: [slot('post-a', 'resolved', failedAttempt, failedResults), slot('post-b')] })))

    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close failed slot' })).toBeEnabled())
    expect(screen.getByText('Failed — close required')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close failed slot' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3))

    const [, options] = globalThis.fetch.mock.calls[1]
    expect(JSON.parse(options.body)).toEqual({
      action: 'close_failed', slot_key: '2026-09-07:post-a', asset_id: 'website-launch', owner_confirmation_token: 'post-a-confirmation-token',
    })
    expect(window.confirm).toHaveBeenCalledWith('Close this failed slot? The failed attempt will remain in history. Nothing will be retried or published.')
    expect(screen.queryByRole('button', { name: 'Close failed slot' })).not.toBeInTheDocument()
  })
})


describe('Marketing channel tabs', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ session: { access_token: 'access-token' } })
    globalThis.fetch = vi.fn().mockResolvedValue(response(statusBody()))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('previews Google without publishing and preserves shared caption edits across tabs', async () => {
    render(<MarketingPage />)
    const caption = await screen.findByRole('textbox', { name: 'Post A caption' })
    fireEvent.change(caption, { target: { value: 'Shared caption for every channel.' } })
    const calls = globalThis.fetch.mock.calls.length
    fireEvent.click(screen.getByRole('tab', { name: 'Google Business Profile' }))
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'channel-panel-GOOGLE_BUSINESS')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Shared caption for every channel.')
    expect(screen.getAllByRole('link', { name: 'Learn more →' })[0]).toHaveAttribute('href', 'https://cicerowebstudio.xyz/')
    expect(globalThis.fetch).toHaveBeenCalledTimes(calls)
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Google Business Profile' }), { key: 'Home' })
    expect(screen.getByRole('textbox', { name: 'Post A caption' })).toHaveValue('Shared caption for every channel.')
  })

  it('blocks confirmation when the shared caption exceeds the Google limit', async () => {
    render(<MarketingPage />)
    fireEvent.change(await screen.findByRole('textbox', { name: 'Post A caption' }), { target: { value: 'x'.repeat(1501) } })
    expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeDisabled()
  })
})

describe('Marketing per-channel captions', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ session: { access_token: 'access-token' } })
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('prefills channel captions from the catalog, lets the owner edit one channel, and sends exactly those texts on Confirm', async () => {
    const withDefaults = { ...slot('post-a'), platform_captions: { FACEBOOK: 'Meta default.', INSTAGRAM: 'Meta default.' } }
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(response(statusBody({ slots: [withDefaults, slot('post-b')] })))
      .mockResolvedValue(response({ ok: true }))
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeEnabled())

    fireEvent.click(screen.getByRole('tab', { name: 'Facebook' }))
    expect(screen.getByRole('textbox', { name: 'Post A Facebook caption' })).toHaveValue('Meta default.')

    fireEvent.click(screen.getByRole('tab', { name: 'LinkedIn' }))
    expect(screen.getByRole('textbox', { name: 'Post A LinkedIn caption' })).toHaveValue('Launch clearly.')
    fireEvent.change(screen.getByRole('textbox', { name: 'Post A LinkedIn caption' }), { target: { value: 'LinkedIn-only text.' } })
    expect(screen.getAllByTestId('channel-preview-caption-LINKEDIN')[0]).toHaveTextContent('LinkedIn-only text.')

    fireEvent.click(screen.getByRole('tab', { name: 'Weekly overview' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Post A' }))
    await waitFor(() => expect(globalThis.fetch.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(true))
    const [, options] = globalThis.fetch.mock.calls.find(([, call]) => call?.method === 'POST')
    expect(JSON.parse(options.body)).toMatchObject({
      caption: 'Launch clearly.',
      platform_captions: { LINKEDIN: 'LinkedIn-only text.', FACEBOOK: 'Meta default.', INSTAGRAM: 'Meta default.' },
    })
    expect(JSON.parse(options.body).platform_captions.GOOGLE_BUSINESS).toBeUndefined()
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Channel-specific text: LinkedIn, Facebook, Instagram.'))
  })

  it('blocks Confirm when a channel caption exceeds that channel limit and restores the shared caption on request', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response(statusBody()))
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeEnabled())
    fireEvent.click(screen.getByRole('tab', { name: 'Instagram' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Post A Instagram caption' }), { target: { value: 'x'.repeat(2201) } })
    expect(screen.getAllByRole('alert').some(node => node.textContent.includes('2,200'))).toBe(true)
    fireEvent.click(screen.getByRole('tab', { name: 'Weekly overview' }))
    expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeDisabled()
    fireEvent.click(screen.getByRole('tab', { name: 'Instagram' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Use shared caption' })[0])
    expect(screen.getByRole('textbox', { name: 'Post A Instagram caption' })).toHaveValue('Launch clearly.')
    fireEvent.click(screen.getByRole('tab', { name: 'Weekly overview' }))
    expect(screen.getByRole('button', { name: 'Confirm Post A' })).toBeEnabled()
  })
})
