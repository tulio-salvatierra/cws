import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockFrom, mockUpdate } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUpdate: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import TestDataControls from '../TestDataControls'

function query(singleData) {
  const chain = {
    update: vi.fn((payload) => {
      mockUpdate(payload)
      return chain
    }),
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: singleData, error: null })),
  }
  return chain
}

function Harness() {
  const [record, setRecord] = useState({ id: 'variant-1', is_test: true, test_archived: false, test_archived_at: null, test_archived_by: null })
  return <TestDataControls resourceType="variant" record={record} workspaceId="workspace-1" isOwner onUpdated={(classification) => setRecord((current) => ({ ...current, ...classification }))} />
}

describe('TestDataControls', () => {
  it('requires confirmation before operationally archiving test data', async () => {
    mockFrom.mockImplementation(() => query({
      is_test: true,
      test_archived: true,
      test_archived_at: '2026-08-12T22:15:00Z',
      test_archived_by: 'user-1',
    }))

    render(<Harness />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Archive test data' }))

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog', { name: 'Confirm test archive' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm archive' }))

    expect(mockFrom).toHaveBeenCalledWith('content_variants')
    expect(mockUpdate).toHaveBeenCalledWith({ test_archived: true })
    expect(await screen.findByRole('status')).toHaveTextContent('Test record archived.')
    expect(screen.getByRole('button', { name: 'Restore to operational views' })).toBeInTheDocument()
  })

  it('does not expose classification controls to non-owners', () => {
    render(<TestDataControls
      resourceType="campaign"
      record={{ id: 'campaign-1', is_test: true, test_archived: false }}
      workspaceId="workspace-1"
      isOwner={false}
      onUpdated={vi.fn()}
    />)

    expect(screen.getByText('Test data')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
