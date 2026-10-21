import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest'
import {render,screen,fireEvent} from '@testing-library/react'
const mocks=vi.hoisted(()=>({from:vi.fn(),insert:vi.fn()}))
vi.mock('../../../lib/supabase',()=>({supabase:{from:mocks.from}}))
import ProjectTime from '../ProjectTime.jsx'
const project={id:'p',workspace_id:'w',client_id:'c',actual_hours:null}
const onReload=vi.fn(),onAction=vi.fn()
const show=(props={})=>render(<ProjectTime project={project} canManage onReload={onReload} onAction={onAction} {...props}/>)
beforeEach(()=>{vi.clearAllMocks();mocks.from.mockReturnValue({insert:mocks.insert});mocks.insert.mockReturnValue({select:()=>({single:async()=>({data:{id:'entry'}})})})})
afterEach(()=>vi.unstubAllGlobals())
describe('Owner whole project hours',()=>{
 it('does not infer or write hours on view',()=>{show();expect(screen.getByText(/No hours recorded/)).toBeInTheDocument();expect(mocks.from).not.toHaveBeenCalled()})
 it('hides entry controls from non-owners',()=>{show({canManage:false});expect(screen.queryByRole('button',{name:'Record hours'})).not.toBeInTheDocument()})
 it.each(['1.5','0','-1','1e2'])('rejects non-whole or invalid input %s',async hours=>{show();fireEvent.change(screen.getByLabelText('Whole hours'),{target:{value:hours}});fireEvent.click(screen.getByText('Record hours'));expect(await screen.findByRole('alert')).toHaveTextContent(/whole hours/);expect(mocks.insert).not.toHaveBeenCalled()})
 it('records only exact owner input against this project',async()=>{show();fireEvent.change(screen.getByLabelText('Whole hours'),{target:{value:'3'}});fireEvent.change(screen.getByLabelText('Time notes'),{target:{value:'Synthetic owner work'}});fireEvent.click(screen.getByText('Record hours'));await vi.waitFor(()=>expect(onReload).toHaveBeenCalled());expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({hours:3,project_id:'p',workspace_id:'w',notes:'Synthetic owner work'}));expect(mocks.insert.mock.calls[0][0]).not.toHaveProperty('created_by')})
 it('shows only same-client agreement choices and requires an explicit link save',()=>{show({agreements:[{id:'a',workspace_id:'w',client_id:'c',product_name:'Negocio Listo — Synthetic'},{id:'b',workspace_id:'other',client_id:'c',product_name:'Other workspace'}]});expect(screen.queryByText('Other workspace')).not.toBeInTheDocument();fireEvent.change(screen.getByLabelText('Linked client agreement'),{target:{value:'a'}});expect(onAction).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Save agreement link'));expect(onAction).toHaveBeenCalledWith({action:'link_project_agreement',project_id:'p',agreement_id:'a'})})
})
