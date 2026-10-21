import {describe,it,expect} from 'vitest'
import {buildDealFits} from '../deal-fit.js'
import {dealSnapshot,canonical} from '../deal-budget.js'
const now=new Date('2026-10-21T12:00:00Z')
const a={id:'a',workspace_id:'w',client_id:'c',product_name:'Negocio Listo Básico',setup_cents:30000,monthly_cents:10000,term_months:12}
const p={id:'p',workspace_id:'w',client_id:'c',service_agreement_id:'a',status:'setup',actual_hours:null}
const base={revision:1,workspace_id:'w',agreement_id:'a',client_id:'c',setup_hours:6,monthly_hours:2,setup_cost_cents:0,monthly_cost_cents:0,window_start:'2026-10-21',window_end:'2026-10-28',available_hours:20,committed_hours:14,deal_window_hours:6,labor_cost_complete:true,capacity_complete:true,verified_on:'2026-10-21',source_note:'All plans and commitments checked'}
function input(override={}){
 const data={workspaceId:'w',agreements:[a],projects:[p],budgets:[{...base,...override}],now}
 data.budgets[0].snapshot=dealSnapshot({...data,agreementId:'a'})
 return data
}
const result=data=>buildDealFits(data).items[0].evaluation
describe('verified deal budgets',()=>{
 it('passes exact $50/hour and exact available capacity boundaries',()=>{
  const r=result(input());expect(r.verdict).toBe('do')
  expect(r.checks.map(c=>c.status)).toEqual(['meets','meets','meets'])
  expect(r.checks[1]).toMatchObject({net_term_cents:150000,total_budget_hours:30})
  expect(r.why.some(w=>w.source.table==='negocio_listo_deal_budgets')).toBe(true)
 })
 it('uses full direct costs and full recurring labor; a one-cent shortfall revises',()=>{
  expect(result(input({setup_cost_cents:1})).verdict).toBe('revise')
  expect(result(input({monthly_cost_cents:1})).checks[1].status).toBe('revise')
  expect(result(input({monthly_hours:3})).verdict).toBe('revise')
 })
 it('holds insufficient or overcommitted capacity rather than accepting a deal',()=>{
  expect(result(input({committed_hours:15})).verdict).toBe('hold')
  expect(result(input({committed_hours:30})).verdict).toBe('hold')
 })
 it.each([{labor_cost_complete:false},{capacity_complete:false},{verified_on:'2026-10-20'},{window_start:'2026-10-20'},{available_hours:99999},{monthly_hours:0.5},{deal_window_hours:31}])('rejects incomplete, stale and impossible data %j',override=>{
  expect(result(input(override)).verdict).toBe('needs_data')
 })
 it.each(['prices','new agreement','hours','status','other plan','tomorrow'])('invalidates changed %s',change=>{
  const data=input()
  if(change==='prices')data.agreements=[{...a,monthly_cents:11000}]
  if(change==='new agreement')data.agreements=[a,{...a,id:'b'}]
  if(change==='hours')data.projects=[{...p,actual_hours:31}]
  if(change==='status')data.projects=[{...p,status:'in_progress'}]
  if(change==='other plan')data.budgets.push({...base,revision:2,agreement_id:'b'}) ,data.agreements.push({...a,id:'b'})
  if(change==='tomorrow')data.now=new Date('2026-10-22T12:00:00Z')
  expect(result(data).verdict).toBe('needs_data')
 })
 it('requires costs already recorded to be covered even when the snapshot is current',()=>{
  const data=input({setup_cost_cents:1});data.costs=[{id:'cost',workspace_id:'w',operations_project_id:'p',amount_cents:2}]
  data.budgets[0].snapshot=dealSnapshot({...data,agreementId:'a'})
  expect(result(data).verdict).toBe('needs_data')
 })
 it('does not circularly invalidate identical other-plan reviews',()=>{
  const data=input();data.agreements.push({...a,id:'b'});data.budgets.push({...base,agreement_id:'b',revision:2})
  const before=dealSnapshot({...data,agreementId:'a'})
  data.budgets.push({...base,agreement_id:'b',revision:3,verified_on:'2026-10-22'})
  expect(canonical(dealSnapshot({...data,agreementId:'a'}))).toBe(canonical(before))
 })
})
