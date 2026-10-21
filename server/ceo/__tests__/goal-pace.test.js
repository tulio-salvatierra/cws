import { describe, it, expect } from 'vitest'
import { buildGoalPace, goalSnapshot } from '../goal-pace.js'

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
    expect(pace.missing_data.some(item=>item.includes('Agreement a'))).toBe(true)
    expect(pace.goal.recorded).toBeNull()
    expect(pace.checkpoint.recorded).toBeNull()
    expect(pace.assumptions).toEqual([])
  })
  it('reports failed reads as unavailable, never as zero', () => {
    const pace = buildGoalPace({...input,available:false})
    expect(pace.recorded_agreements).toBeNull()
    expect(pace.missing_data).toContain('Agreement or goal evidence records are unavailable.')
  })
  it('keeps missing evidence explicit after deadlines and at Chicago midnight', () => {
    const pace = buildGoalPace({...input,now:new Date('2027-01-01T06:00:00Z')})
    expect(pace.goal.days_remaining).toBe(-1)
    expect(pace.verdict).toBe('needs_data')
    expect(pace.missing_data.length).toBeGreaterThan(0)
  })
})

const agreement={id:'a',client_id:'client',workspace_id:'workspace-a',product_name:'Negocio Listo Básico'}
const proof={revision:1,agreement_id:'a',client_id:'client',workspace_id:'workspace-a',counts_toward_goal:true,signature_status:'signed',signed_on:'2026-10-20',subscription_status:'active',status_on:'2026-10-21',source_note:'Checked signed contract and subscription',created_by:'owner',created_at:'2026-10-21T12:00:00Z'}
function verified(evidence=[proof],agreements=[agreement]) {
 return {...input,agreements,evidence,completeness:[{id:'check',workspace_id:input.workspaceId,confirmed_on:'2026-10-21',snapshot:goalSnapshot(agreements,evidence),created_at:'2026-10-21T13:00:00Z'}]}
}
describe('verified goal counts',()=>{
 it('uses complete current owner evidence for counts and gaps with sources',()=>{
  const pace=buildGoalPace(verified())
  expect(pace).toMatchObject({verified:true,verdict:'do',goal:{recorded:1,remaining:9},checkpoint:{recorded:1,remaining:3}})
  expect(pace.missing_data).toEqual([])
  expect(pace.why.map(r=>r.source.table)).toEqual(['negocio_listo_evidence','negocio_listo_completeness'])
 })
 it('permits verified zero only after explicit complete empty register confirmation',()=>{
  const pace=buildGoalPace(verified([],[]))
  expect(pace.goal.recorded).toBe(0)
  expect(pace.checkpoint.recorded).toBe(0)
 })
 it.each(['new evidence','new agreement','tomorrow','wrong workspace','missing signature','unknown status','duplicate core'])('fails closed for %s',scenario=>{
  const data=verified()
  if(scenario==='new evidence')data.evidence=[{...proof,revision:2}]
  if(scenario==='new agreement')data.agreements=[agreement,{...agreement,id:'b'}]
  if(scenario==='tomorrow')data.now=new Date('2026-10-22T12:00:00Z')
  if(scenario==='wrong workspace')data.completeness[0].workspace_id='other'
  if(scenario==='missing signature')data.evidence=[{...proof,signed_on:null}]
  if(scenario==='unknown status')data.evidence=[{...proof,subscription_status:'unknown'}]
  if(scenario==='duplicate core')Object.assign(data,verified([proof,{...proof,revision:2,agreement_id:'b'}],[agreement,{...agreement,id:'b'}]))
  const pace=buildGoalPace(data)
  expect(pace.verdict).toBe('needs_data');expect(pace.goal.recorded).toBeNull()
 })
 it('counts signed by checkpoint independently of active status and excludes add-ons',()=>{
  const data=verified([{...proof,subscription_status:'cancelled'},{...proof,revision:2,agreement_id:'b',counts_toward_goal:false}],[agreement,{...agreement,id:'b'}])
  expect(buildGoalPace(data)).toMatchObject({goal:{recorded:0},checkpoint:{recorded:1}})
 })
 it('does not count signatures after the checkpoint',()=>{
  const data=verified([{...proof,signed_on:'2026-11-16',status_on:'2026-11-17'}]);data.now=new Date('2026-11-17T12:00:00Z');data.completeness[0].confirmed_on='2026-11-17'
  expect(buildGoalPace(data)).toMatchObject({goal:{recorded:1},checkpoint:{recorded:0}})
 })
})
