export const CHICAGO_TIME_ZONE = 'America/Chicago'

export const WEEKLY_MARKETING_SLOTS = [
  { key: 'post-a', label: 'Post A', weekday: 'Tuesday', weekdayIndex: 2 },
  { key: 'post-b', label: 'Post B', weekday: 'Friday', weekdayIndex: 5 },
]

// M6 begins here so historic Marketing records are never retroactively
// presented as missed weekly occurrences.
export const MISSED_SLOT_HANDLING_START_DATE = '2026-09-07'

// This deliberately stays small. These are verified, owned evergreen offer
// graphics—not an asset-management system or database asset library.
export const EVERGREEN_ASSETS = [
  {
    id: 'website-launch',
    assetPath: '/images/en-launch.png',
    label: 'Website Launch',
    price: '$550',
    defaultCaption: 'Need a focused website that gets your business online fast? Our Website Launch package includes a mobile-first page, contact form, and WhatsApp button for $550. Book a call to get started.',
    enabled: true,
    rotationOrder: 1,
    fallback: false,
  },
  {
    id: 'bilingual-website',
    assetPath: '/images/en-bilingual.png',
    label: 'Bilingual Website',
    price: '$1,950',
    defaultCaption: 'Serve English- and Spanish-speaking customers with a bilingual website written for both audiences—not simply translated. One-time build: $1,950. Book a call to plan yours.',
    enabled: true,
    rotationOrder: 2,
    fallback: false,
  },
  {
    id: 'business-photography-350',
    assetPath: '/images/business-photography-350.jpeg',
    label: 'Business Photography',
    price: '$350',
    defaultCaption: 'Professional photos make your website, Google Business Profile, and social media feel like your business. On-location Business Photography is $350. Contact Cicero Web Studio to book a session.',
    enabled: true,
    rotationOrder: 3,
    fallback: false,
  },
]

const REQUIRED_DESTINATIONS = new Set(['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'])

export function buildWeeklySlotPlan({ now = new Date(), assets = EVERGREEN_ASSETS, attempts = [] } = {}) {
  const weekStart = marketingWeekStart(now)
  return buildWeekSlotPlan({ weekStart, now, assets, attempts, resolutions: [], includeMissed: false })
}

// This Marketing-owned projection is deliberately separate from publication.
// It only derives occurrence state from calendar, attempts, and immutable owner
// decisions; calling it cannot create an attempt or contact a provider.
export function buildMarketingOccurrencePlan({
  now = new Date(),
  assets = EVERGREEN_ASSETS,
  attempts = [],
  resolutions = [],
  startDate = MISSED_SLOT_HANDLING_START_DATE,
} = {}) {
  const firstWeekStart = marketingWeekStart(new Date(`${startDate}T12:00:00.000Z`))
  const currentWeekStart = marketingWeekStart(now)
  const allSlots = []

  for (let weekStart = firstWeekStart; weekStart <= currentWeekStart; weekStart = addDays(weekStart, 7)) {
    allSlots.push(...buildWeekSlotPlan({ weekStart, now, assets, attempts, resolutions, includeMissed: true }))
  }

  const missedSlots = allSlots
    .filter(slot => slot.state === 'missed')
    .sort(compareSlots)
  const currentWeekSlots = allSlots
    .filter(slot => slot.weekStart === currentWeekStart)
    .sort(compareSlots)
  const visibleSlots = [...missedSlots]
  for (const slot of currentWeekSlots) {
    if (!visibleSlots.some(candidate => candidate.slotKey === slot.slotKey)) visibleSlots.push(slot)
  }

  return {
    allSlots,
    slots: visibleSlots,
    missedSlots,
    currentWeekSlots,
    missedSlotSignal: missedSlots[0] ? missedSlotSignal(missedSlots[0]) : null,
  }
}

export function nextOpenMarketingSlot({ now = new Date(), attempts = [], resolutions = [] } = {}) {
  const today = marketingLocalDate(now)
  const firstWeekStart = marketingWeekStart(now)
  const resolvedKeys = new Set(resolutions.map(resolution => resolution.occurrence_slot_key))
  const targetKeys = new Set(resolutions.map(resolution => resolution.target_slot_key).filter(Boolean))

  for (let offset = 0; offset < 104; offset += 1) {
    const weekStart = addDays(firstWeekStart, offset * 7)
    for (const definition of WEEKLY_MARKETING_SLOTS) {
      const slotDate = addDays(weekStart, definition.weekdayIndex - 1)
      const slotKey = `${weekStart}:${definition.key}`
      const hasAttempt = attempts.some(attempt => attempt.marketing_slot_key === slotKey)
      if (slotDate > today && !hasAttempt && !resolvedKeys.has(slotKey) && !targetKeys.has(slotKey)) {
        return { ...definition, slotKey, slotDate, weekStart }
      }
    }
  }

  return null
}

export function isMissedMarketingSlot(slotDate, now = new Date()) {
  return slotDate < marketingLocalDate(now)
}

