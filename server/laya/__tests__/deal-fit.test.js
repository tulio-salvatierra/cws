import { describe,it,expect } from 'vitest'
import { evaluateDealFit,buildDealFits } from '../deal-fit.js'
const now=new Date('2026-10-22T02:00:00Z')
const agreement={id:'a',workspace_id:'w',client_id:'c',product_name:'Negocio Listo Básico',setup_cents:30000,monthly_cents:14900,term_months:12}
const evaluate=(a=agreement,projects=[])=>evaluateDealFit({workspaceId:'w',agreement:a,projects,now})
describe('deterministic deal fit',()=>{
 it('uses source-backed gross ceilings, never a projected hourly pass',()=>{
  const result=evaluate()
  expect(result).toMatchObject({evaluator:'deal_fit',policy_version:'deal-fit-v2',verdict:'needs_data',business_date:'2026-10-21',money_at_stake:null,related_decisions:[]})
  expect(result.checks[0].status).toBe('meets')
  expect(result.checks[1]).toMatchObject({status:'needs_data',gross_term_cents:208800,gross_hour_ceiling:41.76,floor_cents:5000})
  expect(result.checks[2].status).toBe('needs_data')
  expect(result.why[1].source.fields).toEqual({setup_cents:30000,monthly_cents:14900,term_months:12})
 })
 it.each([[29999,'revise'],[30000,'meets'],[30001,'meets'],[0,'revise'],[null,'needs_data'],[false,'needs_data'],['','needs_data'],[' ','needs_data'],[-1,'needs_data'],[30000.5,'needs_data']])('checks setup %s exactly as %s without treating it as paid',(setup,status)=>{
  expect(evaluate({...agreement,setup_cents:setup}).checks[0].status).toBe(status)
  expect(evaluate({...agreement,setup_cents:setup}).verdict).toBe('needs_data')
 })
 it.each([{monthly_cents:null},{monthly_cents:0},{term_months:null},{term_months:true},{term_months:61},{monthly_cents:Number.MAX_SAFE_INTEGER}])('withholds invalid or overflowing gross ceilings %j',override=>{
  expect(evaluate({...agreement,...override}).checks[1].gross_hour_ceiling).toBeNull()
 })
 it('accepts safe DB bigint strings without rounding the gross bound',()=>{
  expect(evaluate({...agreement,setup_cents:'30000',monthly_cents:'14900'}).checks[1].gross_hour_ceiling).toBe(41.76)
 })
 it('does not derive capacity or future labor from actual hours/status or match names',()=>{
  const result=evaluate(agreement,[{id:'p',workspace_id:'w',client_id:'c',service_agreement_id:'a',status:'completed',actual_hours:3},{id:'wrong',workspace_id:'other',client_id:'c',service_agreement_id:'a',actual_hours:1},{id:'unlinked',workspace_id:'w',client_id:'c',name:'Negocio Listo',actual_hours:1}])
  expect(result.verdict).toBe('needs_data')
  expect(result.why.filter(r=>r.source.table==='operations_projects').map(r=>r.source.id)).toEqual(['p'])
  expect(result.checks[2].status).toBe('needs_data')
 })
 it('flags ambiguous project scope',()=>{
  const projects=['p','q'].map(id=>({id,workspace_id:'w',client_id:'c',service_agreement_id:'a'}))
  expect(evaluate(agreement,projects).missing_data.join(' ')).toMatch(/Multiple same-client/)
 })
 it('rejects cross-workspace subjects',()=>{
  expect(()=>evaluate({...agreement,workspace_id:'other'})).toThrow(/workspace-scoped/)
 })
 it('keeps inquiries unknown rather than interpreting intake tags as agreed terms',()=>{
  const result=evaluateDealFit({workspaceId:'w',lead:{id:'l',workspace_id:'w',source:'negocio-listo|plan=destacado',status:'new'},now})
  expect(result.checks.map(c=>c.status)).toEqual(['needs_data','needs_data','needs_data'])
  expect(result.why[0].source.table).toBe('leads')
 })
 it('filters inactive inquiries and other workspace/product sources, without writes or new priorities',()=>{
  const summary=buildDealFits({workspaceId:'w',agreements:[agreement,{...agreement,id:'b',workspace_id:'other'},{...agreement,id:'c',product_name:'Other'}],leads:[{id:'l',workspace_id:'w',source:'negocio-listo|x',status:'new'},{id:'x',workspace_id:'w',source:'negocio-listo|x',status:'lost'}],now})
  expect(summary.items.map(i=>i.id)).toEqual(['agreement:a','lead:l'])
  expect(buildDealFits({workspaceId:'w',available:false})).toEqual({available:false,items:[]})
 })
})
