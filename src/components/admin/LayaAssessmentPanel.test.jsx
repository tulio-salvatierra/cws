import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import LayaAssessmentPanel from './LayaAssessmentPanel'
const brief = { id: 'brief', version: 2, language: 'en', audience: 'Local businesses', channels: { name: 'CWS' } }
const reply = data => ({ ok: true, json: async () => ({ ok: true, ...data }) })
afterEach(() => vi.unstubAllGlobals())
it('loads context, assesses a text snapshot and records review without publishing', async () => {
  const run = { id: 'run', input: { topic: 'Tips', draft: 'Original text', brief_snapshot: brief }, output: { laya: { available: false } }, created_at: '2026-09-28T12:00:00Z' }
  const fetch = vi.fn().mockResolvedValueOnce(reply({ briefs: [brief], assessments: [] })).mockResolvedValueOnce(reply({ assessment: run })).mockResolvedValueOnce(reply({ receipt_id: 'receipt' }))
  vi.stubGlobal('fetch', fetch)
  render(<LayaAssessmentPanel token="token" />)
  await screen.findByText('See what Laya knows about your business')
  expect(screen.getByText('Local businesses')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Title and intended platforms'), { target: { value: 'Tips' } })
  fireEvent.change(screen.getByLabelText('Asset text'), { target: { value: 'Original text' } })
  fireEvent.click(screen.getByRole('button', { name: 'Evaluate with Laya' }))
  await screen.findByText(/Laya is unavailable/)
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ action: 'assess_marketing_asset', topic: 'Tips', draft: 'Original text', brief_id: 'brief' })
  fireEvent.change(screen.getByLabelText('Asset text'), { target: { value: 'Edited text' } })
  expect(screen.getByText('Original text')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'I reviewed this feedback' }))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'I reviewed this feedback' })).not.toBeInTheDocument())
  expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ action: 'review_laya_assessment', assessment_id: 'run' })
  expect(fetch.mock.calls.every(([url]) => url === '/api/marketing-creative?feature=laya')).toBe(true)
})
it('prefills selected caption without triggering assessment', async () => {
  const fetch = vi.fn().mockResolvedValue(reply({ briefs: [brief], assessments: [] }))
  vi.stubGlobal('fetch', fetch)
  render(<LayaAssessmentPanel token="token" selection={{ topic: 'Selected idea', draft: 'Selected caption' }} />)
  await screen.findByText('See what Laya knows about your business')
  expect(screen.getByLabelText('Asset text')).toHaveValue('Selected caption')
  expect(fetch).toHaveBeenCalledTimes(1)
})
