import { describe, it, expect } from 'vitest'
import { buildGoalPace } from '../goal-pace.js'

const input = { workspaceId: 'workspace-a', now: new Date('2026-10-22T02:00:00Z') }
describe('goal pace evidence boundaries', () => {
  it('keeps unknown counts and pace instead of treating empty records as zero', () => {
    const pace = buildGoalPace(input)
    expect(pace.business_date).toBe('2026-10-21')
    expect(pace.goal).toEqual({ target: 10, deadline: '2026-12-31', recorded: null, remaining: null, days_remaining: 71 })
    expect(pace.checkpoint.days_remaining).toBe(25)
    expect(pace.recorded_agreements).toBe(0)
    expect(pace.verdict).toBe('needs_data')
    expect(pace.related_decisions).toEqual([])
    expect(pace.money_at_stake).toBeNull()
  })
  it('scopes recorded evidence without inferring signatures from launch, payments or provider reference', () => {
    const agreement = { id:'a',workspace_id:'workspace-a',product_name:'Negocio Listo Básico',created_at:'2026-10-20',launch_date:'2026-10-21',square_subscription_reference:'subscription',status:'active',signed_at:'2026-10-20' }
    const pace = buildGoalPace({...input,agreements:[agreement,{...agreement,id:'b',workspace_id:'other'},{...agreement,id:'c',product_name:'Other'}]})
    expect(pace.recorded_agreements).toBe(1)
    expect(pace.why[0].source.id).toBe('a')
    expect(pace.goal.recorded).toBeNull()
    expect(pace.checkpoint.recorded).toBeNull()
    expect(pace.assumptions).toEqual([])
  })
  it('reports failed reads as unavailable, never as zero', () => {
    const pace = buildGoalPace({...input,available:false})
    expect(pace.recorded_agreements).toBeNull()
    expect(pace.missing_data).toContain('Agreement records are unavailable.')
  })
  it('keeps missing evidence explicit after deadlines and at Chicago midnight', () => {
    const pace = buildGoalPace({...input,now:new Date('2027-01-01T06:00:00Z')})
    expect(pace.goal.days_remaining).toBe(-1)
    expect(pace.verdict).toBe('needs_data')
    expect(pace.missing_data).toHaveLength(4)
  })
})
