import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlatformBadge from '../PlatformBadge'

describe('PlatformBadge', () => {
  it('renders YT label for youtube platform', () => {
    render(<PlatformBadge platform="youtube" />)
    expect(screen.getByText('YT')).toBeInTheDocument()
  })

  it('renders IG label for instagram platform', () => {
    render(<PlatformBadge platform="instagram" />)
    expect(screen.getByText('IG')).toBeInTheDocument()
  })

  it('renders platform name as fallback for unknown platform', () => {
    render(<PlatformBadge platform="tiktok" />)
    expect(screen.getByText('tiktok')).toBeInTheDocument()
  })
})
