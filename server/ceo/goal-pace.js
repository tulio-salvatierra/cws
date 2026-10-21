import { chicagoDate } from '../sales/queue.js'

export const isNegocioListo = row => /^negocio listo(?:\s|$|[—-])/i.test(String(row.product_name || '').trim())
export function goalSnapshot(rows, evidence) {
  return rows.map(row => ({id:row.id,client_id:row.client_id,product_name:row.product_name,revision:evidence.find(e=>e.agreement_id===row.id)?.revision ?? null})).sort((a,b)=>a.id.localeCompare(b.id))
}
const canonical = value => JSON.stringify(value, ['id','client_id','product_name','revision'])

export function buildGoalPace({workspaceId,agreements=[],evidence=[],completeness=[],available=true,now=new Date()}) {
  const today=chicagoDate(now)
  const rows=available?agreements.filter(row=>row.workspace_id===workspaceId && isNegocioListo(row)):[]
  const latest=[...evidence].filter(e=>e.workspace_id===workspaceId).sort((a,b)=>Number(b.revision)-Number(a.revision)).filter((e,i,all)=>all.findIndex(r=>r.agreement_id===e.agreement_id)===i)
  const snapshot=goalSnapshot(rows,latest)
  const confirmation=completeness.filter(c=>c.workspace_id===workspaceId && c.confirmed_on===today && canonical(c.snapshot)===canonical(snapshot)).sort((a,b)=>b.created_at.localeCompare(a.created_at))[0]
  const missing=[]
  if(!available) missing.push('Agreement or goal evidence records are unavailable.')
  if(!confirmation) missing.push('Owner completeness confirmation is missing, outdated, or invalidated by changed records; missing records cannot be counted as zero.')
  const included=[]
  const why=[]
  for(const row of rows) {
    const e=latest.find(item=>item.agreement_id===row.id && item.client_id===row.client_id)
    if(!e){missing.push(`Agreement ${row.id}: owner signature, subscription and goal inclusion evidence is missing.`);continue}
    why.push({claim:e.counts_toward_goal?'Owner-recorded core subscription evidence.':'Owner excluded this agreement from goal counts (add-on or replaced agreement).',source:{table:'negocio_listo_evidence',id:String(e.revision),workspace_id:workspaceId,fields:{agreement_id:e.agreement_id,signature_status:e.signature_status,signed_on:e.signed_on,subscription_status:e.subscription_status,status_on:e.status_on,source_note:e.source_note,created_by:e.created_by,created_at:e.created_at}}})
    if(!e.counts_toward_goal)continue
    included.push(e)
    if(!['signed','unsigned'].includes(e.signature_status) || (e.signature_status==='signed' && (!e.signed_on || e.signed_on>today || e.signed_on>e.status_on))) missing.push(`Agreement ${row.id}: verified signature date/status is missing or invalid.`)
    if(!['active','not_started','paused','cancelled','ended'].includes(e.subscription_status) || e.status_on!==today || (e.subscription_status!=='not_started' && e.signature_status!=='signed')) missing.push(`Agreement ${row.id}: current-day subscription status is missing or inconsistent.`)
  }
  if(new Set(included.map(e=>e.client_id)).size!==included.length)missing.push('Multiple core agreements for one client require owner reconciliation; exclude add-ons or replaced agreements.')
  const verified=available && !missing.length
  const target=(count,deadline,recorded)=>({target:count,deadline,recorded:verified?recorded:null,remaining:verified?Math.max(0,count-recorded):null,days_remaining:Math.round((Date.parse(deadline)-Date.parse(today))/86400000)})
  const goal=target(10,'2026-12-31',included.filter(e=>e.subscription_status==='active').length)
  const checkpoint=target(4,'2026-11-15',included.filter(e=>e.signature_status==='signed' && e.signed_on<='2026-11-15').length)
  if(confirmation)why.push({claim:'Owner confirmed all Negocio Listo agreements, signatures and subscription statuses are recorded, including explicit exclusions.',source:{table:'negocio_listo_completeness',id:confirmation.id,workspace_id:workspaceId,fields:{confirmed_on:confirmation.confirmed_on,source_note:confirmation.source_note,created_by:confirmation.created_by,created_at:confirmation.created_at}}})
  const reached=verified && goal.remaining===0 && checkpoint.remaining===0
  return {
    evaluator:'goal_pace',policy_version:'goal-pace-v2',subject:{type:'negocio_listo_goal',id:'negocio-listo-2026-12-31',workspace_id:workspaceId},
    verdict:!verified?'needs_data':reached?'hold':'do',business_date:today,time_zone:'America/Chicago',evaluated_at:now.toISOString(),
    goal,checkpoint,recorded_agreements:available?rows.length:null,verified,
    next_action:!verified?'Review agreement evidence and confirm the complete Negocio Listo register for today before using counts.':reached?'Targets are met in current owner-verified records; review status again when it changes.':`Verified gap: ${goal.remaining} active subscriptions and ${checkpoint.remaining} signatures dated by the checkpoint. Review Sales; no on-track forecast is inferred.`,
    why,target_source:{document:'docs/product-definition.md',section:'1a',version:3},assumptions:[],missing_data:missing,
    forecast_note:'No on-track forecast or required weekly rate is inferred without a pace baseline.',money_at_stake:null,related_decisions:[],
    register:available?rows.map(row=>({...row,evidence:latest.find(e=>e.agreement_id===row.id) || null})):[],
    workspace_id:workspaceId,register_snapshot:snapshot,
  }
}
