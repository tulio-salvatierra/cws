import {describe,it,expect} from 'vitest'
import {priorityInputs,evaluatePriority,decoratePriorities} from '../priority-review.js'
import {buildCeoToday} from '../../ceo/today.js'
import {buildOperationsReadModel} from '../../operations/readiness.js'
const now='2026-10-22T17:00:00.000Z'
const lead={id:'l',workspace_id:'w',name:'Synthetic',phone:'123',status:'new',sales_classification:'inbound',created_at:'2026-10-21T15:00:00Z'}
const project={id:'p',workspace_id:'w',name:'Synthetic',status:'in_progress',created_at:'2026-10-20T15:00:00Z'}
const requirement={id:'r',workspace_id:'w',project_id:'p',label:'Assets',status:'needed',timing:'needed_now',responsible_party:'client'}
const obligation={id:'b',workspace_id:'w',amount_cents:50000,currency:'USD',status:'expected',due_date:'2026-10-22',created_at:now}
const compliance={id:'c',workspace_id:'w',title:'Synthetic obligation',status:'active',applicability_status:'applies',authority_name:'Recorded authority',source_url:'https://example.test/authority',verified_by_owner_at:now,verified_by_owner_id:'owner',next_due_date:'2026-10-22',created_at:now}
const availability=Object.fromEntries(['leads','promises','sends','projects','requirements','clients','obligations','recurring','receipts','compliance','completions','attempts','resolutions','destinations'].map(k=>[k,true]))
const context={workspaceId:'w',now,leads:[lead],projects:[project],requirements:[requirement],obligations:[obligation],compliance:[compliance],availability}
const action=(source_type,id,extra={})=>({source_type,id,human_action:'Review synthetic source',...extra})
const evaluate=(card,changes={})=>evaluatePriority(priorityInputs({...context,...changes},card))
describe('Deterministic remaining priority rules',()=>{
 it.each([
 ['inbound',{},'sales:inbound:l','do'],
 ['warm',{sales_classification:'prospect',response_state:'warm',status:'responded'},'sales:warm:l','do'],
 ['new',{sales_classification:'prospect',response_state:'no_response'},'sales:new_prospect:l','do'],
 ['closed',{status:'won'},'sales:inbound:l','skip'],
 ['test',{is_test:true},'sales:inbound:l','skip'],
 ['missing contact',{phone:null},'sales:inbound:l','needs_data'],
 ['unclassified',{sales_classification:null},'sales:inbound:l','needs_data'],
 ])('Sales %s produces %s without contacting anyone',(_name,override,id,verdict)=>{
  expect(evaluate(action('sales_command',id,{lead_id:'l'}),{leads:[{...lead,...override}]}).verdict).toBe(verdict)
 })
 it('derives follow-up and due promises from actual rows, retaining exact sources',()=>{
  const promise={id:'promise',workspace_id:'w',lead_id:'l',action_text:'Review',due_on:'2026-10-21'}
  const send={id:'s',workspace_id:'w',lead_id:'l',send_type:'intro',status:'delivered',sent_at:'2026-10-18T15:00:00Z'}
  expect(evaluate(action('sales_command','sales:promise',{lead_id:'l'}),{promises:[promise]}).verdict).toBe('do')
  const result=evaluate(action('sales_command','sales:follow_up:l',{lead_id:'l'}),{leads:[{...lead,status:'contacted',sales_classification:'prospect',response_state:'no_response'}],sends:[send]})
  expect(result.verdict).toBe('do');expect(result.why.some(s=>s.source.table==='outreach_sends' && s.source.fields===send)).toBe(false)
  expect(result.why.find(s=>s.source.table==='outreach_sends').source.fields).toEqual(send)
 })
 it.each([['client','hold'],['cws','do']])('Operations %s blocker yields %s',(responsible_party,verdict)=>{
  expect(evaluate(action('operations_delivery','operations:p',{project_id:'p'}),{requirements:[{...requirement,responsible_party}]}).verdict).toBe(verdict)
 })
 it('does not treat an absent checklist or invalid source as ready',()=>{
  expect(evaluate(action('operations_delivery','operations:p',{project_id:'p'}),{requirements:[]}).verdict).toBe('needs_data')
  expect(evaluate(action('operations_delivery','operations:p',{project_id:'p'}),{requirements:[{...requirement,status:'broken'}]}).verdict).toBe('needs_data')
  expect(evaluate(action('operations_delivery','operations:p',{project_id:'p'}),{projects:[{...project,status:'paused'}]}).verdict).toBe('skip')
 })
 it('Accounting uses current valid receipt evidence and exact cents',()=>{
  const card=action('accounting_financial','accounting:financial_obligation:b')
  const receipt={id:'paid',workspace_id:'w',financial_obligation_id:'b',amount_cents:10000,received_at:'2026-10-21T10:00:00Z'}
  expect(evaluate(card,{receipts:[receipt]})).toMatchObject({verdict:'do',money_at_stake:{amount_cents:40000,currency:'USD'}})
  expect(evaluate(card,{receipts:[{...receipt,amount_cents:50000}]}).verdict).toBe('hold')
  expect(evaluate(card,{receipts:[{...receipt,received_at:'2026-10-23T10:00:00Z'}]}).verdict).toBe('needs_data')
  expect(evaluate(card,{obligations:[{...obligation,currency:'EUR'}]}).money_at_stake).toBeNull()
  expect(evaluate(card,{obligations:[{...obligation,due_date:'2026-02-30'}]}).verdict).toBe('needs_data')
 })
 it('recurring evidence never proves collected revenue',()=>{
  const result=evaluate(action('accounting_financial','accounting:recurring_revenue:q'),{recurring:[{id:'q',workspace_id:'w',status:'active',next_expected_at:'2026-10-21',cadence:'monthly',amount_cents:7000,currency:'USD',created_at:now}]})
  expect(result).toMatchObject({verdict:'do',money_at_stake:null})
 })
 it.each([['applies','2026-10-22','do'],['applies','2026-10-20','do'],['applies','2026-10-25','hold'],['needs_verification','2026-10-20','needs_data'],['not_applicable','2026-10-20','skip']])('Compliance %s %s gives %s',(applicability_status,next_due_date,verdict)=>{
  expect(evaluate(action('compliance_requirement','compliance:c'),{compliance:[{...compliance,applicability_status,next_due_date}]}).verdict).toBe(verdict)
 })
 it('Compliance never supplies missing authority or owner verification',()=>{
  expect(evaluate(action('compliance_requirement','compliance:c'),{compliance:[{...compliance,source_url:null}]}).verdict).toBe('needs_data')
 })
 it('Marketing distinguishes calendar preview, missed slots, failure and resolution without publishing',()=>{
  const now='2026-10-23T17:00:00Z'
  expect(evaluate(action('marketing_ready','marketing:ready:2026-10-19:post-b'),{now}).verdict).toBe('needs_data')
  expect(evaluate(action('marketing_missed','marketing:missed:2026-10-19:post-a'),{now}).verdict).toBe('do')
  const attempt={id:'m',workspace_id:'w',marketing_slot_key:'2026-10-19:post-b',provider_status:'error',created_at:now,updated_at:now}
  expect(evaluate(action('marketing_delivery_failure','marketing:failure:2026-10-19:post-b'),{now,attempts:[attempt]}).verdict).toBe('do')
 })
 it('fallback retains its prompt but flags missing real evidence',()=>{
  const result=evaluate(action('fallback','sales:fallback:find-next-customer'))
  expect(result.verdict).toBe('needs_data');expect(result.why).toEqual([]);expect(result.policy_sources.length).toBeGreaterThan(0)
 })
 it('unavailable/capped reads withhold confident verdicts and unrelated/foreign data is excluded',()=>{
  const card=action('sales_command','sales:inbound:l',{lead_id:'l'})
  const inputs=priorityInputs({...context,leads:[lead,{...lead,id:'other',workspace_id:'foreign'}],availability:{...availability,sends:false}},card)
  expect(inputs.sources.some(s=>s.row.id==='other')).toBe(false)
  expect(evaluatePriority(inputs).verdict).toBe('needs_data')
 })
 it('decorates every card after ordering without changing any priority field, count, clock or source data',()=>{
  const operations=buildOperationsReadModel({workspaceId:'w',projects:[project],requirements:[requirement]})
  const data=buildCeoToday({leads:[lead],operationsProjects:operations.ceo_projection,now:new Date(now)})
  const original=JSON.parse(JSON.stringify(data));const raw=JSON.stringify(context)
  const reviews=decoratePriorities(data,context)
  expect(data.actions.map(card=>Object.fromEntries(Object.entries(card).filter(([key])=>key!=='evaluation')))).toEqual(original.actions)
  expect(data.all_actions.map(card=>Object.fromEntries(Object.entries(card).filter(([key])=>key!=='evaluation')))).toEqual(original.all_actions)
  expect(Object.keys(reviews)).toEqual([...new Set([...data.all_actions,...data.actions].map(a=>a.id))])
  expect(JSON.stringify(context)).toBe(raw)
 })
 it('reuses the exact existing lifecycle evaluation/inputs on a linked priority card',()=>{
  const evaluation={evaluator:'lifecycle',verdict:'do'},input={workspaceId:'w',lead}
  const data=buildCeoToday({leads:[lead],now:new Date(now)});data.negocio_listo={items:[{id:'lifecycle:lead:l',lead_id:'l',evaluation}]}
  expect(decoratePriorities(data,context,{'lifecycle:lead:l':input})[data.all_actions.find(a=>a.lead_id==='l').id]).toBe(input)
  expect(data.all_actions.find(a=>a.lead_id==='l').evaluation).toBe(evaluation)
 })
})

it('separates identical IDs across Accounting tables and never borrows obligation receipts for recurring reviews',()=>{
 const result=evaluate(action('accounting_financial','accounting:recurring_revenue:b'),{recurring:[{...obligation,cadence:'monthly',next_expected_at:'2026-10-20',status:'active'}],receipts:[{id:'future',workspace_id:'w',financial_obligation_id:'b',amount_cents:500,received_at:'2099-01-01T00:00:00Z'}]})
 expect(result.verdict).toBe('do');expect(result.why.some(claim=>claim.source.table==='payment_receipts')).toBe(false)
})
it('uses Chicago calendar at the UTC-day and DST boundary',()=>{
 const result=evaluate(action('compliance_requirement','compliance:c'),{now:'2026-11-02T05:30:00Z',compliance:[{...compliance,next_due_date:'2026-11-01'}]})
 expect(result.business_date).toBe('2026-11-01');expect(result.verdict).toBe('do')
})
