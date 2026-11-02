import { describe, expect, it } from 'vitest'
import { evaluatePriority, priorityInputs } from '../priority-review.js'
import { evidenceWhy, recommendation, review30Days, scopeCheck, sourceVersion, visibleMoves } from '../next-move.js'
const now = new Date('2026-11-01T18:00:00Z')
const source = (fields, table = 'leads') => ({ claim: '', source: { id: 'row', table, workspace_id: 'w', fields } })
const card = { id: 'card', priority_tier: 2, business_priority: 'GET MONEY', department: 'SALES', source_type: 'sales_command', human_action: 'Review follow-up', actionable_on: '2026-11-01', evaluation: { why: [source({ status: 'open', due_on: '2026-11-01' })] } }
describe('Laya Decision Rules V1', () => {
  it('uses each of five templates only with its required evidence', () => {
    expect(evidenceWhy({ due:'2026-11-01', status:'open' }).template).toBe(1)
    expect(evidenceWhy({ updated:'2026-10-31', status:'waiting' }).template).toBe(2)
    expect(evidenceWhy({ due:'2026-11-01', onlyOpen:true, lane:'money', client:'Synthetic studio' }).template).toBe(3)
    expect(evidenceWhy({ projectStatus:'waiting', client:'Synthetic studio', task:'Review copy', open:true }).template).toBe(4)
    expect(evidenceWhy({ task:'Review copy', due:'2026-11-01', lastAction:'do', actionDate:'2026-10-31' }).template).toBe(5)
    expect(evidenceWhy({ due:'2026-02-30', onlyOpen:false, lane:'money', client:'Studio' }).template).toBeNull()
    expect(evidenceWhy({ due:'2026-11-01', onlyOpen:false, status:'open' }).template).toBe(1)
    expect(evidenceWhy({})).toMatchObject({ template:null, text:expect.stringContaining('missing') })
  })
  it('classifies only supported actual facts and never treats generated eligibility as a due date', () => {
    expect(recommendation(card,now).type).toBe('money_follow_up')
    expect(recommendation({...card, priority_tier:1},now).type).toBe('urgent_deadline')
    expect(recommendation({...card, department:'MARKETING', business_priority:'MARKETING'},now).type).toBe('marketing_action')
    expect(recommendation({...card, department:'OPERATIONS', business_priority:'DELIVER', evaluation:{why:[source({status:'needed'},'project_requirements')]}},now).type).toBe('delivery_blocker')
    expect(recommendation({...card,evaluation:{why:[source({status:'open'})]}},now).type).toBeNull()
    expect(recommendation({...card,source_type:'fallback',evaluation:{why:[]}},now)).toMatchObject({ type:null, why:{template:null} })
  })
  it('uses recorded action evidence and rejects future action timestamps', () => {
    const events=[{id:'e',card_id:'card',action:'do',created_at:'2026-10-31T15:00:00Z'}]
    expect(recommendation(card,now,events).why.template).toBe(5)
    expect(recommendation(card,now,[{...events[0],created_at:'2026-11-02T15:00:00Z'}]).why.template).toBe(1)
  })
  it('keeps scope unknown until evidence exists and checks revisions and the exact floor', () => {
    const evidence={agreement_reference:'Agreement section 2',request:'Another page',inclusion:'addition'}
    expect(scopeCheck(null).status).toBe('needs_data')
    expect(scopeCheck(evidence).status).toBe('likely_scope_change')
    expect(scopeCheck({...evidence,inclusion:'revision'}).status).toBe('needs_data')
    expect(scopeCheck({...evidence,inclusion:'revision',revisions_used:1,revision_allowance:2}).status).toBe('included_revision')
    expect(scopeCheck({...evidence,inclusion:'revision',revisions_used:2,revision_allowance:2}).status).toBe('likely_scope_change')
    expect(scopeCheck({...evidence,estimated_hours:2,proposed_fee_cents:9999}).below_floor).toBe(true)
    expect(scopeCheck({...evidence,estimated_hours:2,proposed_fee_cents:10000}).below_floor).toBe(false)
  })
  it('separates deferrals, pending and skipped outcomes, excludes outside-window events, and does not invent zero acceptance', () => {
    const rec={type:'money_follow_up',rule:'v1:money'}
    const event=(action,extra={})=>({id:action,card_id:action,action,recommendation:rec,created_at:'2026-10-31T18:00:00Z',...extra})
    const rows=[event('do'),event('drop'),event('later'),event('close',{card_id:'one',outcome:'yes'}),event('close',{card_id:'two',outcome:'no'}),event('close',{card_id:'three',outcome:'not_yet'}),event('close',{card_id:'four',outcome:'skip'}),event('do',{created_at:'2026-09-01T00:00:00Z'}),event('drop',{created_at:'2026-11-03T00:00:00Z'})]
    expect(review30Days(rows,now)[0]).toMatchObject({accepted:1,dropped:1,deferred:1,yes:1,no:1,pending:1,skipped:1,acceptance:.5})
    expect(review30Days([event('later')],now)[0].acceptance).toBeNull()
    expect(review30Days([...rows,event('close',{card_id:'three',outcome:'yes',created_at:'2026-11-01T17:00:00Z'})],now)[0]).toMatchObject({yes:2,pending:0})
  })
  it('keeps Later across changed facts until Chicago midnight two days later, backfills top three, and leaves Not yet available', () => {
    const cards=[card,...Array.from({length:3},(_,i)=>({...card,id:`other-${i}`}))]
    const event={id:'event',card_id:card.id,action:'later',defer_until:'2026-11-03',source_version:sourceVersion(card),created_at:now.toISOString()}
    expect(visibleMoves(cards,[event],now).map(c=>c.id)).toEqual(['other-0','other-1','other-2'])
    expect(visibleMoves([{...card,source_timestamp:'changed'}],[event],new Date('2026-11-03T05:59:59Z'))).toEqual([])
    expect(visibleMoves(cards,[event],new Date('2026-11-03T06:00:00Z'))[0].id).toBe(card.id)
    expect(visibleMoves(cards,[{...event,action:'close',outcome:'yes'}],now)).not.toContain(card)
    expect(visibleMoves(cards,[{...event,action:'close',outcome:'not_yet'}],now)).toContain(card)
    expect(visibleMoves([{...card,source_timestamp:'changed'}],[{...event,action:'drop'}],now)).toHaveLength(1)
  })
})

