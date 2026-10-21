import { chicagoDate } from '../sales/queue.js'
import { billingDate } from '../../src/lib/businessExpenses.js'

const isNl = name => /^negocio listo(?:\s|$|[—-])/i.test(String(name || '').trim())
const scoped = (rows, workspaceId) => rows.filter(row => row.workspace_id === workspaceId)
const source = (table,row,fields) => ({table,id:row.id,fields:Object.fromEntries(fields.map(field=>[field,row[field] ?? null]))})

// Reads only durable evidence. An agreement record is not proof of a signature,
// a launch is not proof of payment, and a provider reference is not live status.
export function buildNegocioListoLifecycle({workspaceId,leads=[],agreements=[],installments=[],obligations=[],receipts=[],projects=[],requirements=[],clients=[],now=new Date()}) {
  const today=chicagoDate(now)
  const ownProjects=scoped(projects,workspaceId), ownClients=scoped(clients,workspaceId)
  const ownObligations=scoped(obligations,workspaceId), ownReceipts=scoped(receipts,workspaceId)
  const items=scoped(leads,workspaceId).filter(lead=>String(lead.source || '').split('|')[0]==='negocio-listo' && !['won','lost','unresponsive'].includes(lead.status)).map(lead=>({
    id:`lifecycle:lead:${lead.id}`,lead_id:lead.id,stage:'prospect',title:lead.company || lead.name || 'Negocio Listo prospect',
    human_action:`Review Negocio Listo inquiry: ${lead.company || lead.name || 'prospect'}`,why_now:'A Negocio Listo intake inquiry is in Sales; no conversion or signature is inferred.',
    department:'SALES',business_priority:'GET MONEY',priority_tier:2,href:'/admin/sales',cta_label:'Review in Sales',
    sources:[source('leads',lead,['source','status'])],source_timestamp:lead.created_at,
  }))
  for (const agreement of scoped(agreements,workspaceId).filter(a=>isNl(a.product_name))) {
    const linked=ownProjects.filter(p=>p.service_agreement_id===agreement.id && p.client_id===agreement.client_id)
    const client=ownClients.find(c=>c.id===agreement.client_id)
    const item={id:`lifecycle:agreement:${agreement.id}`,agreement_id:agreement.id,title:client?.name || agreement.product_name,
      stage:'needs_data',human_action:`Review Negocio Listo: ${client?.name || agreement.product_name}`,
      department:'OPERATIONS',business_priority:'DELIVER',priority_tier:4,href:'/admin/operations',cta_label:'Review project link',
      source_timestamp:agreement.created_at,sources:[source('client_service_agreements',agreement,['client_id','product_name','setup_cents','term_months','launch_date'])]}
    if(client) item.sources.push(source('clients',client,['name']))
    const bills=scoped(installments,workspaceId).filter(i=>i.agreement_id===agreement.id).map(i=>{
      const bill=ownObligations.find(o=>o.id===i.financial_obligation_id && o.client_id===agreement.client_id)
      const payments=ownReceipts.filter(r=>r.financial_obligation_id===bill?.id && Number.isFinite(Date.parse(r.received_at)) && Date.parse(r.received_at)<=new Date(now).getTime())
      const received=payments.reduce((sum,r)=>sum+Number(r.amount_cents),0)
      return {installment:i,bill,payments,remaining:bill?.status==='expected'?Math.max(0,Number(bill.amount_cents)-received):null}
    })
    item.sources.push(...bills.map(entry=>source('agreement_installments',entry.installment,['agreement_id','installment','financial_obligation_id'])))
    const setupEvidence=bills.find(entry=>entry.installment.installment===0)
    if(setupEvidence?.bill) {
      item.sources.push(source('financial_obligations',setupEvidence.bill,['amount_cents','status','due_date']))
      item.sources.push(...setupEvidence.payments.map(row=>source('payment_receipts',row,['amount_cents','received_at','financial_obligation_id'])))
    }
    const money=(entry,stage,reason)=>{
      item.stage=stage;item.department='ACCOUNTING';item.business_priority='GET MONEY';item.priority_tier=stage==='payment_overdue'?1:2
      item.why_now=reason;item.href=`/admin/accounting?client=${encodeURIComponent(agreement.client_id)}#client-agreements`;item.cta_label='Review payment record'
      item.obligation_id=entry?.bill?.id;item.actionable_on=entry?.bill?.due_date || ''
      if(entry?.bill){item.sources.push(source('financial_obligations',entry.bill,['amount_cents','status','due_date']));item.sources.push(...entry.payments.map(r=>source('payment_receipts',r,['amount_cents','received_at','financial_obligation_id'])))}
    }
    if (agreement.launch_date && agreement.launch_date>today) item.why_now='The recorded launch date is in the future; verify it before treating this agreement as launched.'
    else if (agreement.launch_date) {
      const due=bills.filter(b=>b.bill?.due_date && b.bill.due_date<=today && b.remaining>0).sort((a,b)=>a.bill.due_date.localeCompare(b.bill.due_date))[0]
      if(due) money(due,due.bill.due_date<today?'payment_overdue':'payment_due',`A linked installment has ${due.remaining} cents outstanding, due ${due.bill.due_date}. Review recorded payments; nothing is charged automatically.`)
      else {
        const ended=billingDate(agreement.launch_date,'monthly',agreement.term_months)<=today
        item.stage=ended?'term_completed':'launched';item.department='ACCOUNTING';item.business_priority='CONTROL MONEY';item.priority_tier=5
        item.why_now=ended?'The recorded launch date and term reach their end date. Review renewal/closure; no subscription is changed.':'Website launch is recorded. Provider references do not establish payment or live subscription status.'
        item.href=`/admin/accounting?client=${encodeURIComponent(agreement.client_id)}#client-agreements`;item.cta_label='Review agreement'
        if(bills.some(b=>!b.bill || b.remaining===null) || bills.filter(b=>b.installment.installment>0).length!==agreement.term_months){item.stage='needs_data';item.why_now='A linked installment is missing or void; reconcile agreement billing records.'}
      }
    } else {
      const setup=bills.find(b=>b.installment.installment===0)
      if(Number(agreement.setup_cents)>0 && (!setup?.bill || Number(setup.bill.amount_cents)!==Number(agreement.setup_cents) || setup.remaining===null)) {
        money(setup,'needs_data','Link a valid setup obligation matching the recorded agreement amount. An agreement record alone does not prove a signature or payment.')
      } else if(Number(agreement.setup_cents)>0 && setup.remaining>0) money(setup,setup.bill.due_date && setup.bill.due_date<today?'payment_overdue':'setup_payment_pending',`The recorded setup has ${setup.remaining} cents outstanding. Review payment evidence before delivery.`)
      else if(linked.length!==1) item.why_now=linked.length?'Multiple projects link to this agreement; review which project owns delivery.':'Link this agreement explicitly to its Operations project; customer names are not matched automatically.'
      else {
        const project=linked[0];item.project_id=project.id;item.href=`/admin/operations/${project.id}`;item.cta_label='Review delivery'
        item.sources.push(source('operations_projects',project,['status','service_agreement_id','actual_hours']))
        const blockers=scoped(requirements,workspaceId).filter(r=>r.project_id===project.id && r.status==='needed' && r.timing==='needed_now')
        const waiting=blockers.find(r=>r.responsible_party==='client') || blockers[0]
        if(project.status==='paused'){item.stage='paused';item.why_now='The linked project is paused; the owner must decide whether to resume it.'}
        else if(project.status==='completed'){item.stage='launch_record_pending';item.why_now='Delivery is marked completed but no actual launch date is recorded in the agreement.';item.href=`/admin/accounting?client=${encodeURIComponent(agreement.client_id)}#client-agreements`;item.cta_label='Review launch record'}
        else if(waiting){item.stage=waiting.responsible_party==='client'?'waiting_on_client':'waiting_on_cws';item.why_now=`Needed-now input: ${waiting.label}.`;item.sources.push(source('project_requirements',waiting,['status','timing','responsible_party','label']))}
        else {item.stage=['waiting_on_client','waiting_on_cws'].includes(project.status)?project.status:'in_delivery';item.why_now=`Linked delivery state: ${project.status}. ${project.actual_hours==null?'No project hours have been entered.':`${project.actual_hours} whole project hours are recorded.`}`}
      }
    }
    items.push(item)
  }
  return {available:true,today,items:items.map(item=>({...item,source_type:'negocio_listo_lifecycle',actionable_on:item.actionable_on || '',sales_order:null,operations_order:null,accounting_order:null,compliance_order:null})).sort((a,b)=>a.priority_tier-b.priority_tier || a.id.localeCompare(b.id))}
}
