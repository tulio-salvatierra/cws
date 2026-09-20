import { isFullyPosted } from '../../src/marketing/weeklySlots.js'

const ACTIVE = 'active'

// This is Marketing reference data, not a workflow. It selects one
// independently least-recently-used English caption and compatible image for
// each active offer, while the existing weekly-slot code selects between
// offers. All usage dates come from durable publish attempts.
export function buildOfferCatalog({ offers = [], media = [], captions = [], attempts = [] } = {}) {
  const offersById = new Map(offers.map(offer => [offer.id, offer]))
  const mediaByOffer = groupByOffer(media)
  const captionsByOffer = groupByOffer(captions)
  const activeAssets = []

  for (const offer of offers.filter(offer => offer.status === ACTIVE)) {
    const selectedMedia = leastRecentlyUsed(
      (mediaByOffer.get(offer.id) || []).filter(isThreeChannelActiveMedia),
      attempts,
      'offer_media_id',
    )
    const selectedCaption = leastRecentlyUsed(
      (captionsByOffer.get(offer.id) || []).filter(caption => caption.status === ACTIVE && caption.locale === 'en'),
      attempts,
      'offer_caption_id',
    )
    if (!selectedMedia || !selectedCaption) continue
    activeAssets.push(toAsset({ offer, media: selectedMedia, caption: selectedCaption, attempts, enabled: true }))
  }

  const activeAssetIds = new Set(activeAssets.map(asset => asset.id))
  const historyAssets = []
  for (const attempt of attempts) {
    if (!attempt.offer_id || !attempt.offer_media_id || !attempt.offer_caption_id) continue
    const offer = offersById.get(attempt.offer_id)
    const medium = media.find(record => record.id === attempt.offer_media_id && record.offer_id === attempt.offer_id)
    const caption = captions.find(record => record.id === attempt.offer_caption_id && record.offer_id === attempt.offer_id)
    if (!offer || !medium || !caption) continue
    const asset = toAsset({ offer, media: medium, caption, attempts, enabled: false })
    if (!activeAssetIds.has(asset.id) && !historyAssets.some(record => record.id === asset.id)) historyAssets.push(asset)
  }

  return {
    assets: [...activeAssets, ...historyAssets],
    offers: serializeOffers(offers, mediaByOffer, captionsByOffer),
    activeOfferCount: activeAssets.length,
  }
}

export function offerPriceDisplay(offer) {
  const override = optionalText(offer?.price_display_override)
  if (override) return override
  if (offer?.price_mode === 'by_scope') return 'Price by scope'
  if (!Number.isInteger(offer?.price_cents) || offer.price_cents <= 0) return ''
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
    .format(offer.price_cents / 100)
  return offer.price_mode === 'from' ? `From ${amount}` : amount
}

function serializeOffers(offers, mediaByOffer, captionsByOffer) {
  return offers
    .slice()
    .sort(compareRecords)
    .map(offer => ({
      id: offer.id,
      name: offer.name,
      description: offer.description,
      price_mode: offer.price_mode,
      price_cents: offer.price_cents,
      price_display: offerPriceDisplay(offer),
      price_display_override: offer.price_display_override || null,
      default_project_type: offer.default_project_type || null,
      status: offer.status,
      created_at: offer.created_at,
      media: (mediaByOffer.get(offer.id) || []).slice().sort(compareRecords).map(serializeMedium),
      captions: (captionsByOffer.get(offer.id) || []).slice().sort(compareRecords).map(serializeCaption),
    }))
}

function serializeMedium(medium) {
  return {
    id: medium.id,
    offer_id: medium.offer_id,
    storage_path: medium.storage_path,
    linkedin_compatible: medium.linkedin_compatible === true,
    facebook_compatible: medium.facebook_compatible === true,
    instagram_compatible: medium.instagram_compatible === true,
    status: medium.status,
  }
}

function serializeCaption(caption) {
  return {
    id: caption.id,
    offer_id: caption.offer_id,
    locale: caption.locale,
    body: caption.body,
    status: caption.status,
  }
}

function toAsset({ offer, media, caption, attempts, enabled }) {
  return {
    id: `catalog:${offer.id}:${media.id}:${caption.id}`,
    offerId: offer.id,
    offerMediaId: media.id,
    offerCaptionId: caption.id,
    assetPath: media.storage_path,
    label: offer.name,
    price: offerPriceDisplay(offer),
    defaultCaption: caption.body,
    enabled,
    fallback: false,
    lastPublishedAt: lastPublishedAt(attempts, 'offer_id', offer.id),
  }
}

function groupByOffer(records) {
  return records.reduce((grouped, record) => {
    const current = grouped.get(record.offer_id) || []
    current.push(record)
    grouped.set(record.offer_id, current)
    return grouped
  }, new Map())
}

function isThreeChannelActiveMedia(medium) {
  return medium.status === ACTIVE
    && medium.linkedin_compatible === true
    && medium.facebook_compatible === true
    && medium.instagram_compatible === true
}

function leastRecentlyUsed(records, attempts, field) {
  return records.slice().sort((left, right) => {
    const leftLast = lastPublishedAt(attempts, field, left.id)
    const rightLast = lastPublishedAt(attempts, field, right.id)
    if (!leftLast && rightLast) return -1
    if (leftLast && !rightLast) return 1
    if (leftLast && rightLast && leftLast !== rightLast) return leftLast.localeCompare(rightLast)
    return compareRecords(left, right)
  })[0] || null
}

function lastPublishedAt(attempts, field, id) {
  return attempts
    .filter(isFullyPosted)
    .filter(attempt => attempt[field] === id)
    .map(attempt => attempt.updated_at || attempt.created_at)
    .filter(Boolean)
    .sort()
    .at(-1) || null
}

function compareRecords(left, right) {
  return String(left.created_at || '').localeCompare(String(right.created_at || ''))
    || String(left.id || '').localeCompare(String(right.id || ''))
}

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}
