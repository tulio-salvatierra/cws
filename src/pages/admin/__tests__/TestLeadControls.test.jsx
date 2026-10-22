import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
const mocks=vi.hoisted(()=>({from:vi.fn(),update:vi.fn(),eq:vi.fn(),select:vi.fn()}))
vi.mock('../../../lib/supabase',()=>({supabase:{from:mocks.from}}))
import TestLeadControls from '../TestLeadControls.jsx'
const lead={id:'l',name:'QA',is_test:false}
const reload=vi.fn()
const show=(props={})=>render(<TestLeadControls leads={[lead]} workspaceId="w" canManage onReload={reload} {...props}/> )
beforeEach(()=>{vi.clearAllMocks();const chain={update:mocks.update,eq:mocks.eq,select:mocks.select};mocks.from.mockReturnValue(chain);mocks.update.mockReturnValue(chain);mocks.eq.mockReturnValue(chain);mocks.select.mockResolvedValue({data:[{id:'l'}]})})
describe('Owner test lead controls',()=>{
 it('performs no write on view and hides controls for nonowners',()=>{show({canManage:false});expect(screen.queryByRole('heading')).not.toBeInTheDocument();expect(mocks.from).not.toHaveBeenCalled()})
 it('requires reason and preserves history while saving a scoped optimistic flag',async()=>{
  show();fireEvent.change(screen.getByLabelText('Test classification lead'),{target:{value:'l'}})
  expect(screen.getByRole('button',{name:'Exclude test lead'})).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Classification reason'),{target:{value:' QA fixture '}})
  fireEvent.click(screen.getByRole('button',{name:'Exclude test lead'}))
  await waitFor(()=>expect(reload).toHaveBeenCalledOnce())
  expect(mocks.from).toHaveBeenCalledWith('leads');expect(mocks.update).toHaveBeenCalledWith({is_test:true,test_record_reason:'QA fixture'})
  expect(mocks.eq.mock.calls).toEqual([['id','l'],['workspace_id','w'],['is_test',false]])
 })
 it('allows restoration through the separate excluded lead list',async()=>{
  show({leads:[{...lead,is_test:true,test_record_reason:'QA'}]});expect(screen.getByText('1 test leads excluded.')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Test classification lead'),{target:{value:'l'}})
  fireEvent.change(screen.getByLabelText('Classification reason'),{target:{value:'Verified real'}})
  fireEvent.click(screen.getByRole('button',{name:'Restore live lead'}))
  await waitFor(()=>expect(mocks.update).toHaveBeenCalledWith({is_test:false,test_record_reason:'Verified real'}))
 })
 it('does not claim success on stale writes',async()=>{
  mocks.select.mockResolvedValue({data:[]});show();fireEvent.change(screen.getByLabelText('Test classification lead'),{target:{value:'l'}})
  fireEvent.change(screen.getByLabelText('Classification reason'),{target:{value:'QA'}});fireEvent.click(screen.getByRole('button',{name:'Exclude test lead'}))
  expect(await screen.findByRole('alert')).toHaveTextContent('classification changed');expect(reload).not.toHaveBeenCalled()
 })
})
