import { latestBudgets,dealSnapshot,canonical } from './deal-budget.js'
import { chicagoDate } from '../sales/queue.js'
import { isNegocioListo } from '../ceo/goal-pace.js'

const FLOOR_CENTS = 5000
const SETUP_CENTS = 30000
const cents = value => (typeof value === 'number' || (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value))) && Number.isSafeInteger(Number(value)) && Number(value) >= 0
const source = (table,row,fields) => ({table,id:row.id,workspace_id:row.workspace_id,fields:Object.fromEntries(fields.map(field=>[field,row[field] ?? null]))})

// AUTO only. A gross revenue/hour budget is an upper bound, not an estimate of
// profit or labor. Actual hours already spent do not establish future capacity.
export function evaluateDealFit({workspaceId,agreement=null,lead=null,projects=[],costs=[],budget=null,snapshot=null,now=new Date()}) {
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
  const integer=value=>typeof value==='number' && Number.isInteger(value) && value>=0 && value<=99999
  const date=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value
  const totalHours=budget && agreement?budget.setup_hours+budget.monthly_hours*Number(agreement.term_months):null
  const valid=Boolean(budget && agreement && budget.workspace_id===workspaceId && budget.agreement_id===agreement.id && budget.client_id===agreement.client_id
    && budget.labor_cost_complete===true && budget.capacity_complete===true && budget.verified_on===chicagoDate(now)
    && snapshot && budget.snapshot && date(budget.window_start) && date(budget.window_end) && budget.available_hours<=(Date.parse(budget.window_end)-Date.parse(budget.window_start)+86400000)/3600000
    && budget.window_start>=chicagoDate(now) && budget.window_end>=budget.window_start && canonical(budget.snapshot)===canonical(snapshot)
    && ['setup_hours','monthly_hours','available_hours','committed_hours','deal_window_hours'].every(k=>integer(budget[k]))
    && cents(budget.setup_cost_cents) && cents(budget.monthly_cost_cents) && totalHours>0 && budget.deal_window_hours>0 && budget.deal_window_hours<=totalHours
    && costs.filter(c=>c.workspace_id===workspaceId && linked.some(p=>p.id===c.operations_project_id)).reduce((sum,c)=>sum+Number(c.amount_cents),0)<=Number(budget.setup_cost_cents)+Number(budget.monthly_cost_cents)*Number(agreement.term_months)
    && linked.length===1 && (linked[0].actual_hours==null || Number(linked[0].actual_hours)<=totalHours))
  const net=valid && gross!==null?gross-Number(budget.setup_cost_cents)-Number(budget.monthly_cost_cents)*Number(agreement.term_months):null
  const floorStatus=net===null?'needs_data':net>=totalHours*FLOOR_CENTS?'meets':'revise'
  checks.push({key:'hourly_floor',status:floorStatus,label:'$50/hour floor',detail:net===null?'A complete current owner budget matching the reviewed records is required. Actual hours or future revenue alone cannot establish affordability.':`Budgeted term contribution after direct costs: ${net} cents over ${totalHours} whole labor hours. ${floorStatus==='meets'?'Meets':'Below'} the $50/hour floor; this is an estimate, not realized profit.`,gross_term_cents:gross,gross_hour_ceiling:gross===null?null:gross/FLOOR_CENTS,floor_cents:FLOOR_CENTS,net_term_cents:net,total_budget_hours:valid?totalHours:null})
  if(!valid)missing.push('Complete current owner labor/cost and dated capacity evidence is missing, stale, inconsistent or invalidated by changed records.')
  if(gross!==null)why.push({claim:`Recorded gross term value is ${gross} cents; before costs it permits at most ${gross/FLOOR_CENTS} labor hours at $50/hour. This is not collected cash or a labor forecast.`,source:source('client_service_agreements',agreement,['setup_cents','monthly_cents','term_months'])})
  const capacityStatus=!valid?'needs_data':budget.deal_window_hours<=budget.available_hours-budget.committed_hours?'meets':'hold'
  checks.push({key:'capacity',status:capacityStatus,label:'Capacity',detail:!valid?'Complete current owner evidence for a dated window, available hours, other committed work and this deal’s demand is required.':`Window ${budget.window_start} through ${budget.window_end}: ${budget.available_hours} available hours minus ${budget.committed_hours} other committed hours; this deal needs ${budget.deal_window_hours} hours. ${capacityStatus==='meets'?'Fits':'Exceeds'} this reviewed window only; no future capacity is reserved.`})
  if(budget)why.push({claim:valid?'Owner confirmed complete term labor/direct costs and capacity for the exact reviewed records and window.':'Recorded budget is not sufficient for a current verified decision; reload and review its date, completeness and source snapshot.',source:{...source('negocio_listo_deal_budgets',{...budget,id:String(budget.revision)},['setup_hours','monthly_hours','setup_cost_cents','monthly_cost_cents','window_start','window_end','available_hours','committed_hours','deal_window_hours','verified_on','labor_cost_complete','capacity_complete','source_note','created_by','created_at']),snapshot:budget.snapshot}})
  if(agreement && linked.length!==1)missing.push(linked.length?'Multiple same-client projects link to this agreement; resolve delivery scope.':'Explicit same-client project/agreement linkage is missing.')
  for(const project of linked)why.push({claim:'This project is explicitly linked; its recorded status and hours spent do not measure remaining work or available capacity.',source:source('operations_projects',project,['client_id','service_agreement_id','status','actual_hours'])})
  return {
    evaluator:'deal_fit',policy_version:'deal-fit-v2',subject:{type:agreement?'client_service_agreement':'lead',id:subject.id,workspace_id:workspaceId},
    verdict:missing.length?'needs_data':checks.some(c=>c.status==='revise')?'revise':checks.some(c=>c.status==='hold')?'hold':'do',checks,
    next_action:missing.length?'Complete or refresh owner budgets, project links and capacity evidence before deciding deal fit.':checks.some(c=>c.status==='revise')?'Review price, setup fee or labor/direct-cost budget; the recorded terms do not meet the baseline.':capacityStatus==='hold'?'Hold additional commitment until the reviewed capacity window can accommodate this deal.':'Recorded terms and owner budgets meet the checks for this window. Owner review is still required; no deal is accepted or decision activated.',

    why,missing_data:missing,assumptions:[],money_at_stake:null,related_decisions:[],
    policy_sources:[{document:'docs/product-definition.md',section:'1a',rule:'$300 setup baseline'},{document:'docs/product-definition.md',section:'3a',rule:'$50/hour floor and capacity checks'}],
    evaluated_at:now.toISOString(),business_date:chicagoDate(now),time_zone:'America/Chicago',
  }
}

