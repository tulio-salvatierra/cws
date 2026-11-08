import { describe, expect, it } from 'vitest'
import { formatChicagoDateTime, humanizeKey } from '../adminFormat'

describe('admin display format', () => {
  it('shows Chicago wall time instead of a raw ISO timestamp', () => {
    expect(formatChicagoDateTime('2026-11-05T18:29:53.501207+00:00')).toBe('Nov 5, 2026, 12:29 PM')
  })
  it('passes through empty and unparseable values', () => {
    expect(formatChicagoDateTime(null)).toBe('')
    expect(formatChicagoDateTime('not a date')).toBe('not a date')
  })
  it('turns record keys into words', () => {
    expect(humanizeKey('business_decision')).toBe('business decision')
  })
})
