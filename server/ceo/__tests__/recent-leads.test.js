import { describe, expect, it } from 'vitest'
import { buildRecentLeads } from '../recent-leads.js'

const now = new Date('2026-11-09T18:00:00Z')
const lead = (over) => ({ id: 'x', company: 'Biz', status: 'new', is_test: false, created_at: '2026-10-01T15:00:00Z', last_contacted_at: null, ...over })

describe('buildRecentLeads', () => {
  it('keeps leads added or contacted in the last 7 Chicago days, newest activity first', () => {
    const result = buildRecentLeads({ now, leads: [
      lead({ id: 'old', company: 'Old Co' }),
      lead({ id: 'added', company: 'Added Co', created_at: '2026-11-08T22:00:00Z', phone: '+1', source: '{"opportunity_hypothesis":"No site found.","address":"1 Main St"}' }),
      lead({ id: 'touched', company: 'Touched Co', last_contacted_at: '2026-11-04T17:00:00Z', status: 'contacted' }),
      lead({ id: 'edge', company: 'Edge Co', created_at: '2026-11-03T06:30:00Z' }),
    ] })
    expect(result.since).toBe('2026-11-03')
    expect(result.items.map((row) => row.id)).toEqual(['added', 'touched', 'edge'])
    expect(result.items[0]).toMatchObject({ business: 'Added Co', added_on: '2026-11-08', added_this_week: true, hypothesis: 'No site found.', address: '1 Main St' })
    expect(result.items[1]).toMatchObject({ contacted_on: '2026-11-04', added_this_week: false })
  })

  it('leaves out test, won and lost leads and tolerates non-JSON sources', () => {
    const result = buildRecentLeads({ now, leads: [
      lead({ id: 't', created_at: '2026-11-08T15:00:00Z', is_test: true }),
      lead({ id: 'w', created_at: '2026-11-08T15:00:00Z', status: 'won' }),
      lead({ id: 'l', created_at: '2026-11-08T15:00:00Z', status: 'lost' }),
      lead({ id: 'm', created_at: '2026-11-08T15:00:00Z', source: 'manual' }),
    ] })
    expect(result.items.map((row) => row.id)).toEqual(['m'])
    expect(result.items[0].hypothesis).toBeNull()
  })

  it('reads the recorded sales angle and website status and puts the best openers first', () => {
    const angled = (id, angle, status) => lead({ id, company: id, created_at: '2026-11-08T15:00:00Z', source: JSON.stringify({ address: '1 Main St', angle, website_status: status, website: status === 'own_site' ? 'example.com' : null, angle_facts: ['Fact one', 'Fact two'], angle_opener: 'Hi there.', angle_upsell: 'Básico', angle_checked_at: '2026-11-09' }) })
    const result = buildRecentLeads({ now, leads: [angled('reviews', 'Reviews', 'own_site'), lead({ id: 'plain', company: 'plain', created_at: '2026-11-09T15:00:00Z' }), angled('nosite', 'No website', 'none'), angled('bogus', 'Make it up', 'weird')] })
    expect(result.items.map((row) => row.id)).toEqual(['nosite', 'reviews', 'plain', 'bogus'])
    expect(result.items[0]).toMatchObject({ angle: 'No website', website_status: 'none', angle_facts: ['Fact one', 'Fact two'], angle_opener: 'Hi there.', angle_upsell: 'Básico', angle_checked_at: '2026-11-09' })
    expect(result.items[3]).toMatchObject({ angle: null, website_status: null, angle_opener: null })
  })
})
