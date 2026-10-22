import { describe, expect, it, vi } from 'vitest'
import { Buffer } from 'node:buffer'
import { loadResponseHistory, parseHistoryPosition } from '../history.js'

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const at = '2026-10-21T20:00:00.123456+00:00'
const source = Array.from({length:65},(_,i)=>({id:id(i+1),workspace_id:'w',created_at:at,evaluator:i%2?'goal_pace':'deal_fit',reason:`reason-${i}`,input_snapshot:{original:i},evaluation:{verdict:'hold'}}))
function context(rows = source, error = null) {
  let filters=[], boundary, lower, upper, searchFields
  const query={
    select:vi.fn(()=>query),eq:vi.fn((key,value)=>{filters.push([key,value]);return query}),
    gte:vi.fn((key,value)=>{lower=value;return query}),lt:vi.fn((key,value)=>{upper=value;return query}),
    or:vi.fn(value=>{
      if(value.startsWith('created_at.')) boundary=value
      else searchFields=[...value.matchAll(/([^,]+)\.imatch\.("(?:[^"\\]|\\.)*")(?=,|$)/g)].map(match=>({path:match[1].split(/->>?/),text:JSON.parse(match[2]).slice(4).toLocaleLowerCase()}))
      return query
    }),order:vi.fn(()=>query),limit:vi.fn(limit=>{
      let data=rows.filter(row=>filters.every(([key,value])=>row[key]===value))
      if(searchFields)data=data.filter(row=>searchFields.some(({path,text})=>String(path.reduce((value,key)=>value?.[key],row) ?? '').toLocaleLowerCase().includes(text)))
      if(lower)data=data.filter(row=>Date.parse(row.created_at)>=Date.parse(lower))
      if(upper)data=data.filter(row=>Date.parse(row.created_at)<Date.parse(upper))
      data.sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id))
      if(boundary){ const match=boundary.match(/^created_at.lt.(.+),and\(created_at.eq.(.+),id.lt.([a-f0-9-]+)\)$/);data=data.filter(row=>row.created_at<match[1]||(row.created_at===match[2]&&row.id<match[3])) }
      return Promise.resolve({data:data.slice(0,limit),error})
    })
  }
  return {workspaceId:'w',client:{from:vi.fn(()=>query)},query}
}

