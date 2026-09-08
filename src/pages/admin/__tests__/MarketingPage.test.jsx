import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))
vi.mock('../../../Hooks/useAuth', () => ({ useAuth: useAuthMock }))

import MarketingPage from '../MarketingPage'

const verifiedDestinations = [
  { platform: 'LINKEDIN', name: 'LinkedIn — Cicero Web Studio Company Page', verification_state: 'verified', channel_name: 'Cicero Web Studio' },
  { platform: 'FACEBOOK', name: 'Facebook — Cicero Web Studio Page', verification_state: 'verified', channel_name: 'Cicero Web Studio' },
  { platform: 'INSTAGRAM', name: 'Instagram — Cicero Web Studio Business Account', verification_state: 'verified', channel_name: 'cicerowebstudio' },
]

function response(body) { return { ok: true, json: vi.fn().mockResolvedValue(body) } }

describe('MarketingPage M4', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ session: { access_token: 'access-token' } })
    globalThis.fetch = vi.fn().mockResolvedValue(response({ destinations: verifiedDestinations, attempt: null, destination_results: [], attempt_history: [], storage_ready: true, can_start_new_attempt: true }))
  })

  it('shows all three verified destinations and keeps composition local before one Confirm', async () => {
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm three destinations' })).toBeEnabled())
    expect(screen.getByText('✓ LinkedIn — Cicero Web Studio Company Page')).toBeInTheDocument()
    expect(screen.getByText('✓ Facebook — Cicero Web Studio Page')).toBeInTheDocument()
    expect(screen.getByText('✓ Instagram — Cicero Web Studio Business Account')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Caption'), { target: { value: 'A clearer CWS message.' } })
    expect(screen.getByTestId('marketing-preview-caption')).toHaveTextContent('A clearer CWS message.')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/marketing-linkedin', expect.objectContaining({ method: 'GET' }))
  })

  it('uses one owner confirmation and displays independent partial outcomes', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(response({ destinations: verifiedDestinations, attempt: null, destination_results: [], attempt_history: [], storage_ready: true, can_start_new_attempt: true }))
      .mockResolvedValueOnce(response({
        destinations: verifiedDestinations,
        attempt: { id: 'm4-attempt-1', provider_status: 'error' },
        destination_results: [
          { id: 'li', platform: 'LINKEDIN', provider_status: 'posted', provider_permalink: 'https://linkedin.test/post' },
          { id: 'fb', platform: 'FACEBOOK', provider_status: 'posted', provider_permalink: 'https://facebook.test/post' },
          { id: 'ig', platform: 'INSTAGRAM', provider_status: 'error', provider_error: 'Instagram permission expired.' },
        ],
        storage_ready: true,
        can_start_new_attempt: false,
      }))
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm three destinations' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Confirm three destinations' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Destination outcomes' })).toBeInTheDocument())
    expect(screen.getAllByText('Posted')).toHaveLength(2)
    expect(screen.getByText('Instagram permission expired.')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'View post →' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Post in progress' })).toBeDisabled()
    const [, options] = globalThis.fetch.mock.calls[1]
    expect(JSON.parse(options.body).reference_key).toMatch(/^cws-marketing-m4:/)
  })

  it('fails closed in the UI for an unverified destination while retaining M2 history', async () => {
    globalThis.fetch.mockResolvedValueOnce(response({
      destinations: [verifiedDestinations[0], { ...verifiedDestinations[1], verification_state: 'not_verified', channel_name: 'Other Business', error: 'The active provider account is not the intended CWS destination.' }, verifiedDestinations[2]],
      attempt: null,
      destination_results: [],
      attempt_history: [{ id: 'm2-posted', provider_status: 'posted', provider_permalink: 'https://www.linkedin.com/feed/update/urn:li:share:7502889252628856832' }],
      storage_ready: true,
      can_start_new_attempt: true,
    }))
    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByText('Not verified')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Confirm three destinations' })).toBeDisabled()
    expect(screen.getByText('The active provider account is not the intended CWS destination.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open LinkedIn post →' })).toHaveAttribute('href', 'https://www.linkedin.com/feed/update/urn:li:share:7502889252628856832')
  })
})
