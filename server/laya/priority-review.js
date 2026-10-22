import { chicagoDate, buildSalesCommandQueue } from '../sales/queue.js'
import { projectReadModel } from '../operations/readiness.js'
import { buildAccountingReadModel } from '../accounting/read-model.js'
import { requirementReadModel } from '../compliance/read-model.js'
import { buildMarketingOccurrencePlan } from '../../src/marketing/weeklySlots.js'

const types = { clients:'clients', leads:'leads', promises:'sales_promised_actions', sends:'outreach_sends', projects:'operations_projects', requirements:'project_requirements', obligations:'financial_obligations', receipts:'payment_receipts', recurring:'recurring_revenue', compliance:'compliance_requirements', completions:'compliance_completions', attempts:'marketing_publish_attempts', resolutions:'marketing_slot_resolutions' }
const date = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value
const cents = value => Number.isSafeInteger(value) && value>0

// Run only after the existing ordering/limit. These exact scoped inputs are
// signed as-is; neither current facts nor projection strings replace them later.
export function priorityInputs(context, action) {
  const {workspaceId}=context
  const own=key=>(context[key] || []).filter(row=>row.workspace_id===workspaceId)
  let principal=null, keys=[]
  const rows={}
  const take=(key,filter=()=>true)=>{rows[key]=own(key).filter(filter);return rows[key]}
  if(action.source_type==='sales_command') {
    principal=take('leads',r=>r.id===action.lead_id)[0] || null
    take('promises',r=>r.lead_id===principal?.id);take('sends',r=>r.lead_id===principal?.id);keys=['leads','promises','sends']
  } else if(action.source_type==='operations_delivery') {
    principal=take('projects',r=>r.id===action.project_id)[0] || null
    take('requirements',r=>r.project_id===principal?.id);keys=['projects','requirements']
  } else if(action.source_type==='accounting_financial') {
    const id=action.id.split(':').slice(2).join(':')
    const key=action.id.startsWith('accounting:financial_obligation:')?'obligations':'recurring'
    principal=take(key,r=>r.id===id)[0] || null
    take('receipts',r=>key==='obligations' && r.financial_obligation_id===principal?.id);take('clients',r=>r.id===principal?.client_id);keys=['obligations','recurring','receipts','clients']
  } else if(action.source_type==='compliance_requirement') {
    principal=take('compliance',r=>`compliance:${r.id}`===action.id)[0] || null
    take('completions',r=>r.compliance_requirement_id===principal?.id);keys=['compliance','completions']
  } else if(String(action.source_type || '').startsWith('marketing_')) {
    take('attempts');take('resolutions');keys=['attempts','resolutions','destinations']
    rows.destinations=(context.destinations || []).filter(r=>rows.attempts.some(a=>a.id===r.attempt_id))
  } else keys=Object.keys(context.availability || {})
  const sources=Object.entries(rows).flatMap(([key,list])=>list.map(row=>({table:types[key] || 'marketing_publish_destination_results',row})))
  const principalSource=sources.find(s=>s.row===principal) || null
  return {workspaceId,action:{...action},principal:principalSource,sources,availability:Object.fromEntries(keys.map(key=>[key,context.availability?.[key]===true])),now:new Date(context.now).toISOString()}
}

