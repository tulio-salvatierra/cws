import { describe, expect, it } from 'vitest'
import { buildOfferCatalog, offerPriceDisplay } from '../offer-catalog.js'

const offer = {
  id: 'offer-a',
  name: 'Website Refresh',
  description: 'A focused refresh for an existing business website.',
  price_mode: 'from',
  price_cents: 125000,
  price_display_override: null,
  default_project_type: 'website',
  status: 'active',
  created_at: '2026-09-01T12:00:00.000Z',
}

const media = [
  { id: 'media-old', offer_id: 'offer-a', storage_path: '/images/refresh-old.png', linkedin_compatible: true, facebook_compatible: true, instagram_compatible: true, status: 'active', created_at: '2026-09-01T12:00:00.000Z' },
  { id: 'media-new', offer_id: 'offer-a', storage_path: '/images/refresh-new.png', linkedin_compatible: true, facebook_compatible: true, instagram_compatible: true, status: 'active', created_at: '2026-09-02T12:00:00.000Z' },
]

const captions = [
  { id: 'caption-old', offer_id: 'offer-a', locale: 'en', body: 'Refresh your website.', status: 'active', created_at: '2026-09-01T12:00:00.000Z' },
  { id: 'caption-new', offer_id: 'offer-a', locale: 'en', body: 'Clarify what your business offers.', status: 'active', created_at: '2026-09-02T12:00:00.000Z' },
]

function successfulAttempt(overrides = {}) {
  return {
    destination: 'multi:cicero-web-studio',
    provider_status: 'posted',
    destination_results: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'].map(platform => ({ platform, provider_status: 'posted' })),
    created_at: '2026-09-03T12:00:00.000Z',
    ...overrides,
  }
}

describe('Marketing Offer Catalog', () => {
  it('requires an active offer, three-channel compatible image, and active English caption for rotation', () => {
    const catalog = buildOfferCatalog({
      offers: [offer, { ...offer, id: 'draft', status: 'draft' }],
      media: [...media, { ...media[0], id: 'not-instagram', offer_id: 'draft', instagram_compatible: false }],
      captions: [...captions, { ...captions[0], id: 'draft-caption', offer_id: 'draft' }],
    })

    expect(catalog.activeOfferCount).toBe(1)
    expect(catalog.assets).toHaveLength(1)
    expect(catalog.assets[0]).toMatchObject({ offerId: 'offer-a', enabled: true, price: 'From $1,250.00' })
  })

  it('selects the least-recently-published image and caption independently from durable attempts', () => {
    const catalog = buildOfferCatalog({
      offers: [offer],
      media,
      captions,
      attempts: [
        successfulAttempt({ offer_id: 'offer-a', offer_media_id: 'media-old', offer_caption_id: 'caption-old', updated_at: '2026-09-03T12:00:00.000Z' }),
        successfulAttempt({ offer_id: 'offer-a', offer_media_id: 'media-new', offer_caption_id: 'caption-new', updated_at: '2026-09-04T12:00:00.000Z' }),
      ],
    })

    expect(catalog.assets[0]).toMatchObject({
      offerMediaId: 'media-old',
      offerCaptionId: 'caption-old',
      lastPublishedAt: '2026-09-04T12:00:00.000Z',
    })
  })

  it('retains a disabled historical variation so an older attempt stays understandable', () => {
    const catalog = buildOfferCatalog({
      offers: [{ ...offer, status: 'retired' }],
      media: [{ ...media[0], status: 'retired' }],
      captions: [{ ...captions[0], status: 'retired' }],
      attempts: [successfulAttempt({ offer_id: 'offer-a', offer_media_id: 'media-old', offer_caption_id: 'caption-old' })],
    })

    expect(catalog.activeOfferCount).toBe(0)
    expect(catalog.assets).toEqual([expect.objectContaining({ enabled: false, label: 'Website Refresh' })])
  })

  it('uses owner-approved price wording before derived formatting', () => {
    expect(offerPriceDisplay({ ...offer, price_display_override: 'Starting at $1,250' })).toBe('Starting at $1,250')
    expect(offerPriceDisplay({ ...offer, price_mode: 'by_scope', price_cents: null })).toBe('Price by scope')
  })
})
