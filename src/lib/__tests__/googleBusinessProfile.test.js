import { describe, expect, it } from 'vitest'
import { normalizeGoogleBusinessProfileUrl } from '../googleBusinessProfile.js'

describe('Google Business Profile reference URLs', () => {
  it('keeps supported HTTPS Google Maps and profile links as safe external references', () => {
    expect(normalizeGoogleBusinessProfileUrl(' https://www.google.com/maps?cid=123 ')).toBe('https://www.google.com/maps?cid=123')
    expect(normalizeGoogleBusinessProfileUrl('https://maps.app.goo.gl/example')).toBe('https://maps.app.goo.gl/example')
    expect(normalizeGoogleBusinessProfileUrl('https://g.page/example')).toBe('https://g.page/example')
  })

  it('rejects non-HTTPS, non-Google, malformed, and oversized values', () => {
    expect(normalizeGoogleBusinessProfileUrl('http://www.google.com/maps?cid=123')).toBe(false)
    expect(normalizeGoogleBusinessProfileUrl('https://example.com/profile')).toBe(false)
    expect(normalizeGoogleBusinessProfileUrl('javascript:alert(1)')).toBe(false)
    expect(normalizeGoogleBusinessProfileUrl('not a URL')).toBe(false)
    expect(normalizeGoogleBusinessProfileUrl('https://www.google.com/maps?cid=' + 'a'.repeat(2049))).toBe(false)
  })

  it('allows an empty optional value', () => {
    expect(normalizeGoogleBusinessProfileUrl('  ')).toBeNull()
    expect(normalizeGoogleBusinessProfileUrl(null)).toBeNull()
  })
})
