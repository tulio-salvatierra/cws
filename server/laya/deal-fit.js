import { chicagoDate } from '../sales/queue.js'
import { isNegocioListo } from '../ceo/goal-pace.js'

const FLOOR_CENTS = 5000
const SETUP_CENTS = 30000
const cents = value => (typeof value === 'number' || (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value))) && Number.isSafeInteger(Number(value)) && Number(value) >= 0
const source = (table,row,fields) => ({table,id:row.id,workspace_id:row.workspace_id,fields:Object.fromEntries(fields.map(field=>[field,row[field] ?? null]))})

// AUTO only. A gross revenue/hour budget is an upper bound, not an estimate of
// profit or labor. Actual hours already spent do not establish future capacity.
export function evaluateDealFit({workspaceId,agreement=null,lead=null,projects=[],now=new Date()}) {
  const subject=agreement || lead
  if(!subject?.id || subject.workspace_id!==workspaceId || !workspaceId)throw new Error('A workspace-scoped deal source is required.')
  const why=[]
  const missing=[]
  const checks=[]
  const linked=agreement?projects.filter(p=>p.workspace_id===workspaceId && p.client_id===agreement.client_id && p.service_agreement_id===agreement.id):[]
  if(agreement) {
    const validSetup=cents(agreement.setup_cents)
    const setup=validSetup?Number(agreement.setup_cents):null
    checks.push({key:'setup_fee',status:setup===null?'needs_data':setup>=SETUP_CENTS?'meets':'revise',label:'Setup fee',detail:setup===null?'Record a valid setup fee.':`Recorded setup fee: ${setup} cents; approved baseline: ${SETUP_CENTS} cents. This is an agreed fee, not payment evidence.`})
    if(!validSetup)missing.push('A valid recorded setup fee is missing.')
    why.push({claim:'Setup comparison uses the agreement snapshot; it does not establish that the fee was paid.',source:source('client_service_agreements',agreement,['product_name','setup_cents'])})
  } else {
    checks.push({key:'setup_fee',status:'needs_data',label:'Setup fee',detail:'An inquiry tag does not record an agreed setup fee.'})
    missing.push('An explicitly linked agreement with recorded prices and term is missing; no lead-to-client conversion is inferred.')
    why.push({claim:'This is a Negocio Listo inquiry, not an agreed deal.',source:source('leads',lead,['source','status'])})
  }
  let gross=null
  if(agreement && cents(agreement.setup_cents) && cents(agreement.monthly_cents) && Number(agreement.monthly_cents)>0 && cents(agreement.term_months) && Number(agreement.term_months)>0 && Number(agreement.term_months)<=60) {
    const total=Number(agreement.setup_cents)+Number(agreement.monthly_cents)*Number(agreement.term_months)
    if(Number.isSafeInteger(total))gross=total
  }
  if(gross===null)missing.push('Complete recorded setup/monthly prices and term are required for the gross labor ceiling.')
  checks.push({key:'hourly_floor',status:'needs_data',label:'$50/hour floor',detail:'A full-term labor budget and complete direct-cost budget are not recorded. An actual-hours subtotal or future subscription revenue cannot establish a sustainable hourly rate.',gross_term_cents:gross,gross_hour_ceiling:gross===null?null:gross/FLOOR_CENTS,floor_cents:FLOOR_CENTS})
  missing.push('Owner-recorded full-term setup and recurring labor budget, with complete direct costs, is missing; no $50/hour pass or failure is inferred.')
  if(gross!==null)why.push({claim:`Recorded gross term value is ${gross} cents; before any costs, it permits at most ${gross/FLOOR_CENTS} total labor hours at $50/hour. This is a gross upper bound, not profit, collected cash or a labor forecast.`,source:source('client_service_agreements',agreement,['setup_cents','monthly_cents','term_months'])})
  checks.push({key:'capacity',status:'needs_data',label:'Capacity',detail:'Available owner hours, a dated delivery window and a complete committed-work estimate are not recorded. Project counts and hours already spent are not free capacity.'})
  missing.push('Owner availability for a dated delivery window and a complete committed/remaining workload budget are missing.')
  if(agreement && linked.length!==1)missing.push(linked.length?'Multiple same-client projects link to this agreement; resolve delivery scope.':'Explicit same-client project/agreement linkage is missing.')
  for(const project of linked)why.push({claim:'This project is explicitly linked; its recorded status and hours spent do not measure remaining work or available capacity.',source:source('operations_projects',project,['client_id','service_agreement_id','status','actual_hours'])})
  return {
    evaluator:'deal_fit',policy_version:'deal-fit-v1',subject:{type:agreement?'client_service_agreement':'lead',id:subject.id,workspace_id:workspaceId},
    verdict:'needs_data',checks,next_action:checks.some(check=>check.status==='revise')?'Review the setup fee below the approved baseline, then record labor/cost and capacity evidence before deciding deal fit.':'Review recorded terms and record labor/cost and dated capacity evidence before deciding deal fit.',
    why,missing_data:missing,assumptions:[],money_at_stake:null,related_decisions:[],
    policy_sources:[{document:'docs/product-definition.md',section:'1a',rule:'$300 setup baseline'},{document:'docs/product-definition.md',section:'3a',rule:'$50/hour floor and capacity checks'}],
    evaluated_at:now.toISOString(),business_date:chicagoDate(now),time_zone:'America/Chicago',
  }
}

export function buildDealFits({workspaceId,agreements=[],leads=[],projects=[],available=true,now=new Date()}) {
  if(!available)return {available:false,items:[]}
  const items=[
    ...agreements.filter(a=>a.workspace_id===workspaceId && isNegocioListo(a)).map(agreement=>({id:`agreement:${agreement.id}`,title:agreement.product_name,href:`/admin/accounting?client=${encodeURIComponent(agreement.client_id)}#client-agreements`,evaluation:evaluateDealFit({workspaceId,agreement,projects,now})})),
    ...leads.filter(l=>l.workspace_id===workspaceId && String(l.source || '').split('|')[0]==='negocio-listo' && !['won','lost','unresponsive'].includes(l.status)).map(lead=>({id:`lead:${lead.id}`,title:lead.company || lead.name || 'Negocio Listo inquiry',href:'/admin/sales',evaluation:evaluateDealFit({workspaceId,lead,now})})),
  ].sort((a,b)=>a.id.localeCompare(b.id))
  return {available:true,items}
}
