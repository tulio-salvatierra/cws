import {describe,it,expect} from 'vitest'
import {buildNegocioListoLifecycle} from '../negocio-listo.js'
import {buildCeoToday} from '../../ceo/today.js'
const agreement={id:'a',workspace_id:'w',client_id:'c',product_name:'Negocio Listo — Básico',setup_cents:30000,monthly_cents:14900,term_months:12,launch_date:null}
const project={id:'p',workspace_id:'w',client_id:'c',service_agreement_id:'a',status:'in_progress',actual_hours:3}
const bill={id:'b',workspace_id:'w',client_id:'c',status:'expected',amount_cents:30000,due_date:'2026-10-22'}
const installment={id:'i',workspace_id:'w',agreement_id:'a',installment:0,financial_obligation_id:'b'}
const receipt={id:'r',workspace_id:'w',financial_obligation_id:'b',amount_cents:30000,received_at:'2026-10-20T12:00:00Z'}
const base={workspaceId:'w',agreements:[agreement],projects:[project],installments:[installment],obligations:[bill],receipts:[receipt],now:new Date('2026-10-21T18:00:00Z')}
const build=changes=>buildNegocioListoLifecycle({...base,...changes})
describe('Negocio Listo lifecycle evidence',()=>{
 it.each([
  ['setup_payment_pending',{receipts:[]}],
  ['payment_overdue',{receipts:[],obligations:[{...bill,due_date:'2026-10-20'}]}],
  ['needs_data',{installments:[]}],
  ['needs_data',{projects:[]}],
  ['needs_data',{projects:[project,{...project,id:'p2'}]}],
  ['paused',{projects:[{...project,status:'paused'}]}],
  ['launch_record_pending',{projects:[{...project,status:'completed'}]}],
  ['in_delivery',{}],
  ['waiting_on_client',{requirements:[{id:'q',workspace_id:'w',project_id:'p',status:'needed',timing:'needed_now',responsible_party:'client',label:'Logo'}]}],
  ['waiting_on_cws',{requirements:[{id:'q',workspace_id:'w',project_id:'p',status:'needed',timing:'needed_now',responsible_party:'cws',label:'Build'}]}],
 ])('derives %s from its source rows',(stage,changes)=>{
   const row=build(changes).items[0];expect(row.stage).toBe(stage);expect(row.sources[0]).toMatchObject({table:'client_service_agreements',id:'a'});expect(row.why_now).toBeTruthy()
 })
 it('never infers setup payment from a launch date or reference',()=>{
  expect(build({receipts:[],agreements:[{...agreement,square_subscription_reference:'reference'}]}).items[0].stage).toBe('setup_payment_pending')
  expect(build({receipts:[{...receipt,received_at:'2026-10-22T12:00:00Z'}]}).items[0].stage).toBe('setup_payment_pending')
 })
 it('scopes every source and does not match names or other offers',()=>{
  expect(build({agreements:[{...agreement,workspace_id:'other'}]}).items).toEqual([])
  expect(build({agreements:[{...agreement,product_name:'Other service'}]}).items).toEqual([])
  expect(build({projects:[{...project,service_agreement_id:null,name:'Negocio Listo'}]}).items[0].stage).toBe('needs_data')
 })
 it('derives launched/term and payment states from recorded installments',()=>{
  const monthly=Array.from({length:12},(_,i)=>({id:`i${i}`,workspace_id:'w',agreement_id:'a',installment:i+1,financial_obligation_id:`b${i}`}))
  const obligations=monthly.map((i,index)=>({...bill,id:i.financial_obligation_id,amount_cents:14900,due_date:`2027-${String(index+1).padStart(2,'0')}-21`}))
  expect(build({agreements:[{...agreement,launch_date:'2026-10-21'}],installments:monthly,obligations}).items[0].stage).toBe('launched')
  const overdue=build({agreements:[{...agreement,launch_date:'2026-10-01'}],installments:monthly,obligations:obligations.map((b,i)=>i===0?{...b,due_date:'2026-10-20'}:b)}).items[0]
  expect(overdue).toMatchObject({stage:'payment_overdue',priority_tier:1,obligation_id:'b0'})
  expect(build({agreements:[{...agreement,launch_date:'2025-10-21'}],installments:monthly,obligations}).items[0].stage).toBe('term_completed')
  expect(build({agreements:[{...agreement,launch_date:'2026-10-21'}],installments:[],obligations:[]}).items[0].stage).toBe('needs_data')
 })
 it('tags intake prospect cards without duplicating the Sales queue',()=>{
  const lead={id:'l',workspace_id:'w',source:'negocio-listo|inline|en',status:'new',sales_classification:'inbound',name:'Synthetic',phone:'123',created_at:'2026-10-21T12:00:00Z'}
  const lifecycle=build({agreements:[],leads:[lead]})
  const result=buildCeoToday({leads:[lead],lifecycle,now:base.now})
  expect(lifecycle.items[0].stage).toBe('prospect')
  expect(result.all_actions.filter(row=>row.lead_id==='l')).toHaveLength(1)
  expect(result.all_actions.find(row=>row.lead_id==='l').lifecycle_stage).toBe('prospect')
 })
 it('replaces the duplicate delivery card while preserving priority tiers',()=>{
  const lifecycle=build({})
  const result=buildCeoToday({lifecycle,operationsProjects:[{project_id:'p',project_name:'Synthetic',delivery_state:'ready_to_work'}],now:base.now})
  expect(result.all_actions.filter(row=>row.project_id==='p')).toHaveLength(1)
  expect(result.all_actions.find(row=>row.project_id==='p').priority_tier).toBe(4)
 })
})

it('excludes explicit test inquiries from lifecycle and CEO, but not names alone',()=>{
 const lead={id:'test',workspace_id:'w',is_test:true,source:'negocio-listo|inline|en',status:'new',sales_classification:'inbound',name:'QA',created_at:'2026-10-21T12:00:00Z'}
 const lifecycle=build({agreements:[],leads:[lead]})
 expect(lifecycle.items).toEqual([])
 expect(buildCeoToday({leads:[lead],lifecycle,now:base.now}).actions.some(row=>row.lead_id==='test')).toBe(false)
 expect(build({agreements:[],leads:[{...lead,is_test:false,name:'TEST ONLY'}]}).items).toHaveLength(1)
})
