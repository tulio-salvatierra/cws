import { describe, expect, it } from 'vitest'
import { dateOnly, safeSourceUrl } from '../shared.js'

describe('Compliance input safety', () => {
  it('accepts only valid calendar dates for durable deadline facts', () => {
    expect(dateOnly('2026-09-13', { required: true })).toBe('2026-09-13')
    expect(dateOnly('2026-02-30', { required: true })).toBeNull()
    expect(dateOnly('09/13/2026', { required: true })).toBeNull()
  })

  it('stores reference URLs without fetching them and rejects unsafe URL schemes', () => {
    expect(safeSourceUrl('https://www.illinois.gov/rules')).toBe('https://www.illinois.gov/rules')
    expect(safeSourceUrl('mailto:owner@example.com')).toBe(false)
    expect(safeSourceUrl('javascript:alert(1)')).toBe(false)
    expect(safeSourceUrl('')).toBeNull()
  })
})
