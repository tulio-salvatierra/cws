import {describe,it,expect,vi,afterEach} from 'vitest'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
vi.mock('../../../lib/supabase',()=>({supabase:{auth:{getSession:async()=>({data:{session:{access_token:'fixture'}}})}}}))
import PriorityEvaluation from '../PriorityEvaluation.jsx'
const evaluation={evaluator:'priority_review',policy_version:'priority-review-v1',verdict:'needs_data',next_action:'Review source records',business_date:'2026-10-22',time_zone:'America/Chicago',missing_data:['Owner evidence missing'],why:[{claim:'Recorded source',source:{table:'leads',id:'l',workspace_id:'w',version:'v1',fields:{name:'Synthetic',status:'new'}}}],policy_sources:[{document:'docs/product-definition.md',section:'2'}],assumptions:['No business action']}
const item={id:'sales:inbound:l',evaluation,owner_response:{can_respond:true,review_token:'exact-signed-review',responses:[]}}
afterEach(()=>vi.unstubAllGlobals())
describe('Laya on priority cards',()=>{
 it('shows exact source fields/missing data without writing and hides responses for nonowners',()=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);render(<PriorityEvaluation item={{...item,owner_response:{can_respond:false}}}/> )
  expect(screen.getByText('Owner evidence missing')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Priority source evidence'));expect(screen.getByText(/"name": "Synthetic"/)).toBeInTheDocument()
  expect(screen.queryByRole('button',{name:'Act'})).not.toBeInTheDocument();expect(fetch).not.toHaveBeenCalled()
 })
 it('opens/cancels intent without a write, then posts the exact captured token and reason only',async()=>{
  const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true})}),reload=vi.fn();vi.stubGlobal('fetch',fetch)
  render(<PriorityEvaluation item={item} onReload={reload}/> )
  fireEvent.click(screen.getByRole('button',{name:'Act'}));fireEvent.click(screen.getByRole('button',{name:'Cancel response'}));expect(fetch).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button',{name:'Dismiss'}));fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Missing source reviewed'}})
  fireEvent.click(screen.getByRole('button',{name:'Save Dismiss response'}));await waitFor(()=>expect(reload).toHaveBeenCalledOnce())
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({action:'laya_response',review_token:'exact-signed-review',response:'dismiss',reason:'Missing source reviewed'})
  expect(fetch.mock.calls[0][0]).toBe('/api/ceo-today')
 })
})
