import { MARKETING_PLATFORMS } from './channels.js'

// Per-destination caption limits enforced before any provider request.
// Google Business Profile is the tightest; Instagram feed captions cap at 2,200.
// LinkedIn and Facebook allow more, but CWS records cap at 3,000 characters.
export const PLATFORM_CAPTION_LIMITS = Object.freeze({
  LINKEDIN: 3000,
  FACEBOOK: 3000,
  INSTAGRAM: 2200,
  GOOGLE_BUSINESS: 1500,
})

// Catalog caption variants are written per audience surface. A Meta variant
// serves both Facebook and Instagram; a caption with no platform is shared.
export const CATALOG_CAPTION_PLATFORMS = Object.freeze({
  meta: ['FACEBOOK', 'INSTAGRAM'],
  linkedin: ['LINKEDIN'],
  google_business: ['GOOGLE_BUSINESS'],
})

export const CATALOG_CAPTION_PLATFORM_LABELS = Object.freeze({
  '': 'Shared (all channels)',
  meta: 'Meta (Facebook + Instagram)',
  linkedin: 'LinkedIn',
  google_business: 'Google Business Profile',
})

// Returns only the non-blank per-platform overrides for known platforms.
export function normalizePlatformOverrides(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const overrides = {}
  for (const platform of MARKETING_PLATFORMS) {
    if (typeof value[platform] === 'string' && value[platform].trim()) overrides[platform] = value[platform].trim()
  }
  return overrides
}

// The exact text each destination receives: its override, otherwise the shared caption.
export function effectivePlatformCaptions(sharedCaption, overrides = {}) {
  const shared = typeof sharedCaption === 'string' ? sharedCaption.trim() : ''
  const normalized = normalizePlatformOverrides(overrides)
  return Object.fromEntries(MARKETING_PLATFORMS.map(platform => [platform, normalized[platform] || shared]))
}

// Returns the first problem with the effective captions, or null when every
// destination has non-empty text within its own limit.
export function platformCaptionError(sharedCaption, overrides = {}, platformName = platform => platform) {
  const effective = effectivePlatformCaptions(sharedCaption, overrides)
  for (const platform of MARKETING_PLATFORMS) {
    const text = effective[platform]
    if (!text) return `A caption is required for ${platformName(platform)}.`
    if (text.length > PLATFORM_CAPTION_LIMITS[platform]) {
      return `The ${platformName(platform)} caption must be ${PLATFORM_CAPTION_LIMITS[platform].toLocaleString('en-US')} characters or fewer.`
    }
  }
  return null
}

// Plain text per platform from a persisted attempt record
// ({ PLATFORM: { text, offer_caption_id } }), or null for older attempts.
export function platformCaptionTexts(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null
  const texts = {}
  for (const platform of MARKETING_PLATFORMS) {
    const entry = record[platform]
    if (entry && typeof entry.text === 'string') texts[platform] = entry.text
  }
  return Object.keys(texts).length ? texts : null
}