export function buildDealFits({workspaceId,agreements=[],leads=[],projects=[],budgets=[],costs=[],available=true,now=new Date()}) {
  if(!available)return {available:false,items:[]}
  const latest=latestBudgets(budgets,workspaceId)
  const items=agreements.filter(a=>a.workspace_id===workspaceId && isNegocioListo(a)).map(agreement=>{
    const budget=latest.find(b=>b.agreement_id===agreement.id) || null
    const snapshot=dealSnapshot({workspaceId,agreementId:agreement.id,agreements,projects,budgets,costs})
    const inputs={workspaceId,agreement,lead:null,projects,costs,budget,snapshot,now}
    return {id:`agreement:${agreement.id}`,title:agreement.product_name,href:`/admin/accounting?client=${encodeURIComponent(agreement.client_id)}#client-agreements`,agreement,budget,budget_snapshot:snapshot,evaluation:evaluateDealFit(inputs),response_input:inputs}
  })
  for(const lead of leads.filter(l=>l.workspace_id===workspaceId && l.is_test !== true && String(l.source || '').split('|')[0]==='negocio-listo' && !['won','lost','unresponsive'].includes(l.status))) {
    const inputs={workspaceId,agreement:null,lead,projects:[],costs:[],budget:null,snapshot:null,now}
    items.push({id:`lead:${lead.id}`,title:lead.company || lead.name || 'Negocio Listo inquiry',href:'/admin/sales',evaluation:evaluateDealFit(inputs),response_input:inputs})
  }
  items.sort((a,b)=>a.id.localeCompare(b.id))
  return {available:true,items,workspace_id:workspaceId,today:chicagoDate(now)}
}
