import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))
vi.mock('../../../Hooks/useAuth', () => ({ useAuth: useAuthMock }))

import MarketingPage from '../MarketingPage'

describe('MarketingPage', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ session: { access_token: 'access-token' } })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        destination: { ready: true, channel_name: 'Cicero Web Studio' },
        attempt: null,
        can_start_new_attempt: true,
      }),
    })
  })

  it('keeps composition local until the owner confirms and mirrors edits in the preview', async () => {
    render(<MarketingPage />)

    expect(screen.getByRole('heading', { name: 'One post, clearly previewed.' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Cicero Web Studio wordmark' })).toHaveAttribute('src', '/images/logo.png')
    expect(screen.getByText('LinkedIn — Cicero Web Studio Company Page')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled())

    fireEvent.change(screen.getByLabelText('Caption'), { target: { value: 'A clearer CWS message.' } })

    expect(screen.getByTestId('marketing-preview-caption')).toHaveTextContent('A clearer CWS message.')
    expect(screen.getByText('22 characters')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/marketing-linkedin', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
    }))
  })

  it('sends the owner confirmation once with a browser-generated reference key', async () => {
    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          destination: { ready: true, channel_name: 'Cicero Web Studio' },
          attempt: null,
          can_start_new_attempt: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          destination: { ready: true, channel_name: 'Cicero Web Studio' },
          attempt: { provider_status: 'processing', provider_error: null, provider_permalink: null },
          can_start_new_attempt: false,
        }),
      })

    render(<MarketingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(screen.getByText('Provider status: processing')).toBeInTheDocument())
    const [, options] = globalThis.fetch.mock.calls[1]
    expect(options).toMatchObject({ method: 'POST' })
    expect(JSON.parse(options.body)).toMatchObject({
      caption: 'Clear strategy. Thoughtful design. Websites built to move your business forward.',
      reference_key: expect.stringMatching(/^cws-marketing-linkedin:/),
    })
  })

  it('keeps a failed pre-post attempt visible while enabling a fresh owner-confirmed attempt', async () => {
    const previousReferenceKey = 'cws-marketing-linkedin:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          destination: { ready: true, channel_name: 'Cicero Web Studio' },
          attempt: null,
          previous_failed_attempt: {
            reference_key: previousReferenceKey,
            provider_status: 'error',
            provider_error: 'bundle.social did not return an upload ID.',
          },
          can_start_new_attempt: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          destination: { ready: true, channel_name: 'Cicero Web Studio' },
          attempt: { provider_status: 'processing', provider_error: null, provider_permalink: null },
          previous_failed_attempt: { reference_key: previousReferenceKey, provider_status: 'error' },
          can_start_new_attempt: false,
        }),
      })

    render(<MarketingPage />)

    await waitFor(() => expect(screen.getByText('Previous failed attempt preserved')).toBeInTheDocument())
    expect(screen.getByText('New attempt ready for owner confirmation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm new attempt' })).toBeEnabled()
    expect(screen.getByLabelText('Caption')).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm new attempt' }))

    await waitFor(() => expect(screen.getByText('Provider status: processing')).toBeInTheDocument())
    const [, options] = globalThis.fetch.mock.calls[1]
    const requestBody = JSON.parse(options.body)
    expect(requestBody.reference_key).toMatch(/^cws-marketing-linkedin:/)
    expect(requestBody.reference_key).not.toBe(previousReferenceKey)
  })
})
