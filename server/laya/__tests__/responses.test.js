import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createResponseToken, readResponseToken, saveOwnerResponse } from '../responses.js'
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
