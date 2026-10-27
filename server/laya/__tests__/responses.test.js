import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createResponseToken, createEvaluationResponseToken, readResponseToken, saveOwnerResponse } from '../responses.js'
const source = { id: 'decision-a', workspace_id: 'workspace-a', status: 'proposed', decision: 'Synthetic terms', updated_at: 'v1' }
const evaluation = { evaluator: 'decision_review', policy_version: 'decision-review-v1', subject: { id: source.id, workspace_id: source.workspace_id }, verdict: 'needs_data', evaluated_at: '2026-10-21T18:00:00Z', business_date: '2026-10-21', time_zone: 'America/Chicago', why: [] }
const context = () => ({ workspaceId: 'workspace-a', user: { id: 'owner-a' } })
beforeEach(() => { vi.stubEnv('GENERATION_SUPABASE_SERVICE_ROLE_KEY','synthetic-signing-secret'); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-21T18:00:00Z')) })
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })
describe('Laya review capabilities and append-only responses', () => {
  it('binds the exact source and evaluation to one owner/workspace', () => {
    const ctx = context(); const token = createResponseToken(ctx,source,evaluation)
    expect(readResponseToken(token,ctx)).toMatchObject({ input_snapshot: { decision: source }, evaluation })
    expect(readResponseToken(token,{ ...ctx, user: { id:'other' } })).toBeNull()
    expect(readResponseToken(token,{ ...ctx, workspaceId:'other' })).toBeNull()
    expect(readResponseToken(token+'x',ctx)).toBeNull()
    vi.advanceTimersByTime(15*60*1000)
    expect(readResponseToken(token,ctx)).toBeNull()
  })
  it('stores reviewed evidence rather than later state or body-supplied claims', async () => {
    const ctx=context();const token=createResponseToken(ctx,source,evaluation)
    const insert=vi.fn(() => ({select:()=>({single:async()=>({data:{id:'saved'}})})}));ctx.client={from:vi.fn(()=>({insert}))}
    const later={...source,status:'active',decision:'Changed later'}
    const result=await saveOwnerResponse(ctx,{review_token:token,response:'act',reason:' Owner reason ',input_snapshot:later,evaluation:{verdict:'do'},created_by:'forged'})
    expect(result).toEqual({status:200,id:'saved'})
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({input_snapshot:expect.objectContaining({decision:source}),evaluation,response:'act',reason:'Owner reason',created_by:'owner-a'}))
    expect(ctx.client.from.mock.calls).toEqual([['laya_evaluations']])
  })
  it.each([['act',''],['activate','reason'],['dismiss','x'.repeat(2001)]])('rejects invalid response/reason %s',async(response,reason)=>{
    const ctx=context();ctx.client={from:vi.fn()}
    expect((await saveOwnerResponse(ctx,{response,reason})).status).toBe(400)
    expect(ctx.client.from).not.toHaveBeenCalled()
  })
  it('rejects tampering or expiry before any database write',async()=>{
    const ctx=context();ctx.client={from:vi.fn()}
    expect((await saveOwnerResponse(ctx,{response:'dismiss',reason:'reason',review_token:'forged'})).status).toBe(409)
    expect(ctx.client.from).not.toHaveBeenCalled()
  })
  it.each([['dismiss','reason',200],['act','reason',409],['dismiss','different',409]])('handles duplicate retries without overwriting %s',async(response,reason,status)=>{
    const ctx=context();const token=createResponseToken(ctx,source,evaluation)
    const chain={eq:()=>chain,maybeSingle:async()=>({data:{id:'saved',response:'dismiss',reason:'reason',created_by:'owner-a'}})}
    ctx.client={from:vi.fn(()=>({insert:()=>({select:()=>({single:async()=>({error:{code:'23505'}})})}),select:()=>chain}))}
    expect((await saveOwnerResponse(ctx,{review_token:token,response,reason})).status).toBe(status)
  })
  it('keeps a failed insert retryable without claiming success',async()=>{
    const ctx=context();const token=createResponseToken(ctx,source,evaluation)
    ctx.client={from:()=>({insert:()=>({select:()=>({single:async()=>({error:{code:'unavailable'}})})})})}
    expect((await saveOwnerResponse(ctx,{review_token:token,response:'act',reason:'reason'})).status).toBe(502)
  })
})

