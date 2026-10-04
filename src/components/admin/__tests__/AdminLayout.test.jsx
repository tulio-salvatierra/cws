import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../Hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ signOut: vi.fn() })),
}))

import AdminLayout from '../AdminLayout'

describe('AdminLayout navigation', () => {
  it('shows only the core OS departments and keeps legacy screens out of the navigation', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout><div>content</div></AdminLayout>
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Sales' })).toHaveAttribute('href', '/admin/sales')
    expect(screen.getByRole('link', { name: 'Marketing' })).toHaveAttribute('href', '/admin/marketing')
    expect(screen.getByRole('link', { name: 'Operations' })).toHaveAttribute('href', '/admin/operations')
    expect(screen.getByRole('link', { name: 'Accounting' })).toHaveAttribute('href', '/admin/accounting')
    expect(screen.getByRole('link', { name: 'Compliance' })).toHaveAttribute('href', '/admin/compliance')
    expect(screen.queryByRole('link', { name: 'Workspace' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Channels' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Planning' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Agent runs' })).not.toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})
