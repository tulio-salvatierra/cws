import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe,it,expect,vi,beforeEach} from 'vitest'
const {from,insert,single}=vi.hoisted(()=>({from:vi.fn(),insert:vi.fn(),single:vi.fn()}))
vi.mock('../../../lib/supabase',()=>({supabase:{from}}))
import DealBudget from '../DealBudget'
import DealFits from '../DealFits'
import {buildDealFits} from '../../../../server/laya/deal-fit.js'
const a={id:'a',workspace_id:'w',client_id:'c',product_name:'Negocio Listo Básico',setup_cents:30000,monthly_cents:10000,term_months:12}
const summary=buildDealFits({workspaceId:'w',agreements:[a],now:new Date('2026-10-21T12:00:00Z')})
const item=summary.items[0]
function show(){const reload=vi.fn();render(<MemoryRouter><DealBudget item={item} workspaceId="w" today="2026-10-21" onReload={reload}/></MemoryRouter>);fireEvent.click(screen.getByText('Owner · Record labor, costs and dated capacity'));return reload}
function fill(){
 const values={'Full setup labor hours':'6','Recurring labor hours per month':'2','All setup direct costs (cents)':'0','All recurring direct costs per month (cents)':'0','Total available work hours in window':'20','Other committed hours in window (exclude this deal)':'14','This deal’s labor hours in window':'6','Capacity window start':'2026-10-21','Capacity window end':'2026-10-28','Budget and capacity sources / correction reason':'Reviewed all costs, time estimates and work calendar'}
 for(const [label,value] of Object.entries(values))fireEvent.change(screen.getByLabelText(label),{target:{value}})
 for(const checkbox of screen.getAllByRole('checkbox'))fireEvent.click(checkbox)
}
beforeEach(()=>{vi.clearAllMocks();single.mockResolvedValue({data:{revision:1},error:null});insert.mockReturnValue({select:()=>({single})});from.mockReturnValue({insert})})
describe('owner budget completeness',()=>{
 it('starts blank with explicit completeness unchecked and does not save on viewing',()=>{
  show();expect(screen.getByLabelText('Full setup labor hours')).toHaveValue('')
  expect(screen.getByLabelText('All setup direct costs (cents)')).toHaveValue('')
  expect(screen.getByRole('button',{name:'Record complete budget and capacity'})).toBeDisabled()
  expect(from).not.toHaveBeenCalled()
 })
 it('saves exact owner facts and reviewed snapshot/date only on explicit submit',async()=>{
  const reload=show();fill();fireEvent.click(screen.getByRole('button',{name:'Record complete budget and capacity'}))
  await waitFor(()=>expect(reload).toHaveBeenCalledTimes(1))
  expect(from).toHaveBeenCalledExactlyOnceWith('negocio_listo_deal_budgets')
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({workspace_id:'w',agreement_id:'a',client_id:'c',setup_hours:6,monthly_hours:2,setup_cost_cents:0,monthly_cost_cents:0,available_hours:20,committed_hours:14,deal_window_hours:6,labor_cost_complete:true,capacity_complete:true,snapshot:item.budget_snapshot,verified_on:'2026-10-21'}))
 })
 it('rejects fractional hours without rounding or writing',async()=>{
  show();fill();fireEvent.change(screen.getByLabelText('Full setup labor hours'),{target:{value:'1.5'}})
  fireEvent.click(screen.getByRole('button',{name:'Record complete budget and capacity'}))
  expect(await screen.findByRole('alert')).toHaveTextContent('whole hours')
  expect(from).not.toHaveBeenCalled()
 })
 it('surfaces stale-review database rejection',async()=>{
  single.mockResolvedValue({error:{message:'Records changed; reload'}});show();fill()
  fireEvent.click(screen.getByRole('button',{name:'Record complete budget and capacity'}))
  expect(await screen.findByRole('alert')).toHaveTextContent('Records changed; reload')
 })
 it('guides owners from inquiry-only records to agreement and project evidence',()=>{
  render(<MemoryRouter><DealFits summary={{available:true,items:[]}} canManage onReload={vi.fn()}/></MemoryRouter>)
  expect(screen.getByText(/To record owner budgets/)).toBeInTheDocument()
  expect(screen.getByRole('link',{name:'Accounting'})).toHaveAttribute('href','/admin/accounting#client-agreements')
  expect(from).not.toHaveBeenCalled()
 })
 it.each(['date','snapshot'])('requires new completeness review when displayed %s changes',kind=>{
  const {rerender}=render(<MemoryRouter><DealFits summary={summary} canManage onReload={vi.fn()}/></MemoryRouter>)
  fireEvent.click(screen.getByText('Owner · Record labor, costs and dated capacity'))
  for(const checkbox of screen.getAllByRole('checkbox'))fireEvent.click(checkbox)
  fireEvent.change(screen.getByLabelText('Budget and capacity sources / correction reason'),{target:{value:'Reviewed previous context'}})
  expect(screen.getByRole('button',{name:'Record complete budget and capacity'})).not.toBeDisabled()
  const changed=kind==='date'?{...summary,today:'2026-10-22'}:{...summary,items:summary.items.map(row=>({...row,budget_snapshot:{...row.budget_snapshot,projects:[{id:'new',status:'setup',actual_hours:null}]}}))}
  rerender(<MemoryRouter><DealFits summary={changed} canManage onReload={vi.fn()}/></MemoryRouter>)
  fireEvent.click(screen.getByText('Owner · Record labor, costs and dated capacity'))
  expect(screen.getByRole('button',{name:'Record complete budget and capacity'})).toBeDisabled()
  expect(screen.getByLabelText('Budget and capacity sources / correction reason')).toHaveValue('')
  expect(from).not.toHaveBeenCalled()
 })
 it('offers no recording controls to nonowners',()=>{
  render(<MemoryRouter><DealFits summary={summary} canManage={false}/></MemoryRouter>)
  expect(screen.queryByText('Owner · Record labor, costs and dated capacity')).not.toBeInTheDocument()
  expect(from).not.toHaveBeenCalled()
 })
})
