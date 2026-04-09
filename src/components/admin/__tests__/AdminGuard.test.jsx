import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../Hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../../Hooks/useAuth'
import AdminGuard from '../AdminGuard'

describe('AdminGuard', () => {
  it('renders children when session exists', () => {
    useAuth.mockReturnValue({ session: { user: { id: '1' } }, loading: false })
    render(
      <MemoryRouter>
        <AdminGuard><div>protected</div></AdminGuard>
      </MemoryRouter>
    )
    expect(screen.getByText('protected')).toBeInTheDocument()
  })

  it('renders nothing while loading', () => {
    useAuth.mockReturnValue({ session: null, loading: true })
    const { container } = render(
      <MemoryRouter>
        <AdminGuard><div>protected</div></AdminGuard>
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('redirects to /admin/login when no session', () => {
    useAuth.mockReturnValue({ session: null, loading: false })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminGuard><div>protected</div></AdminGuard>
      </MemoryRouter>
    )
    expect(screen.queryByText('protected')).not.toBeInTheDocument()
  })
})
