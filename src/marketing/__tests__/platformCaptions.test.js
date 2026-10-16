import { describe, expect, it } from 'vitest'
import { effectivePlatformCaptions, normalizePlatformOverrides, platformCaptionError, platformCaptionTexts } from '../platformCaptions.js'

describe('platform captions', () => {
  it('gives every destination its override or the shared caption', () => {
    expect(effectivePlatformCaptions(' Shared. ', { LINKEDIN: ' Own. ', FACEBOOK: '  ', TIKTOK: 'x' })).toEqual({
      LINKEDIN: 'Own.', FACEBOOK: 'Shared.', INSTAGRAM: 'Shared.', GOOGLE_BUSINESS: 'Shared.',
    })
  })

  it('ignores blank, non-text, and unknown overrides', () => {
    expect(normalizePlatformOverrides({ LINKEDIN: '', INSTAGRAM: 7, GOOGLE_BUSINESS: 'G', TIKTOK: 'T' })).toEqual({ GOOGLE_BUSINESS: 'G' })
    expect(normalizePlatformOverrides(null)).toEqual({})
  })

  it('checks each destination against its own limit', () => {
    expect(platformCaptionError('x'.repeat(1501))).toMatch(/GOOGLE_BUSINESS caption must be 1,500/)
    expect(platformCaptionError('x'.repeat(1501), { GOOGLE_BUSINESS: 'Short.' })).toBeNull()
    expect(platformCaptionError('x'.repeat(2201), { GOOGLE_BUSINESS: 'Short.' })).toMatch(/INSTAGRAM caption must be 2,200/)
    expect(platformCaptionError('')).toMatch(/caption is required/)
  })

  it('reads persisted per-destination text and treats older attempts as shared-only', () => {
    expect(platformCaptionTexts({ LINKEDIN: { text: 'L', offer_caption_id: null } })).toEqual({ LINKEDIN: 'L' })
    expect(platformCaptionTexts(null)).toBeNull()
  })
})