describe('Laya cursor history',()=>{
  it('walks beyond 30 through tied timestamps without duplicates or gaps, even after a new insert',async()=>{
    const first=await loadResponseHistory(context())
    expect(first.items).toHaveLength(30)
    const position=parseHistoryPosition('all',first.next_cursor,'w')
    expect(position.cursor.at).toBe(at)
    const secondContext=context([...source,{...source[0],id:id(66),created_at:'2026-10-22T00:00:00.000000+00:00'}])
    const second=await loadResponseHistory(secondContext,position)
    const third=await loadResponseHistory(context(),parseHistoryPosition('all',second.next_cursor,'w'))
    expect([...first.items,...second.items,...third.items].map(row=>row.id)).toEqual([...source].reverse().map(row=>row.id))
    expect(third.next_cursor).toBeNull()
    expect(secondContext.query.order.mock.calls).toEqual([['created_at',{ascending:false}],['id',{ascending:false}]])
    expect(secondContext.query.eq).toHaveBeenCalledWith('workspace_id','w')
    expect(first.items[0].input_snapshot).toEqual(source[64].input_snapshot)
    expect(first.items[0].reason).toBe(source[64].reason)
  })
  it('applies type filters before limiting, including older matching rows',async()=>{
    const first=await loadResponseHistory(context(),parseHistoryPosition('goal_pace',null,'w'))
    expect(first.items.every(row=>row.evaluator==='goal_pace')).toBe(true)
    const second=await loadResponseHistory(context(),parseHistoryPosition('goal_pace',first.next_cursor,'w'))
    expect([...first.items,...second.items]).toHaveLength(32)
    expect(second.next_cursor).toBeNull()
  })
  it('combines type/response/date filters before paging and binds them to cursors',async()=>{
    const rows=source.map(row=>({...row,response:'act'}))
    const selected={response:'act',from:'2026-10-21',to:'2026-10-21'}
    const ctx=context([...rows,{...rows[0],id:id(100),response:'dismiss'},{...rows[0],id:id(101),created_at:'2026-10-22T05:00:00Z'}])
    const first=await loadResponseHistory(ctx,parseHistoryPosition('goal_pace',null,'w',selected))
    expect(first.items).toHaveLength(30)
    expect(ctx.query.eq).toHaveBeenCalledWith('response','act')
    expect(ctx.query.gte).toHaveBeenCalledWith('created_at','2026-10-21T05:00:00.000Z')
    expect(ctx.query.lt).toHaveBeenCalledWith('created_at','2026-10-22T05:00:00.000Z')
    const second=await loadResponseHistory(context(rows),parseHistoryPosition('goal_pace',first.next_cursor,'w',selected))
    expect([...first.items,...second.items]).toHaveLength(32)
    expect([...first.items,...second.items].every(row=>row.response==='act'&&row.evaluator==='goal_pace')).toBe(true)
    for(const changed of [{...selected,response:'dismiss'},{...selected,from:'2026-10-20'},{...selected,to:''}])expect(()=>parseHistoryPosition('goal_pace',first.next_cursor,'w',changed)).toThrow('cursor')
  })
  it.each([
    ['2026-03-08','2026-03-08T06:00:00.000Z','2026-03-09T05:00:00.000Z'],
    ['2026-11-01','2026-11-01T05:00:00.000Z','2026-11-02T06:00:00.000Z'],
    ['2026-12-31','2026-12-31T06:00:00.000Z','2027-01-01T06:00:00.000Z'],
    ['2028-02-29','2028-02-29T06:00:00.000Z','2028-03-01T06:00:00.000Z'],
  ])('includes the full Chicago saved-response day %s, including DST',async(day,start,end)=>{
    const before=new Date(Date.parse(start)-1).toISOString(),last=new Date(Date.parse(end)-1).toISOString()
    const rows=[before,start,last,end].map((created_at,i)=>({...source[0],id:id(i),created_at}))
    const ctx=context(rows)
    const page=await loadResponseHistory(ctx,parseHistoryPosition('all',null,'w',{from:day,to:day}))
    expect(page.items.map(row=>row.id)).toEqual([id(2),id(1)])
    expect(ctx.query.gte).toHaveBeenCalledWith('created_at',start)
    expect(ctx.query.lt).toHaveBeenCalledWith('created_at',end)
  })
  it('supports open ranges and rejects invalid responses, dates and reversed ranges',async()=>{
    const from=context([]),to=context([])
    await loadResponseHistory(from,parseHistoryPosition('all',null,'w',{from:'2026-10-21'}))
    expect(from.query.lt).not.toHaveBeenCalled()
    await loadResponseHistory(to,parseHistoryPosition('all',null,'w',{to:'2026-10-21',response:'dismiss'}))
    expect(to.query.gte).not.toHaveBeenCalled()
    for(const options of [{response:'publish'},{response:['act']},{from:'2026-02-30'},{to:'2026-02-29'},{from:'2026-1-01'},{from:['2026-10-21']},{from:'2026-10-21,foo'},{from:'0000-01-01'},{from:'2026-10-22',to:'2026-10-21'}])expect(()=>parseHistoryPosition('all',null,'w',options)).toThrow()
  })
  it('searches saved reasons and subjects before pagination and binds the exact search to cursors',async()=>{
    const rows=source.map(row=>({...row,reason:'Owner saved NEEDLE',response:'act'}))
    const selected={response:'act',from:'2026-10-21',to:'2026-10-21',search:' needle '}
    const first=await loadResponseHistory(context(rows),parseHistoryPosition('goal_pace',null,'w',selected))
    const secondCtx=context(rows)
    const second=await loadResponseHistory(secondCtx,parseHistoryPosition('goal_pace',first.next_cursor,'w',selected))
    expect([...first.items,...second.items]).toHaveLength(32)
    expect(first.search).toBe('needle')
    expect(secondCtx.query.or).toHaveBeenCalledTimes(2)
    expect(()=>parseHistoryPosition('goal_pace',first.next_cursor,'w',{...selected,search:'other'})).toThrow('cursor')
    expect(second.items[0].input_snapshot).toEqual(rows[3].input_snapshot)
  })
  it.each([
    {reason:'Saved CoMPaNy terms'}, {subject_id:'subject-company-id'}, {subject_type:'company_subject'},
    {input_snapshot:{decision:{title:'Company priority'}}}, {input_snapshot:{decision:{decision:'Review Company policy'}}},
    {input_snapshot:{inputs:{lead:{name:'Company lead'}}}}, {input_snapshot:{inputs:{lead:{company:'Company LLC'}}}},
    {input_snapshot:{inputs:{agreement:{product_name:'Company plan'}}}},
  ])('finds historical subject/reason text without joining current sources: %j',async saved=>{
    const row={...source[0],...saved},ctx=context([row,{...source[1],reason:'unrelated'}])
    const result=await loadResponseHistory(ctx,parseHistoryPosition('all',null,'w',{search:'company'}))
    expect(result.items).toEqual([row])
    expect(ctx.client.from.mock.calls).toEqual([['laya_evaluations']])
  })
  it.each(['100%_done*', 'comma,paren()"quote"\\path', '(?i).*|', 'mañana'])('treats punctuation and Unicode literally: %s',async search=>{
    const row={...source[0],reason:`Saved ${search} exactly`}
    const ctx=context([row,{...source[1],reason:'unrelated'},{...source[2],reason:'100XdoneOTHER'}])
    expect((await loadResponseHistory(ctx,parseHistoryPosition('all',null,'w',{search}))).items).toEqual([row])
    const expression=ctx.query.or.mock.calls[0][0]
    expect(expression).toContain(`reason.imatch.${JSON.stringify('(?q)'+search)}`)
  })
  it('validates search length/type/control characters and treats blank as unfiltered',async()=>{
    for(const search of ['a'.repeat(81),['reason'],null,'line\nnext','zero\0']) expect(()=>parseHistoryPosition('all',null,'w',{search})).toThrow('search')
    const ctx=context([])
    expect((await loadResponseHistory(ctx,parseHistoryPosition('all',null,'w',{search:'  '}))).search).toBe('')
    expect(ctx.query.or).not.toHaveBeenCalled()
  })
  it.each([[[]],[source.slice(0,30)]])('does not invent a next page at an exact end',async rows=>{
    expect((await loadResponseHistory(context(rows))).next_cursor).toBeNull()
  })
  it('withholds rows and cursor on database failure',async()=>{
    expect(await loadResponseHistory(context(source,{message:'private error'}))).toMatchObject({available:false,items:[],next_cursor:null})
  })
  it('rejects malformed, oversized, injected, cross-workspace and cross-filter positions',async()=>{
    const first=await loadResponseHistory(context())
    expect(()=>parseHistoryPosition('bogus',null,'w')).toThrow('type')
    const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url')
    const valid={at,id:id(1),type:'all',workspace:'w'}
    for(const cursor of ['?', 'a'.repeat(701),encode(null),encode({...valid,id:'x),workspace_id.neq.w'}),encode({...valid,at:'2026-10-21T20:00:00Z),id.gt.0'}),encode({...valid,at:'invalid'})])expect(()=>parseHistoryPosition('all',cursor,'w')).toThrow('cursor')
    expect(()=>parseHistoryPosition('deal_fit',first.next_cursor,'w')).toThrow('cursor')
    expect(()=>parseHistoryPosition('all',first.next_cursor,'other')).toThrow('cursor')
  })
})

it('filters and pages saved priority responses with literal saved action text, preserving other history',async()=>{
 const rows=Array.from({length:35},(_,i)=>({...source[0],id:id(i+100),evaluator:'priority_review',subject_type:'ceo_priority',subject_id:`operations:${i}`,response:'act',input_snapshot:{inputs:{action:{human_action:'Review Client [A]'}}}}))
 const ctx=context([...source,...rows]);const position=parseHistoryPosition('priority_review',null,'w',{response:'act',search:'Client [A]'})
 const first=await loadResponseHistory(ctx,position)
 expect(first.items).toHaveLength(30);expect(first.items.every(row=>row.evaluator==='priority_review')).toBe(true)
 const next=parseHistoryPosition('priority_review',first.next_cursor,'w',{response:'act',search:'Client [A]'})
 expect((await loadResponseHistory(context([...source,...rows]),next)).items).toHaveLength(5)
 expect(ctx.query.or.mock.calls[0][0]).toContain('input_snapshot->inputs->action->>human_action.imatch.')
})
