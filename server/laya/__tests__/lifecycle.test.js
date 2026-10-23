import { describe, expect, it } from 'vitest'
import { buildNegocioListoLifecycle } from '../../lifecycle/negocio-listo.js'
import { evaluateLifecycleItems } from '../lifecycle.js'
import { buildCeoToday } from '../../ceo/today.js'
const agreement={id:'a',workspace_id:'w',client_id:'c',product_name:'Negocio Listo Básico',setup_cents:30000,monthly_cents:14900,term_months:2,launch_date:null,created_at:'2026-10-01T12:00:00Z'}
const project={id:'p',workspace_id:'w',client_id:'c',service_agreement_id:'a',status:'in_progress',actual_hours:3}
const bill={id:'b',workspace_id:'w',client_id:'c',status:'expected',amount_cents:30000,currency:'USD',due_date:'2026-10-22'}
const installment={id:'i',workspace_id:'w',agreement_id:'a',installment:0,financial_obligation_id:'b'}
const receipt={id:'r',workspace_id:'w',financial_obligation_id:'b',amount_cents:30000,received_at:'2026-10-20T12:00:00Z'}
const base={workspaceId:'w',leads:[],agreements:[agreement],projects:[project],installments:[installment],obligations:[bill],receipts:[receipt],requirements:[],clients:[],available:true,now:new Date('2026-10-21T18:00:00Z')}
const build=changes=>{const input={...base,...changes};return evaluateLifecycleItems(buildNegocioListoLifecycle(input),input)}
const monthly=[1,2].map(n=>({id:`i${n}`,workspace_id:'w',agreement_id:'a',installment:n,financial_obligation_id:`b${n}`}))
const monthlyBills=monthly.map((row,i)=>({...bill,id:row.financial_obligation_id,amount_cents:14900,due_date:`2027-0${i+1}-21`}))
const launched={agreements:[{...agreement,launch_date:'2026-10-21'}],installments:[installment,...monthly],obligations:[bill,...monthlyBills]}
describe('deterministic Laya lifecycle verdict fixtures',()=>{
 it.each([
  ['setup_payment_pending','do',{receipts:[]}],
  ['payment_overdue','do',{receipts:[],obligations:[{...bill,due_date:'2026-10-20'}]}],
  ['needs_data','needs_data',{installments:[]}],
  ['needs_data','needs_data',{projects:[]}],
  ['needs_data','needs_data',{projects:[project,{...project,id:'other-project'}]}],
  ['paused','hold',{projects:[{...project,status:'paused'}]}],
  ['launch_record_pending','do',{projects:[{...project,status:'completed'}]}],
  ['in_delivery','do',{}],
  ['waiting_on_client','hold',{requirements:[{id:'q',workspace_id:'w',project_id:'p',status:'needed',timing:'needed_now',responsible_party:'client',label:'Logo'}]}],
  ['waiting_on_cws','do',{requirements:[{id:'q',workspace_id:'w',project_id:'p',status:'needed',timing:'needed_now',responsible_party:'cws',label:'Build'}]}],
  ['launched','hold',launched],
  ['term_completed','do',{...launched,agreements:[{...agreement,launch_date:'2025-01-01'}]}],
  ['payment_due','do',{...launched,obligations:[bill,{...monthlyBills[0],due_date:'2026-10-21'},monthlyBills[1]]}],
 ])('derives %s → %s with exact source claims',(stage,verdict,changes)=>{
  const row=build(changes).items[0]
  expect(row.stage).toBe(stage);expect(row.evaluation).toMatchObject({evaluator:'lifecycle',policy_version:'lifecycle-v2',subject:{type:'client_service_agreement',id:'a',workspace_id:'w'},stage,verdict,time_zone:'America/Chicago',business_date:'2026-10-21',related_decisions:[]})
  expect(row.evaluation.why.length).toBeGreaterThan(0)
  for(const claim of row.evaluation.why){expect(claim.source.workspace_id).toBe('w');expect(claim.source.fields.id).toBe(claim.source.id)}
  expect(row.response_input.agreement).toEqual({...agreement,...changes.agreements?.[0]})
 })
 it('evaluates explicit inquiries without inferring signature and uses Chicago clock',()=>{
  const lead={id:'l',workspace_id:'w',name:'Synthetic',source:'negocio-listo|inline',status:'new'}
  const row=build({leads:[lead],agreements:[],now:new Date('2026-10-22T04:59:59Z')}).items[0]
  expect(row.evaluation).toMatchObject({verdict:'do',stage:'prospect',business_date:'2026-10-21',money_at_stake:null})
  expect(row.response_input.lead).toEqual(lead)
  expect(row.response_input.obligations).toEqual([])
  expect(row.evaluation.why[0].source.fields).toEqual(lead)
 })
 it.each([
  {receipts:[{...receipt,amount_cents:Number.MAX_SAFE_INTEGER},{...receipt,id:'r2'}]},
  {installments:[installment,{...installment,id:'another',installment:1}]},
  {available:false},{agreements:[{...agreement,launch_date:'2026-10-22'}]},
  {installments:[installment,{...installment,id:'duplicate'}]},
  {obligations:[{...bill,currency:'EUR'}]}, {receipts:[{...receipt,amount_cents:-1}]},
  {projects:[{...project,actual_hours:1.5}]}, {...launched,installments:monthly,obligations:monthlyBills},
  {agreements:[{...agreement,monthly_cents:null}]},
 ])('flags missing/inconsistent sources rather than guessing: %j',changes=>{
  const evaluation=build(changes).items[0].evaluation
  expect(evaluation.verdict).toBe('needs_data');expect(evaluation.missing_data.length).toBeGreaterThan(0);expect(evaluation.money_at_stake).toBeNull()
 })
 it('excludes future receipts from known current balance and retains them in exact input',()=>{
  const future={...receipt,received_at:'2026-10-22T12:00:00Z'}
  const row=build({receipts:[future]}).items[0]
  expect(row.evaluation.money_at_stake).toEqual({amount_cents:30000,currency:'USD'})
  expect(row.response_input.receipts).toEqual([future])
 })
 it('scopes inputs to explicit same-workspace source relationships',()=>{
  const row=build({projects:[project,{...project,id:'foreign',workspace_id:'other'},{...project,id:'unlinked',service_agreement_id:null}],receipts:[receipt,{...receipt,id:'unrelated',financial_obligation_id:'other'}]}).items[0]
  expect(row.response_input.projects).toEqual([project]);expect(row.response_input.receipts).toEqual([receipt])
  expect(JSON.stringify(row.evaluation)).not.toContain('foreign')
 })
 it('does not change lifecycle stage, source data or CEO priority order',()=>{
  const plain=buildNegocioListoLifecycle(base),evaluated=build({})
  const before=JSON.stringify(base)
  expect(evaluated.items.map(row=>[row.id,row.stage,row.priority_tier])).toEqual(plain.items.map(row=>[row.id,row.stage,row.priority_tier]))
  expect(buildCeoToday({lifecycle:evaluated,now:base.now}).all_actions.map(row=>row.id)).toEqual(buildCeoToday({lifecycle:plain,now:base.now}).all_actions.map(row=>row.id))
  expect(JSON.stringify(base)).toBe(before)
 })
})