describe('goal pace and deal-fit reviewed responses',()=>{
 const goal={evaluator:'goal_pace',policy_version:'goal-pace-v2',subject:{type:'negocio_listo_goal',id:'negocio-listo-2026-12-31',workspace_id:'workspace-a'},verdict:'needs_data',evaluated_at:'2026-10-21T18:00:00.000Z',business_date:'2026-10-21',time_zone:'America/Chicago',missing_data:['Completeness missing']}
 const goalInputs={workspaceId:'workspace-a',agreements:[],evidence:[],completeness:[],available:true,now:'2026-10-21T18:00:00.000Z'}
 it.each(['act','dismiss'])('saves exact goal %s evidence and ignores replacement body data',async response=>{
  const ctx=context();const token=createEvaluationResponseToken(ctx,goalInputs,goal)
  const insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'saved'}})})}));ctx.client={from:vi.fn(()=>({insert}))}
  expect((await saveOwnerResponse(ctx,{review_token:token,response,reason:'Owner response',evaluation:{verdict:'do'},input_snapshot:{available:false},decision_id:'forged'})).status).toBe(200)
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({decision_id:null,evaluator:'goal_pace',input_snapshot:expect.objectContaining({inputs:goalInputs,subject:goal.subject}),evaluation:goal,response}))
  expect(ctx.client.from.mock.calls).toEqual([['laya_evaluations']])
 })
 it.each(['lead','client_service_agreement'])('preserves exact %s deal inputs after later source changes',async type=>{
  const ctx=context(),row={id:'subject',workspace_id:'workspace-a',setup_cents:30000}
  const evaluation={...goal,evaluator:'deal_fit',policy_version:'deal-fit-v2',subject:{type,id:row.id,workspace_id:'workspace-a'}}
  const inputs={...goalInputs,[type==='lead'?'lead':'agreement']:row,budget:{revision:1,setup_hours:6},snapshot:{plans:[]}}
  const token=createEvaluationResponseToken(ctx,inputs,evaluation)
  row.setup_cents=0;inputs.budget.setup_hours=99
  const insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'saved'}})})}));ctx.client={from:vi.fn(()=>({insert}))}
  await saveOwnerResponse(ctx,{review_token:token,response:'act',reason:'Reviewed original'})
  expect(insert.mock.calls[0][0].input_snapshot.inputs[type==='lead'?'lead':'agreement'].setup_cents).toBe(30000)
  expect(insert.mock.calls[0][0].input_snapshot.inputs.budget.setup_hours).toBe(6)
 })
 it('rejects replay by another owner/workspace, tampering and expiry',()=>{
  const ctx=context(),token=createEvaluationResponseToken(ctx,goalInputs,goal)
  expect(readResponseToken(token,{...ctx,user:{id:'different'}})).toBeNull()
  expect(readResponseToken(token,{...ctx,workspaceId:'different'})).toBeNull()
  expect(readResponseToken(token+'x',ctx)).toBeNull()
  vi.advanceTimersByTime(15*60*1000)
  expect(readResponseToken(token,ctx)).toBeNull()
 })
 it('withholds oversized evidence instead of truncating snapshots',()=>{
  expect(createEvaluationResponseToken(context(),{...goalInputs,notes:'x'.repeat(100000)},goal)).toBeNull()
 })
 it('rejects an unsupported evaluator before persistence',async()=>{
  const ctx=context();ctx.client={from:vi.fn()}
  const token=createEvaluationResponseToken(ctx,goalInputs,{...goal,evaluator:'activate'})
  expect((await saveOwnerResponse(ctx,{review_token:token,response:'act',reason:'reason'})).status).toBe(409)
  expect(ctx.client.from).not.toHaveBeenCalled()
 })
 it.each([['act','same',200],['dismiss','same',409],['act','changed',409]])('keeps new-subject retries idempotent %s %s',async(response,reason,status)=>{
  const ctx=context(),token=createEvaluationResponseToken(ctx,goalInputs,goal)
  const chain={eq:()=>chain,maybeSingle:async()=>({data:{id:'saved',created_by:'owner-a',response:'act',reason:'same'}})}
  ctx.client={from:()=>({insert:()=>({select:()=>({single:async()=>({error:{code:'23505'}})})}),select:()=>chain})}
  expect((await saveOwnerResponse(ctx,{review_token:token,response,reason})).status).toBe(status)
 })
})