// Synthetic schedule/register fixtures, not production client data.
describe('Marketing missed-slot evidence explanation', () => {
  const marketingCard = {id:'marketing:missed:2026-10-26:post-b',source_type:'marketing_missed',department:'MARKETING',priority_tier:1,actionable_on:'2026-10-30',human_action:'Resolve missed Marketing post'}
  const context = {workspaceId:'w',now,availability:{attempts:true,resolutions:true,destinations:true},
    attempts:[{id:'unrelated',workspace_id:'w',marketing_slot_key:'2026-10-26:post-a',provider_status:'posted',updated_at:'2026-10-29T00:00:00Z'}]}
  const explain = (ctx=context, card=marketingCard) => recommendation({...card,evaluation:evaluatePriority(priorityInputs(ctx,card))},now)
  it('uses the exact scheduled occurrence and complete absence checks, never a different post', () => {
    const result=explain()
    expect(result.why).toEqual({template:1,text:'Post B was scheduled for 2026-10-30; no publishing attempt or owner resolution is recorded in CWS for that slot.'})
    expect(result.source).toMatchObject({kind:'derived_schedule',policy:'src/marketing/weeklySlots.js',slot_key:'2026-10-26:post-b',attempt_id:null,resolution_id:null})
    expect(result.type).toBe('marketing_action')
    expect(result.fields.due).toBeNull()
  })
  it.each(['attempts','resolutions','destinations'])('withholds absence claims when %s reads fail or hit their cap', key => {
    expect(explain({...context,availability:{...context.availability,[key]:false}}).why.template).toBeNull()
  })
  it('withholds the missed explanation when the slot has an attempt or owner resolution', () => {
    expect(explain({...context,attempts:[{...context.attempts[0],marketing_slot_key:'2026-10-26:post-b'}]}).why.template).toBeNull()
    expect(explain({...context,resolutions:[{id:'resolved',workspace_id:'w',occurrence_slot_key:'2026-10-26:post-b'}]}).why.template).toBeNull()
  })
  it('rejects mismatched or missing occurrence evidence instead of borrowing another record', () => {
    const evaluation=evaluatePriority(priorityInputs(context,marketingCard))
    for(const change of [{slot_key:'2026-10-26:post-a'},{scheduled_date:'2026-10-31'},{workspace_id:'other'}]) {
      expect(recommendation({...marketingCard,evaluation:{...evaluation,marketing_occurrence:{...evaluation.marketing_occurrence,...change}}},now).why.template).toBeNull()
    }
    expect(recommendation({...marketingCard,evaluation:{why:[source({status:'posted',updated_at:'2026-10-29T00:00:00Z'},'marketing_publish_attempts')]}},now).why.template).toBeNull()
  })
})


