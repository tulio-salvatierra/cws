import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadMoves, moveToken, readMoveToken, saveMove } from '../move-responses.js'
const now=new Date('2026-10-31T18:00:00Z')
const context=()=>({workspaceId:'w',user:{id:'owner'}})
const card={id:'card',human_action:'Review synthetic task',href:'/admin/sales',evaluation:{why:[]}}
beforeEach(()=>vi.stubEnv('GENERATION_SUPABASE_SERVICE_ROLE_KEY','synthetic-key'))
afterEach(()=>vi.unstubAllEnvs())
describe('Next move owner choices',()=>{
  it('binds source evidence, owner, workspace, purpose and expiry',()=>{
    const ctx=context(),token=moveToken(ctx,card,now)
    expect(readMoveToken(token,ctx,now).card.title).toBe(card.human_action)
    expect(readMoveToken(token+'x',ctx,now)).toBeNull()
    expect(readMoveToken(token,{...ctx,workspaceId:'other'},now)).toBeNull()
    expect(readMoveToken(token,{...ctx,user:{id:'other'}},now)).toBeNull()
    expect(readMoveToken(token,ctx,new Date(now.getTime()+15*60000))).toBeNull()
    expect(moveToken(ctx,{...card,human_action:'x'.repeat(100001)},now)).toBeNull()
  })
  it('saves only a signed choice and uses Chicago calendar days across DST',async()=>{
    const ctx=context(),token=moveToken(ctx,card,now)
    const insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'saved'}})})}))
    ctx.client={from:vi.fn(()=>({insert}))}
    expect((await saveMove(ctx,{choice:'later',review_token:token,card_id:'forged',title:'forged',defer_until:'2030-01-01'},now)).status).toBe(200)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({card_id:'card',title:card.human_action,defer_until:'2026-11-02',created_by:'owner'}))
    expect(ctx.client.from.mock.calls).toEqual([['laya_move_choices']])
  })
  it.each([{choice:'close'}, {choice:'publish'}, {choice:'scope',scope:{}}, {choice:'close',outcome:'maybe'}])('rejects invalid choices before database access: %j',async body=>{
    const ctx={...context(),client:{from:vi.fn()}}
    expect((await saveMove(ctx,body,now)).status).toBe(400)
    expect(ctx.client.from).not.toHaveBeenCalled()
  })
  it('rejects unsigned requests and reports failures without claiming a save',async()=>{
    const ctx={...context(),client:{from:vi.fn()}}
    expect((await saveMove(ctx,{choice:'do',review_token:'forged'},now)).status).toBe(409)
    expect(ctx.client.from).not.toHaveBeenCalled()
    ctx.client.from.mockReturnValue({insert:()=>({select:()=>({single:async()=>({error:{code:'offline'}})})})})
    expect((await saveMove(ctx,{choice:'do',review_token:moveToken(ctx,card,now)},now)).status).toBe(502)
  })
  it('makes an identical retry idempotent and rejects a conflicting choice',async()=>{
    const ctx=context(),token=moveToken(ctx,card,now)
    const chain={eq:()=>chain,maybeSingle:async()=>({data:{id:'saved',created_by:'owner',action:'do',outcome:null,scope_evidence:null}})}
    ctx.client={from:()=>({insert:()=>({select:()=>({single:async()=>({error:{code:'23505'}})})}),select:()=>chain})}
    expect((await saveMove(ctx,{choice:'do',review_token:token},now)).status).toBe(200)
    expect((await saveMove(ctx,{choice:'drop',review_token:token},now)).status).toBe(409)
  })
  it('never reports partial or failed history as zero',async()=>{
    const ctx=context()
    function client(result){const q={select:()=>q,eq:()=>q,order:()=>q,limit:()=>Promise.resolve(result)};return {from:()=>q}}
    ctx.client=client({data:Array(1000).fill({})});expect((await loadMoves(ctx,now)).available).toBe(false)
    ctx.client=client({error:{message:'missing migration'}});expect((await loadMoves(ctx,now)).review).toBeNull()
    ctx.client=client({data:[]});expect(await loadMoves(ctx,now)).toMatchObject({available:true,review:[]})
  })
})