describe('signed lifecycle response compatibility',()=>{
 it.each(['lead','client_service_agreement'])('saves original %s lifecycle inputs/output after source edits and ignores body overrides',async type=>{
  const ctx={workspaceId:'w',user:{id:'owner'},client:null}
  const row={id:'subject',workspace_id:'w',source:'negocio-listo|inline',product_name:'Negocio Listo Básico',name:'Original'}
  const inputs={workspaceId:'w',now:'2026-10-21T18:00:00.000Z',available:false,[type==='lead'?'lead':'agreement']:row,projects:[],receipts:[]}
  const evaluation={evaluator:'lifecycle',policy_version:'lifecycle-v1',subject:{id:'subject',type,workspace_id:'w'},verdict:'needs_data',evaluated_at:inputs.now,business_date:'2026-10-21',time_zone:'America/Chicago',why:[{claim:'Exact historical claim',source:{id:'subject'}}]}
  const token=createEvaluationResponseToken(ctx,inputs,evaluation)
  row.name='Changed';inputs.available=true;evaluation.verdict='do'
  const insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'saved'}})})}));ctx.client={from:vi.fn(()=>({insert}))}
  expect((await saveOwnerResponse(ctx,{review_token:token,response:'dismiss',reason:'Owner original reason',evaluation:{verdict:'do'},input_snapshot:{inputs:{available:true}},decision_id:'activate'})).status).toBe(200)
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({evaluator:'lifecycle',decision_id:null,response:'dismiss',reason:'Owner original reason',evaluation:expect.objectContaining({verdict:'needs_data'}),input_snapshot:expect.objectContaining({inputs:expect.objectContaining({available:false,[type==='lead'?'lead':'agreement']:expect.objectContaining({name:'Original'})})})}))
  expect(ctx.client.from.mock.calls).toEqual([['laya_evaluations']])
  expect(readResponseToken(token,{...ctx,user:{id:'other'}})).toBeNull()
  expect(readResponseToken(token,{...ctx,workspaceId:'other'})).toBeNull()
  expect(readResponseToken(token+'x',ctx)).toBeNull()
  vi.advanceTimersByTime(15*60*1000);expect(readResponseToken(token,ctx)).toBeNull()
 })
 it('rejects an unrelated offer before any insert',()=>{
  const ctx={workspaceId:'w',user:{id:'owner'}}
  const evaluation={evaluator:'lifecycle',subject:{id:'l',type:'lead',workspace_id:'w'},evaluated_at:new Date().toISOString()}
  const inputs={workspaceId:'w',now:evaluation.evaluated_at,lead:{id:'l',workspace_id:'w',source:'unrelated'}}
  expect(readResponseToken(createEvaluationResponseToken(ctx,inputs,evaluation),ctx)).toBeNull()
 })
})

