import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NextMoveControls, { MoveReview } from '../NextMoveControls'
import { moveToken, saveMove } from '../../../../server/laya/move-responses.js'
import { recommendation, scopeCheck } from '../../../../server/laya/next-move.js'
vi.mock('../../../lib/supabase',()=>({supabase:{auth:{getSession:async()=>({data:{session:{access_token:'synthetic'}}})}}}))
const context={workspaceId:'workspace',user:{id:'owner'}}
const base={id:'card',human_action:'Review synthetic deadline',href:'/admin/sales',cta_label:'Go to Sales',priority_tier:1,actionable_on:'2026-11-01',evaluation:{why:[]}}
let rows,item,onReload
beforeEach(()=>{
 vi.stubEnv('GENERATION_SUPABASE_SERVICE_ROLE_KEY','synthetic-key');rows=[];onReload=vi.fn()
 item={...base,evaluation:null,next_move:recommendation(base),scope_check:scopeCheck(null),move_token:moveToken(context,base)}
 context.client={from:vi.fn(()=>({insert:values=>({select:()=>({single:async()=>{rows.push(values);return {data:{id:values.id}}}})})}))}
 vi.stubGlobal('fetch',vi.fn(async(url,options)=>{const result=await saveMove(context,JSON.parse(options.body));return {ok:result.status===200,json:async()=>result}}))
})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.unstubAllEnvs()})
const show=()=>render(<MemoryRouter><NextMoveControls item={item} onReload={onReload}/></MemoryRouter>)
describe('Next move UI through signed persistence',()=>{
 it('records intent only; later and handoff do not call a provider',async()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Do it now'}))
  await screen.findByText(/Intent recorded/)
  expect(rows[0].action).toBe('do');expect(onReload).toHaveBeenCalledOnce()
  expect(context.client.from.mock.calls).toEqual([['laya_move_choices']])
  expect(fetch).toHaveBeenCalledWith('/api/ceo-today',expect.objectContaining({method:'POST'}))
 })
 it('prompts for outcome before closing and persists the exact selection',async()=>{
  show();fireEvent.click(screen.getByText('More',{selector:'summary'}));fireEvent.click(screen.getByRole('button',{name:'Close task'}))
  expect(rows).toHaveLength(0)
  fireEvent.click(screen.getByRole('button',{name:'Not yet'}))
  await waitFor(()=>expect(rows).toHaveLength(1));expect(rows[0]).toMatchObject({action:'close',outcome:'not_yet'})
 })
 it('cancels outcome without saving and records a two-day deferral separately',async()=>{
  show();fireEvent.click(screen.getByText('More',{selector:'summary'}));fireEvent.click(screen.getByRole('button',{name:'Close task'}));fireEvent.click(screen.getByRole('button',{name:'Cancel'}))
  expect(rows).toHaveLength(0);fireEvent.click(screen.getByRole('button',{name:'Later (2 days)'}))
  await waitFor(()=>expect(rows).toHaveLength(1));expect(rows[0]).toMatchObject({action:'later',outcome:null});expect(rows[0].defer_until).toMatch(/^\d{4}-\d{2}-\d{2}$/)
 })
 it('shows a copyable handoff after recording the choice, without contacting Claude',async()=>{
  show();fireEvent.click(screen.getByText('More',{selector:'summary'}));fireEvent.click(screen.getByRole('button',{name:'Hand to Claude'}))
  expect((await screen.findByLabelText('Claude handoff')).value).toContain('Review synthetic deadline')
  expect(rows[0].action).toBe('handoff');expect(fetch).toHaveBeenCalledTimes(1)
 })
 it('shows save errors, preserves the card, and does not reload on failure',async()=>{
  fetch.mockResolvedValue({ok:false,json:async()=>({error:'Choice unavailable'})});show();fireEvent.click(screen.getByRole('button',{name:'Do it now'}))
  expect(await screen.findByRole('alert')).toHaveTextContent('Choice unavailable');expect(onReload).not.toHaveBeenCalled()
 })
 it('renders unavailable review distinctly from an empty recorded review',()=>{
  const view=render(<MoveReview review={{available:false}}/>);expect(screen.getByText(/Choice history is unavailable/)).toBeInTheDocument()
  view.rerender(<MoveReview review={{available:true,groups:[]}}/>);expect(screen.getByText(/No classified recommendation choices/)).toBeInTheDocument()
 })
})
