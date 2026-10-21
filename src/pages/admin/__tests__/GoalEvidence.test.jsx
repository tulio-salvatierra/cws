import { render,screen,fireEvent,waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe,it,expect,vi,beforeEach } from 'vitest'
const {insert,from,single}=vi.hoisted(()=>({insert:vi.fn(),from:vi.fn(),single:vi.fn()}))
vi.mock('../../../lib/supabase',()=>({supabase:{from}}))
import GoalEvidence from '../GoalEvidence'
import GoalPace from '../GoalPace'
import { buildGoalPace } from '../../../../server/ceo/goal-pace.js'
const row={id:'a',client_id:'client',workspace_id:'w',product_name:'Negocio Listo Básico'}
const pace=buildGoalPace({workspaceId:'w',agreements:[row],now:new Date('2026-10-21T12:00:00Z')})
function show(component){return render(<MemoryRouter>{component}</MemoryRouter>)}
beforeEach(()=>{vi.clearAllMocks();single.mockResolvedValue({data:{revision:1},error:null});insert.mockReturnValue({select:()=>({single})});from.mockReturnValue({insert})})
describe('owner goal evidence',()=>{
 it('never saves on render or hides unknown defaults',()=>{
  show(<GoalEvidence pace={pace} onReload={vi.fn()} />)
  expect(screen.getByRole('combobox',{name:'Signature status a',hidden:true})).toHaveValue('unknown')
  expect(from).not.toHaveBeenCalled()
 })
 it('records exact owner input without calling provider or decision activation',async()=>{
  const reload=vi.fn();show(<GoalEvidence pace={pace} onReload={reload} />)
  fireEvent.click(screen.getByText('Owner · Review signature and subscription evidence'))
  fireEvent.change(screen.getByLabelText('Signature status a'),{target:{value:'signed'}})
  fireEvent.change(screen.getByLabelText('Signature date'),{target:{value:'2026-10-20'}})
  fireEvent.change(screen.getByLabelText('Subscription status a'),{target:{value:'active'}})
  fireEvent.change(screen.getByLabelText('Evidence source / correction reason'),{target:{value:'Signed agreement and current provider dashboard'}})
  fireEvent.click(screen.getByRole('button',{name:'Record agreement evidence'}))
  await waitFor(()=>expect(reload).toHaveBeenCalledTimes(1))
  expect(from).toHaveBeenCalledExactlyOnceWith('negocio_listo_evidence')
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({workspace_id:'w',agreement_id:'a',client_id:'client',signature_status:'signed',signed_on:'2026-10-20',subscription_status:'active',status_on:'2026-10-21'}))
 })
 it('requires explicit completeness declaration and source then saves no browser snapshot',async()=>{
  const reload=vi.fn();show(<GoalEvidence pace={{...pace,register:[]}} onReload={reload} />)
  fireEvent.click(screen.getByText('Owner · Review signature and subscription evidence'))
  const button=screen.getByRole('button',{name:'Confirm complete register for today'})
  expect(button).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox',{name:/I checked the full/}))
  expect(button).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Completeness check source / reason'),{target:{value:'Checked all contracts and subscription records; none exist'}})
  fireEvent.click(button)
  await waitFor(()=>expect(reload).toHaveBeenCalledTimes(1))
  expect(from).toHaveBeenCalledWith('negocio_listo_completeness')
  expect(insert).toHaveBeenCalledWith({workspace_id:'w',source_note:'Checked all contracts and subscription records; none exist'})
 })
 it('shows database rejection without changing counts',async()=>{
  single.mockResolvedValue({error:{message:'Review every agreement first'}})
  show(<GoalEvidence pace={{...pace,register:[]}} onReload={vi.fn()} />)
  fireEvent.click(screen.getByText('Owner · Review signature and subscription evidence'))
  fireEvent.click(screen.getByRole('checkbox',{name:/I checked the full/}))
  fireEvent.change(screen.getByLabelText('Completeness check source / reason'),{target:{value:'Reviewed'}})
  fireEvent.click(screen.getByRole('button',{name:'Confirm complete register for today'}))
  expect(await screen.findByRole('alert')).toHaveTextContent('Review every agreement first')
 })
 it('offers no evidence entry to nonowners',()=>{
  show(<GoalPace pace={pace} canManage={false} onReload={vi.fn()} />)
  expect(screen.queryByText('Owner · Review signature and subscription evidence')).not.toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(from).not.toHaveBeenCalled()
 })
})
