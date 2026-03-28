import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GenerateButton from '../GenerateButton'

global.fetch = vi.fn()

describe('GenerateButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the button', () => {
    render(<GenerateButton webhookUrl="https://example.com/webhook" />)
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
  })

  it('shows generating state while loading', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true })
    render(<GenerateButton webhookUrl="https://example.com/webhook" />)
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    expect(screen.getByText(/generating/i)).toBeInTheDocument()
    await vi.runAllTimersAsync()
    expect(screen.queryByText(/generating/i)).not.toBeInTheDocument()
  })

  it('calls the webhook URL on click', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true })
    render(<GenerateButton webhookUrl="https://example.com/webhook/wf2" />)
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    await vi.runAllTimersAsync()
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/webhook/wf2',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