describe('paid setup due-date policy',()=>{
 it('allows fully paid setup without a due date and preserves exact evidence',()=>{
  const changes={obligations:[{...bill,due_date:null}]}
  const before=JSON.stringify(changes)
  const row=build(changes).items[0]
  expect(row.evaluation).toMatchObject({policy_version:'lifecycle-v2',stage:'in_delivery',verdict:'do',missing_data:[]})
  expect(row.response_input.obligations[0].due_date).toBeNull()
  expect(row.response_input.receipts).toEqual([receipt])
  expect(JSON.stringify(changes)).toBe(before)
 })
 it('uses multiple current receipts and permits overpayment without inferring new cash',()=>{
  expect(build({obligations:[{...bill,due_date:null}],receipts:[{...receipt,amount_cents:10000},{...receipt,id:'r2',amount_cents:20001}]}).items[0].evaluation.verdict).toBe('do')
 })
 it.each([
  {receipts:[]},
  {receipts:[{...receipt,amount_cents:29999}]},
  {receipts:[{...receipt,received_at:'2026-10-22T12:00:00Z'}]},
  {receipts:[{...receipt,financial_obligation_id:'unrelated'}]},
  {receipts:[{...receipt,workspace_id:'other'}]},
  {receipts:[{...receipt,amount_cents:-30000}]},
  {receipts:[{...receipt,received_at:'invalid'}]},
  {receipts:[{...receipt,amount_cents:Number.MAX_SAFE_INTEGER},{...receipt,id:'r2'}]},
 ])('keeps missing-date checks when valid current setup coverage is absent: %j',changes=>{
  expect(build({obligations:[{...bill,due_date:null}],...changes}).items[0].evaluation.verdict).toBe('needs_data')
 })
 it.each(['2026-02-30','invalid'])('rejects a malformed supplied setup date even when paid: %s',due_date=>{
  expect(build({obligations:[{...bill,due_date}]}).items[0].evaluation.verdict).toBe('needs_data')
 })
 it('keeps monthly due dates mandatory even if a monthly bill is paid',()=>{
  const row=build({...launched,obligations:[bill,{...monthlyBills[0],due_date:null},monthlyBills[1]],receipts:[receipt,{...receipt,id:'monthly-receipt',financial_obligation_id:'b1',amount_cents:14900}]}).items[0]
  expect(row.evaluation.verdict).toBe('needs_data')
 })
 it('retains unpaid due and overdue advice for valid dates',()=>{
  expect(build({receipts:[]}).items[0].evaluation.verdict).toBe('do')
  expect(build({receipts:[],obligations:[{...bill,due_date:'2026-10-20'}]}).items[0].evaluation).toMatchObject({stage:'payment_overdue',verdict:'do'})
 })
})