export function marketingLocalDate(now = new Date()) {
  const { year, month, day } = chicagoDateParts(now)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildWeekSlotPlan({ weekStart, now, assets, attempts, resolutions, includeMissed }) {
  const plannedAssetIds = new Set()
  return WEEKLY_MARKETING_SLOTS.map(definition => {
    const slotDate = addDays(weekStart, definition.weekdayIndex - 1)
    const slotKey = `${weekStart}:${definition.key}`
    const attempt = attempts.find(candidate => candidate.marketing_slot_key === slotKey) || null
    const resolution = resolutions.find(candidate => candidate.occurrence_slot_key === slotKey) || null
    const carriedResolution = resolutions.find(candidate => candidate.target_slot_key === slotKey) || null
    const asset = attempt
      ? assetForAttempt(attempt, assets)
      : carriedResolution
        ? assetForResolution(carriedResolution, assets)
        : chooseNextUnplannedAsset(assets, attempts, plannedAssetIds)
    if (asset) plannedAssetIds.add(asset.id)
    const fullyPosted = attempt && isFullyPosted(attempt)
    const state = attempt
      ? (fullyPosted ? 'posted' : 'processing')
      : resolution
        ? 'resolved'
        : includeMissed && isMissedMarketingSlot(slotDate, now)
          ? 'missed'
          : asset ? 'ready' : 'upcoming'

    return {
      ...definition,
      weekStart,
      slotKey,
      slotDate,
      asset,
      caption: attempt?.caption || carriedResolution?.caption || resolution?.caption || asset?.defaultCaption || '',
      state,
      attempt,
      resolution,
      carriedResolution,
      originalSlotKey: carriedResolution?.origin_slot_key || slotKey,
      destinationResults: attempt?.destination_results || [],
    }
  })
}

export function chooseNextAsset(assets = EVERGREEN_ASSETS, attempts = []) {
  return orderedRotationAssets(assets, attempts)[0] || null
}

function chooseNextUnplannedAsset(assets, attempts, plannedAssetIds) {
  const ordered = orderedRotationAssets(assets, attempts)
  return ordered.find(asset => !plannedAssetIds.has(asset.id)) || ordered[0] || null
}

function orderedRotationAssets(assets, attempts) {
  const eligible = assets.filter(asset => asset.enabled)

  return [...eligible].sort((left, right) => {
    const leftLastPublished = lastSuccessfulPublication(left, attempts)
    const rightLastPublished = lastSuccessfulPublication(right, attempts)
    if (!leftLastPublished && rightLastPublished) return -1
    if (leftLastPublished && !rightLastPublished) return 1
    if (leftLastPublished && rightLastPublished && leftLastPublished !== rightLastPublished) {
      return leftLastPublished.localeCompare(rightLastPublished)
    }
    return left.rotationOrder - right.rotationOrder
  })
}

export function isFullyPosted(attempt) {
  if (attempt?.destination !== 'multi:cicero-web-studio' || attempt?.provider_status !== 'posted') return false
  const results = attempt.destination_results || []
  return results.length === REQUIRED_DESTINATIONS.size
    && results.every(result => REQUIRED_DESTINATIONS.has(result.platform) && result.provider_status === 'posted')
}

export function marketingWeekStart(now = new Date()) {
  const { year, month, day } = chicagoDateParts(now)
  const date = new Date(Date.UTC(year, month - 1, day))
  const mondayOffset = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - mondayOffset)
  return date.toISOString().slice(0, 10)
}

function lastSuccessfulPublication(asset, attempts) {
  const matches = attempts
    .filter(attempt => isFullyPosted(attempt))
    .filter(attempt => attempt.asset_id === asset.id || (!attempt.asset_id && attempt.asset_path === asset.assetPath))
    .map(attempt => attempt.updated_at || attempt.created_at)
    .filter(Boolean)
    .sort()
  return matches.at(-1) || null
}

function assetForAttempt(attempt, assets) {
  return assets.find(asset => asset.id === attempt.asset_id)
    || assets.find(asset => asset.assetPath === attempt.asset_path)
    || (attempt.asset_path ? {
      id: attempt.asset_id || 'archived-marketing-asset',
      assetPath: attempt.asset_path,
      label: 'Archived Marketing asset',
      defaultCaption: attempt.caption || '',
      enabled: false,
      rotationOrder: Number.MAX_SAFE_INTEGER,
      fallback: false,
    } : null)
}

function assetForResolution(resolution, assets) {
  return assets.find(asset => asset.id === resolution.asset_id)
    || assets.find(asset => asset.assetPath === resolution.asset_path)
    || {
      id: resolution.asset_id,
      assetPath: resolution.asset_path,
      label: 'Archived Marketing asset',
      defaultCaption: resolution.caption || '',
      enabled: false,
      rotationOrder: Number.MAX_SAFE_INTEGER,
      fallback: false,
    }
}

function missedSlotSignal(slot) {
  return {
    state: 'owner_decision_required',
    slot_key: slot.slotKey,
    original_slot_key: slot.originalSlotKey,
    scheduled_date: slot.slotDate,
    asset_id: slot.asset?.id || null,
    asset_label: slot.asset?.label || null,
  }
}

function compareSlots(left, right) {
  if (left.slotDate !== right.slotDate) return left.slotDate.localeCompare(right.slotDate)
  return left.weekdayIndex - right.weekdayIndex
}

function chicagoDateParts(now) {
  const values = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  return Object.fromEntries(values.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]))
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
