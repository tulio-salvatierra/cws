import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../Hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ signOut: vi.fn() })),
}))

import AdminLayout from '../AdminLayout'

describe('AdminLayout navigation', () => {
  it('exposes the consolidated channels route alongside the admin workspace routes', () => {
    render(
      <MemoryRouter initialEntries={['/admin/channels']}>
        <AdminLayout><div>content</div></AdminLayout>
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Channels' })).toHaveAttribute('href', '/admin/channels')
    expect(screen.getByRole('link', { name: /Workspace/ })).toHaveAttribute('href', '/admin/workspace')
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})
