import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest'
const {getSession}=vi.hoisted(()=>({getSession:vi.fn()}))
vi.mock('../../../lib/supabase',()=>({supabase:{auth:{getSession}}}))
import LayaOwnerResponse from '../LayaOwnerResponse'
const review={can_respond:true,review_token:'exact-signed-review',history_available:true,responses:[]}
beforeEach(()=>{vi.clearAllMocks();getSession.mockResolvedValue({data:{session:{access_token:'owner-token'}}});vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true,response_id:'saved'})}))})
afterEach(()=>vi.unstubAllGlobals())
describe('goal/deal owner responses',()=>{
 it('keeps response behavior clear and the full limitations available on demand',()=>{
  render(<LayaOwnerResponse review={review} label="Priority" onReload={vi.fn()}/>)
  expect(screen.getByText('Act or Dismiss saves your choice and reason. You carry out the next step separately.')).toBeVisible()
  const limitations=screen.getByText(/Act\/Dismiss records your response to this exact evaluation/)
  expect(limitations).not.toBeVisible()
  fireEvent.click(screen.getByText('What happens when I respond?'))
  expect(limitations).toBeVisible()
  expect(fetch).not.toHaveBeenCalled()
 })

 it.each(['Goal pace','Deal fit','Lifecycle'])('opens and cancels %s without persistence',label=>{
  render(<LayaOwnerResponse review={review} label={label} onReload={vi.fn()}/>)
  fireEvent.click(screen.getByRole('button',{name:'Act',exact:true}))
  expect(screen.getByRole('form',{name:`${label} owner response`})).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Cancel response'}))
  expect(screen.queryByRole('form')).not.toBeInTheDocument()
  expect(fetch).not.toHaveBeenCalled()
 })
 it.each(['Act','Dismiss'])('saves only exact %s token and reason',async label=>{
  const reload=vi.fn();render(<LayaOwnerResponse review={review} label="Goal pace" onReload={reload}/>)
  fireEvent.click(screen.getByRole('button',{name:label,exact:true}))
  fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Owner reason'}})
  fireEvent.click(screen.getByRole('button',{name:`Save ${label} response`}))
  await waitFor(()=>expect(reload).toHaveBeenCalledTimes(1))
  expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/ceo-today',expect.objectContaining({method:'POST',body:JSON.stringify({action:'laya_response',review_token:'exact-signed-review',response:label.toLowerCase(),reason:'Owner reason'})}))
  expect(screen.queryByRole('button',{name:/activate|publish|send/i})).not.toBeInTheDocument()
 })
 it('requires reason before saving and shows expiry without claiming success',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({error:'Review expired; reload'})}))
  render(<LayaOwnerResponse review={review} label="Deal fit" onReload={vi.fn()}/>)
  fireEvent.click(screen.getByRole('button',{name:'Dismiss',exact:true}))
  fireEvent.submit(screen.getByRole('form'))
  expect(await screen.findByRole('alert')).toHaveTextContent('Enter a reason')
  expect(fetch).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Reason'}});fireEvent.submit(screen.getByRole('form'))
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Review expired'))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
 })
 it('keeps exact saved snapshots/evaluations available for owner inspection',()=>{
  const evaluation={policy_version:'goal-pace-v2',business_date:'2026-10-21',verdict:'needs_data',subject:{id:'goal'}}
  const input_snapshot={inputs:{agreements:[],available:false}}
  render(<LayaOwnerResponse label="Goal pace" review={{can_respond:false,responses:[{id:'r',created_at:'2026-10-21',response:'dismiss',reason:'Historical owner reason',input_snapshot,evaluation}]}}/>)
  fireEvent.click(screen.getByText('Saved responses (1 among the latest 30 across Laya)'))
  fireEvent.click(screen.getByText('Exact reviewed input snapshot and evaluation'))
  expect(screen.getByText(/"available": false/)).toBeInTheDocument()
  expect(fetch).not.toHaveBeenCalled()
 })
 it('captures the opened review token instead of rebinding a reason to refreshed props',async()=>{
  const {rerender}=render(<LayaOwnerResponse review={review} label="Goal pace" onReload={vi.fn()}/>)
  fireEvent.click(screen.getByRole('button',{name:'Act',exact:true}))
  fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Reason for original review'}})
  rerender(<LayaOwnerResponse review={{...review,review_token:'later-review'}} label="Goal pace" onReload={vi.fn()}/>)
  fireEvent.submit(screen.getByRole('form'))
  await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1))
  expect(JSON.parse(fetch.mock.calls[0][1].body).review_token).toBe('exact-signed-review')
 })
 it('offers no control to nonowners and withholds oversized review saves',()=>{
  const {rerender}=render(<LayaOwnerResponse label="Deal fit" review={{can_respond:false}}/>)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  rerender(<LayaOwnerResponse label="Deal fit" review={{can_respond:false,unavailable_reason:'Evidence too large'}}/>)
  expect(screen.getByText('Evidence too large')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
 })
})
