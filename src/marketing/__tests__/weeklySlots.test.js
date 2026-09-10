import { describe, expect, it } from 'vitest'
import { buildMarketingOccurrencePlan, buildWeeklySlotPlan, chooseNextAsset, EVERGREEN_ASSETS, isMissedMarketingSlot, marketingWeekStart, nextOpenMarketingSlot } from '../weeklySlots'

const assets = [
  { id: 'website-launch', assetPath: '/images/website-launch.png', label: 'Website Launch', defaultCaption: 'Launch.', enabled: true, rotationOrder: 1 },
  { id: 'bilingual-website', assetPath: '/images/bilingual-website.png', label: 'Bilingual Website', defaultCaption: 'Bilingual.', enabled: true, rotationOrder: 2 },
  { id: 'business-photography-350', assetPath: '/images/business-photography-350.jpeg', label: 'Business Photography', defaultCaption: 'Photography.', enabled: true, rotationOrder: 3 },
]

function successfulAttempt(assetId, createdAt = '2026-09-01T12:00:00.000Z') {
  return {
    id: `${assetId}-attempt`, asset_id: assetId, destination: 'multi:cicero-web-studio', provider_status: 'posted', created_at: createdAt,
    destination_results: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'].map(platform => ({ platform, provider_status: 'posted' })),
  }
}

function failedAttempt(assetId) {
  return {
    id: `${assetId}-failed`, asset_id: assetId, destination: 'multi:cicero-web-studio', provider_status: 'error', created_at: '2026-09-01T12:00:00.000Z',
    destination_results: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'].map(platform => ({ platform, provider_status: 'error' })),
  }
}

function resolution({ occurrenceSlotKey = '2026-09-07:post-a', action = 'move', targetSlotKey = '2026-09-07:post-b', caption = 'Edited Website Launch caption.' } = {}) {
  return {
    occurrence_slot_key: occurrenceSlotKey,
    origin_slot_key: '2026-09-07:post-a',
    action,
    target_slot_key: action === 'move' ? targetSlotKey : null,
    asset_id: 'website-launch',
    asset_path: '/images/website-launch.png',
    caption,
    decided_at: '2026-09-09T12:00:00.000Z',
  }
}

describe('M5 weekly Marketing slots', () => {
  it('uses the three supplied English offers and no logo fallback', () => {
    expect(EVERGREEN_ASSETS.map(asset => [asset.id, asset.assetPath, asset.price, asset.rotationOrder, asset.fallback])).toEqual([
      ['website-launch', '/images/en-launch.png', '$550', 1, false],
      ['bilingual-website', '/images/en-bilingual.png', '$1,950', 2, false],
      ['business-photography-350', '/images/business-photography-350.jpeg', '$350', 3, false],
    ])
  })

  it('creates exactly Tuesday and Friday slots for the current Chicago week', () => {
    const slots = buildWeeklySlotPlan({ now: new Date('2026-09-09T17:00:00.000Z'), assets, attempts: [] })
    expect(marketingWeekStart(new Date('2026-09-09T17:00:00.000Z'))).toBe('2026-09-07')
    expect(slots.map(slot => [slot.label, slot.weekday, slot.slotDate])).toEqual([
      ['Post A', 'Tuesday', '2026-09-08'],
      ['Post B', 'Friday', '2026-09-11'],
    ])
    expect(slots.every(slot => slot.state === 'ready')).toBe(true)
    expect(slots.map(slot => slot.asset.id)).toEqual(['website-launch', 'bilingual-website'])
    expect(new Set(slots.map(slot => slot.asset.id)).size).toBe(2)
  })

  it('uses configured order among assets that have never been successfully published', () => {
    expect(chooseNextAsset(assets, [])?.id).toBe('website-launch')
  })

  it('chooses an unpublished asset before an asset published successfully', () => {
    expect(chooseNextAsset(assets, [successfulAttempt('bilingual-website')])?.id).toBe('website-launch')
  })

  it('does not advance rotation for a failed attempt', () => {
    expect(chooseNextAsset(assets, [failedAttempt('website-launch')])?.id).toBe('website-launch')
  })

  it('advances rotation after an all-destination successful post', () => {
    expect(chooseNextAsset(assets, [successfulAttempt('website-launch')])?.id).toBe('bilingual-website')
  })

  it('returns to the least-recently successful asset after the three-offer rotation', () => {
    const attempts = [
      successfulAttempt('website-launch', '2026-09-01T12:00:00.000Z'),
      successfulAttempt('bilingual-website', '2026-09-02T12:00:00.000Z'),
      successfulAttempt('business-photography-350', '2026-09-03T12:00:00.000Z'),
    ]
    expect(chooseNextAsset(assets, attempts)?.id).toBe('website-launch')
  })

  it('keeps a posted slot tied to its durable attempt and locks it', () => {
    const attempt = { ...successfulAttempt('website-launch'), marketing_slot_key: '2026-09-07:post-a' }
    const [postA, postB] = buildWeeklySlotPlan({ now: new Date('2026-09-09T17:00:00.000Z'), assets, attempts: [attempt] })
    expect(postA.state).toBe('posted')
    expect(postA.attempt.id).toBe(attempt.id)
    expect(postB.state).toBe('ready')
    expect(postB.asset.id).toBe('bilingual-website')
  })
})