describe('Sales first-contact queue explanations', () => {
  const clock=new Date('2026-11-02T18:00:00Z')
  const lead={id:'synthetic',workspace_id:'w',name:'Synthetic',status:'new',sales_classification:'prospect',response_state:'no_response',phone:'123',email:null,created_at:'2026-10-01T12:00:00Z',last_contacted_at:null}
  const item={id:'sales:new_prospect:synthetic',lead_id:'synthetic',source_type:'sales_command',department:'SALES',actionable_on:'2026-10-01'}
  const context={workspaceId:'w',now:clock,leads:[lead],availability:{leads:true,promises:true,sends:true}}
  const explain=(changes={})=>recommendation({...item,evaluation:evaluatePriority(priorityInputs({...context,...changes},item))},clock)
  it('explains first-contact eligibility without inventing urgency',()=>{
    const result=explain()
    expect(result.why.text).toBe('Prospect with no contact date or successful introductory email recorded in CWS; phone available for first-contact review. No due promise is recorded.')
    expect(result.source).toMatchObject({lead_id:lead.id,reads_complete:true,no_successful_intro:true,due_promises:0})
  })
  it('acknowledges prior contact in Chicago time and ignores completed promises as urgency',()=>{
    const result=explain({leads:[{...lead,status:'contacted',last_contacted_at:'2026-10-02T00:30:00Z'}],promises:[{id:'done',workspace_id:'w',lead_id:lead.id,due_on:'2026-10-01',completed_at:'2026-10-02T00:31:00Z'}]})
    expect(result.why.text).toBe('Last contact logged 2026-10-01; response is marked “no response.” Review the next phone contact. No due promise is recorded.')
    expect(result.why.text).not.toContain('first-contact')
  })
  it.each(['leads','promises','sends'])('does not make absence claims from incomplete %s reads',key=>{
    expect(explain({availability:{...context.availability,[key]:false}}).fields.salesOpportunity).toBeUndefined()
  })
  it('does not reuse first-contact eligibility after a successful intro or for a closed lead',()=>{
    expect(explain({sends:[{id:'sent',workspace_id:'w',lead_id:lead.id,send_type:'intro',status:'sent',sent_at:'2026-11-01T18:00:00Z'}]}).fields.salesOpportunity).toBeUndefined()
    expect(explain({leads:[{...lead,status:'won'}]}).fields.salesOpportunity).toBeUndefined()
  })
  it('does not label a real due promise absent or claim first contact for a contacted lead with an unknown date',()=>{
    expect(explain({promises:[{id:'due',workspace_id:'w',lead_id:lead.id,due_on:'2026-11-01',completed_at:null}]}).why.text).not.toContain('No due promise')
    expect(explain({leads:[{...lead,status:'contacted'}]}).why.text).toContain('review the existing contact history')
  })
})