describe('Exact signed remaining-priority responses',()=>{
 const input=()=>({workspaceId:'workspace-a',now:'2026-10-21T18:00:00Z',action:{id:'sales:inbound:lead-a',source_type:'sales_command',lead_id:'lead-a',human_action:'Review synthetic lead'},principal:{table:'leads',row:{id:'lead-a',workspace_id:'workspace-a',status:'new'}},sources:[{table:'leads',row:{id:'lead-a',workspace_id:'workspace-a',status:'new'}}],availability:{leads:true}})
 const output=()=>({...evaluation,evaluator:'priority_review',policy_version:'priority-review-v1',subject:{type:'ceo_priority',id:'sales:inbound:lead-a',workspace_id:'workspace-a'}})
 it('binds owner/workspace/clock/subject and exact inputs without mutable substitutions',async()=>{
  const ctx=context(),inputs=input(),out=output(),token=createEvaluationResponseToken(ctx,inputs,out)
  expect(readResponseToken(token,ctx).input_snapshot.inputs).toEqual(inputs)
  expect(readResponseToken(token,{...ctx,user:{id:'other'}})).toBeNull()
  expect(readResponseToken(token,{...ctx,workspaceId:'other'})).toBeNull()
  expect(readResponseToken(token+'x',ctx)).toBeNull()
  const insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'saved'}})})}));ctx.client={from:vi.fn(()=>({insert}))}
  inputs.principal.row.status='changed later'
  expect((await saveOwnerResponse(ctx,{review_token:token,response:'dismiss',reason:' Source reviewed ',evaluation:{verdict:'do'},input_snapshot:{forged:true}})).status).toBe(200)
  expect(insert.mock.calls[0][0]).toMatchObject({decision_id:null,evaluator:'priority_review',reason:'Source reviewed',input_snapshot:{inputs:{principal:{row:{status:'new'}}}},evaluation:out})
  expect(ctx.client.from.mock.calls).toEqual([['laya_evaluations']])
 })
 it('rejects clock/subject/foreign-source mismatch and expiry; withholds missing/oversized evidence',()=>{
  const ctx=context()
  expect(readResponseToken(createEvaluationResponseToken(ctx,{...input(),now:'wrong'},output()),ctx)).toBeNull()
  expect(readResponseToken(createEvaluationResponseToken(ctx,input(),{...output(),subject:{...output().subject,id:'wrong'}}),ctx)).toBeNull()
  expect(readResponseToken(createEvaluationResponseToken(ctx,{...input(),sources:[{table:'leads',row:{workspace_id:'foreign'}}]},output()),ctx)).toBeNull()
  expect(createEvaluationResponseToken(ctx,{...input(),principal:null},output())).toBeNull()
  expect(createEvaluationResponseToken(ctx,{...input(),huge:'x'.repeat(100000)},output())).toBeNull()
  const token=createEvaluationResponseToken(ctx,input(),output());vi.advanceTimersByTime(15*60*1000);expect(readResponseToken(token,ctx)).toBeNull()
 })
})


describe('optional owner feedback', () => {
  const body = ctx => ({review_token:createResponseToken(ctx,source,evaluation),response:'dismiss',reason:'Owner reason'})
  it('stores optional feedback with the original reviewed evidence', async () => {
    const ctx=context(), insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'saved'}})})}))
    ctx.client={from:()=>({insert})}
    expect((await saveOwnerResponse(ctx,{...body(ctx),reason_category:'different_priority',alternative_action:'  Call the warm lead first.  '})).status).toBe(200)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({reason_category:'different_priority',alternative_action:'Call the warm lead first.',evaluation}))
  })
  it('keeps omitted and blank optional feedback null for older clients', async () => {
    const ctx=context(), insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'saved'}})})}))
    ctx.client={from:()=>({insert})}
    await saveOwnerResponse(ctx,body(ctx))
    await saveOwnerResponse(ctx,{...body(ctx),reason_category:'',alternative_action:'   '})
    expect(insert.mock.calls.every(([values])=>values.reason_category===null && values.alternative_action===null)).toBe(true)
  })
  it.each([{reason_category:'invented'},{reason_category:[]},{reason_category:'toString'},{alternative_action:42},{alternative_action:'x'.repeat(2001)}])('rejects invalid feedback before writing %j', async extra => {
    const ctx=context();ctx.client={from:vi.fn()}
    expect((await saveOwnerResponse(ctx,{...body(ctx),...extra})).status).toBe(400)
    expect(ctx.client.from).not.toHaveBeenCalled()
  })
  it.each([['different_priority','Call first',200],['not_now','Call first',409],['different_priority','Email instead',409]])('compares all feedback on a retry %s %s',async(category,alternative,status)=>{
    const ctx=context(),chain={eq:()=>chain,maybeSingle:async()=>({data:{id:'saved',created_by:'owner-a',response:'dismiss',reason:'Owner reason',reason_category:'different_priority',alternative_action:'Call first'}})}
    ctx.client={from:()=>({insert:()=>({select:()=>({single:async()=>({error:{code:'23505'}})})}),select:()=>chain})}
    expect((await saveOwnerResponse(ctx,{...body(ctx),reason_category:category,alternative_action:alternative})).status).toBe(status)
  })
})
