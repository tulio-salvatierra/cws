import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { getSession } } }))
import LifecycleReviews from '../LifecycleReviews'
import { buildNegocioListoLifecycle } from '../../../../server/lifecycle/negocio-listo'
import { evaluateLifecycleItems } from '../../../../server/laya/lifecycle'
const input={workspaceId:'w',leads:[{id:'l',workspace_id:'w',name:'Synthetic inquiry',source:'negocio-listo|inline',status:'new'}],now:new Date('2026-10-21T18:00:00Z')}
const summary=evaluateLifecycleItems(buildNegocioListoLifecycle(input),input)
const show=(overrides={})=>render(<MemoryRouter><LifecycleReviews summary={{...summary,items:summary.items.map(item=>({...item,owner_response:{can_respond:true,review_token:'exact-lifecycle-token',responses:[],...overrides}}))}} onReload={vi.fn()}/></MemoryRouter>)
beforeEach(()=>{getSession.mockResolvedValue({data:{session:{access_token:'owner-token'}}});vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true})}))})
afterEach(()=>vi.unstubAllGlobals())
describe('Laya lifecycle review UI',()=>{
 it('shows deterministic advice and source-backed claims without a write',()=>{
  show()
  expect(screen.getByText(/Laya · do/)).toBeInTheDocument()
  fireEvent.click(screen.getByText('Lifecycle source evidence'))
  expect(screen.getByText(/Recorded leads evidence/)).toHaveTextContent('Workspace w')
  expect(screen.getByText(/"source": "negocio-listo\|inline"/)).toBeInTheDocument()
  expect(fetch).not.toHaveBeenCalled()
 })
 it.each(['Act','Dismiss'])('records only the owner %s response and reason',async choice=>{
  show();fireEvent.click(screen.getByRole('button',{name:choice,exact:true}))
  fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Reviewed recorded lifecycle source'}})
  fireEvent.click(screen.getByRole('button',{name:`Save ${choice} response`}))
  await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1))
  expect(fetch.mock.calls[0][1]).toMatchObject({method:'POST',body:JSON.stringify({action:'laya_response',review_token:'exact-lifecycle-token',response:choice.toLowerCase(),reason:'Reviewed recorded lifecycle source'})})
  expect(screen.queryByRole('button',{name:/activate|publish|send|launch/i})).not.toBeInTheDocument()
 })
 it('keeps nonowner advice read-only and requires reason before saving',()=>{
  const {unmount}=show({can_respond:false})
  expect(screen.queryByRole('button',{name:'Act'})).not.toBeInTheDocument();unmount()
  show();fireEvent.click(screen.getByRole('button',{name:'Act'}));fireEvent.submit(screen.getByRole('form'))
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a reason')
  fireEvent.click(screen.getByRole('button',{name:'Cancel response'}))
  expect(fetch).not.toHaveBeenCalled()
 })
})