describe('M6 missed-slot handling', () => {
  it('does not mark Tuesday missed during its Chicago calendar day', () => {
    const plan = buildMarketingOccurrencePlan({ now: new Date('2026-09-08T17:00:00.000Z'), assets, attempts: [] })
    expect(plan.slots.find(slot => slot.slotKey === '2026-09-07:post-a')?.state).toBe('ready')
    expect(isMissedMarketingSlot('2026-09-08', new Date('2026-09-08T23:59:59.000Z'))).toBe(false)
  })

  it('marks Tuesday missed on Wednesday and preserves it across a fresh projection', () => {
    const now = new Date('2026-09-09T17:00:00.000Z')
    const first = buildMarketingOccurrencePlan({ now, assets, attempts: [] })
    const reloaded = buildMarketingOccurrencePlan({ now, assets, attempts: [] })
    expect(first.missedSlots.map(slot => slot.slotKey)).toEqual(['2026-09-07:post-a'])
    expect(first.missedSlotSignal).toMatchObject({ state: 'owner_decision_required', slot_key: '2026-09-07:post-a', asset_id: 'website-launch' })
    expect(reloaded.slots.map(slot => [slot.slotKey, slot.state])).toEqual(first.slots.map(slot => [slot.slotKey, slot.state]))
  })

  it('presents multiple unresolved missed occurrences oldest first', () => {
    const plan = buildMarketingOccurrencePlan({ now: new Date('2026-09-16T17:00:00.000Z'), assets, attempts: [] })
    expect(plan.missedSlots.map(slot => slot.slotKey)).toEqual([
      '2026-09-07:post-a',
      '2026-09-07:post-b',
      '2026-09-14:post-a',
    ])
  })

  it('moves the same edited asset and caption to the next open slot without advancing publication rotation', () => {
    const now = new Date('2026-09-09T17:00:00.000Z')
    const decisions = [resolution()]
    const plan = buildMarketingOccurrencePlan({ now, assets, attempts: [], resolutions: decisions })
    const moved = plan.slots.find(slot => slot.slotKey === '2026-09-07:post-b')
    expect(plan.slots.find(slot => slot.slotKey === '2026-09-07:post-a')?.state).toBe('resolved')
    expect(moved).toMatchObject({ state: 'ready', originalSlotKey: '2026-09-07:post-a', caption: 'Edited Website Launch caption.' })
    expect(moved.asset.id).toBe('website-launch')
    expect(chooseNextAsset(assets, [])?.id).toBe('website-launch')
    expect(nextOpenMarketingSlot({ now, attempts: [], resolutions: decisions })?.slotKey).toBe('2026-09-14:post-a')
    expect(assets.some(asset => asset.id === 'bilingual-website')).toBe(true)
  })

  it('records Skip as resolved without publishing or removing the evergreen asset from rotation', () => {
    const decisions = [resolution({ action: 'skip' })]
    const plan = buildMarketingOccurrencePlan({ now: new Date('2026-09-09T17:00:00.000Z'), assets, attempts: [], resolutions: decisions })
    expect(plan.slots.find(slot => slot.slotKey === '2026-09-07:post-a')?.state).toBe('resolved')
    expect(plan.slots.find(slot => slot.slotKey === '2026-09-07:post-b')?.asset.id).toBe('bilingual-website')
    expect(chooseNextAsset(assets, [])?.id).toBe('website-launch')
  })

  it('keeps historical M2/M3/M4 attempts outside M6 occurrence state', () => {
    const plan = buildMarketingOccurrencePlan({
      now: new Date('2026-09-09T17:00:00.000Z'),
      assets,
      attempts: [
        { id: 'm2', destination: 'linkedin:cicero-web-studio', provider_status: 'error', asset_path: '/images/logo.png' },
        { id: 'm4', destination: 'multi:cicero-web-studio', provider_status: 'posted', asset_path: '/images/logo.png', destination_results: [] },
      ],
    })
    expect(plan.missedSlots.map(slot => slot.slotKey)).toEqual(['2026-09-07:post-a'])
  })
})