export function evaluatePriority(input) {
  const {workspaceId,action,principal,sources=[],availability={},now}=input
  const today=chicagoDate(new Date(now)), missing=[]
  const rows=key=>sources.filter(s=>s.table===types[key]).map(s=>s.row)
  const row=principal?.row
  let verdict='needs_data', next='Review the source records before following this priority.', money=null
  if(!Object.keys(availability).length || Object.values(availability).some(value=>value!==true))missing.push('Required source reads are unavailable or reached their completeness limit.')
  if(sources.some(s=>s.table==='marketing_publish_destination_results' ? !rows('attempts').some(a=>a.id===s.row.attempt_id) : s.row.workspace_id!==workspaceId))missing.push('Source workspace/linkage is inconsistent.')
  if(action.source_type==='sales_command') {
    if(!row || row.workspace_id!==workspaceId || row.id!==action.lead_id)missing.push('The same-workspace lead is missing.')
    else {
      if(rows('sends').some(s=>['sent','delivered'].includes(s.status) && (!Number.isFinite(Date.parse(s.sent_at || s.created_at)) || Date.parse(s.sent_at || s.created_at)>Date.parse(now))) || rows('promises').some(p=>!date(p.due_on)))missing.push('Sales contact or promise dates are missing, invalid or future-dated.')
      const command=buildSalesCommandQueue({leads:[row],promisedActions:rows('promises'),outreachSends:rows('sends').filter(s=>Number.isFinite(Date.parse(s.sent_at || s.created_at))),now:new Date(now)}).items.find(item=>`sales:${item.id}`===action.id)
      if(row.is_test || ['won','lost','unresponsive'].includes(row.status)) {verdict='skip';next='This lead is excluded or closed; review its recorded state without contacting it.'}
      else if(!row.sales_classification || (!row.email && !row.phone))missing.push('Recorded classification or contact path is missing.')
      else if(!command){verdict='hold';next='The recorded Sales sequence no longer supports this action at the evaluation clock.'}
      else {verdict='do';next=command.category==='promised'?'Review and fulfil the recorded promise through its owner-controlled flow.':`Review ${command.recommendation.toLowerCase()} in Sales. A call or email still requires the owner’s separate action.`}
    }
  } else if(action.source_type==='operations_delivery') {
    if(!row || row.id!==action.project_id || row.workspace_id!==workspaceId)missing.push('The linked delivery project is missing.')
    else if(['completed','paused'].includes(row.status)){verdict='skip';next='Project is completed or paused; review its owner-recorded state.'}
    else if(!['setup','in_progress','waiting_on_client','waiting_on_cws'].includes(row.status) || !rows('requirements').length || rows('requirements').some(r=>!r.label || !['needed','received','not_applicable'].includes(r.status) || !['needed_now','needed_later','opportunity'].includes(r.timing) || !['client','cws'].includes(r.responsible_party)))missing.push('Project status or the recorded readiness checklist is missing.')
    else {
      const model=projectReadModel(row,rows('requirements'))
      verdict=model.delivery_state==='waiting_on_client'?'hold':'do'
      next=verdict==='hold'?'Review the recorded client blocker; no reminder is sent automatically.':'Review the recorded CWS blockers or continue work with the available inputs.'
    }
  } else if(action.source_type==='accounting_financial') {
    if(!row || row.workspace_id!==workspaceId || action.id!==`accounting:${principal.table==='financial_obligations'?'financial_obligation':'recurring_revenue'}:${row.id}`)missing.push('The Accounting source is missing or inconsistent.')
    else {
      const receipts=rows('receipts')
      if(row.currency!=='USD' || !cents(row.amount_cents) || !Number.isSafeInteger(receipts.reduce((sum,r)=>sum+r.amount_cents,0)) || receipts.some(r=>!cents(r.amount_cents) || !Number.isFinite(Date.parse(r.received_at)) || Date.parse(r.received_at)>Date.parse(now)))missing.push('Amount/currency or current payment evidence is invalid or future-dated; no safe balance can be inferred.')
      if(principal.table==='financial_obligations' && !date(row.due_date))missing.push('A valid obligation due date is required.')
      if(principal.table==='recurring_revenue' && (!date(row.next_expected_at) || !['active','paused','ended'].includes(row.status)))missing.push('Recurring status or expected date is invalid.')
      const model=buildAccountingReadModel({workspaceId,obligations:rows('obligations'),receipts,recurringRevenue:rows('recurring'),now:new Date(now)})
      const projected=model.ceo_projection.find(p=>`accounting:${p.id}`===action.id)
      verdict=projected?'do':'hold';next=projected?'Review the recorded Accounting balance or recurring-status evidence. No charge, collection or subscription change is performed.':'The recorded balance/status does not currently support this Accounting action.'
      if(projected && principal.table==='financial_obligations')money={amount_cents:model.obligations[0].outstanding_amount_cents,currency:'USD'}
    }
  } else if(action.source_type==='compliance_requirement') {
    if(!row || row.workspace_id!==workspaceId || action.id!==`compliance:${row.id}`)missing.push('The Compliance source is missing.')
    else {
      const model=requirementReadModel({requirement:row,completions:rows('completions'),today})
      if(row.applicability_status==='needs_verification')missing.push('Owner applicability verification is missing; a possible requirement is not an established obligation.')
      else if(row.status!=='active' || row.applicability_status==='not_applicable'){verdict='skip';next='This requirement is retired or not applicable in recorded owner evidence.'}
      else if(row.applicability_status!=='applies' || !row.verified_by_owner_at || !row.verified_by_owner_id || !row.authority_name || !/^https?:\/\//.test(row.source_url || '') || !date(row.next_due_date))missing.push('Verified applicability, authority source or due-date evidence is incomplete.')
      else {verdict=['due','overdue'].includes(model.compliance_state)?'do':'hold';next=verdict==='do'?'Review the owner-verified due obligation and authority source; this advice neither files nor certifies compliance.':'Review the recorded approaching deadline; no filing or completion is inferred.'}
    }
  } else if(String(action.source_type || '').startsWith('marketing_')) {
    const attempts=rows('attempts').map(a=>({...a,destination_results:sources.filter(s=>s.table==='marketing_publish_destination_results' && s.row.attempt_id===a.id).map(s=>s.row)}))
    const plan=buildMarketingOccurrencePlan({attempts,resolutions:rows('resolutions'),now:new Date(now)})
    const key=action.id.split(':').slice(2).join(':'), slot=[...(plan.currentWeekSlots || []),...plan.missedSlots].find(s=>s.slotKey===key)
    if(!slot)missing.push('The frozen Chicago slot policy and current source register do not establish this occurrence.')
    else if(action.source_type==='marketing_ready')missing.push('CEO calendar readiness is not a verified exact asset, caption and destination publish preview; review those in Marketing.')
    else if(slot.state==='resolved' || slot.resolution){verdict='skip';next='The recorded owner resolution already closes this occurrence; do not retry or republish.'}
    else if(action.source_type==='marketing_missed' && plan.missedSlots.some(s=>s.slotKey===key)){verdict='do';next='Review the missed occurrence and choose an owner resolution in Marketing; this never publishes.'}
    else if(action.source_type==='marketing_delivery_failure' && slot.attempt && (slot.attempt.provider_status==='error' || slot.destinationResults?.some(r=>r.provider_status==='error'))){verdict='do';next='Review the durable failed destination outcomes; do not retry successful destinations or publish automatically.'}
    else {verdict='hold';next='The current recorded Marketing occurrence does not support this action.'}
  } else if(action.source_type==='fallback')missing.push('This is the frozen fallback prompt, not a recorded prospect or proof of no business work. Review Sales and missing evidence first.')
  else missing.push('This priority source type is unsupported.')
  const why=sources.map(({table,row})=>({claim:`Recorded ${table} evidence used for this priority review.`,source:{table,id:row.id || row.occurrence_slot_key,workspace_id:row.workspace_id || workspaceId,version:row.updated_at || row.created_at || null,fields:{...row}}}))
  return {evaluator:'priority_review',policy_version:'priority-review-v1',subject:{type:'ceo_priority',id:action.id,workspace_id:workspaceId},verdict:missing.length?'needs_data':verdict,next_action:missing.length?'Review and complete the missing source evidence before following this priority.':next,why,assumptions:['Act/Dismiss records intent only; it does not perform a call, message, publish, payment, filing, delivery change or activation.','The existing priority projection and order remain unchanged.'],missing_data:missing,money_at_stake:missing.length?null:money,related_decisions:[],policy_sources:[{document:'docs/product-definition.md',section:'2'},{document:'server/ceo/today.js',rule:'frozen priority projection'},...(String(action.source_type || '').startsWith('marketing_')?[{document:'src/marketing/weeklySlots.js',rule:'WEEKLY_MARKETING_SLOTS and Chicago missed-occurrence policy'}]:[])],evaluated_at:new Date(now).toISOString(),business_date:today,time_zone:'America/Chicago'}
}

export function decoratePriorities(data, context, lifecycleInputs={}) {
  const inputs={}
  const cards=new Map([...data.all_actions,...data.actions].map(action=>[action.id,action]))
  for(const action of cards.values()) {
    const lifecycle=data.negocio_listo?.items.find(row=>row.id===action.id || (action.lead_id && row.lead_id===action.lead_id))
    if(lifecycle?.evaluation && lifecycleInputs[lifecycle.id]) {action.evaluation=lifecycle.evaluation;inputs[action.id]=lifecycleInputs[lifecycle.id]}
    else {const snapshot=priorityInputs(context,action);action.evaluation=evaluatePriority(snapshot);inputs[action.id]=snapshot}
  }
  return inputs
}
