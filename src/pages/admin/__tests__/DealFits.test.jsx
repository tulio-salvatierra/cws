import {render,screen,fireEvent} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe,it,expect} from 'vitest'
import DealFits from '../DealFits'
import {buildDealFits} from '../../../../server/laya/deal-fit.js'

describe('Deal fit evidence UI',()=>{
 it('shows partial setup failure, missing economics/capacity and source evidence without mutation controls',()=>{
  const summary=buildDealFits({workspaceId:'w',agreements:[{id:'a',workspace_id:'w',client_id:'c',product_name:'Negocio Listo Básico',setup_cents:20000,monthly_cents:14900,term_months:12}],now:new Date('2026-10-21T12:00:00Z')})
  render(<MemoryRouter><DealFits summary={summary}/></MemoryRouter>)
  expect(screen.getByText('Setup fee · revise')).toBeInTheDocument()
  expect(screen.getByText('$50/hour floor · needs data')).toBeInTheDocument()
  expect(screen.getByText('Capacity · needs data')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Deal-fit sources and missing data'))
  expect(screen.getByText(/Complete current owner labor/)).toBeInTheDocument()
  expect(screen.getByRole('link',{name:'Review source records'})).toHaveAttribute('href','/admin/accounting?client=c#client-agreements')
  expect(screen.queryByRole('button',{name:/act|activate|accept|send|publish/i})).not.toBeInTheDocument()
 })
 it('distinguishes unavailable sources from no deals',()=>{
  const {rerender}=render(<MemoryRouter><DealFits summary={{available:false,items:[]}}/></MemoryRouter>)
  expect(screen.getByText(/Deal records are unavailable/)).toBeInTheDocument()
  rerender(<MemoryRouter><DealFits summary={{available:true,items:[]}}/></MemoryRouter>)
  expect(screen.getByText(/No live Negocio Listo inquiries/)).toHaveTextContent('their records and saved history are preserved')
 })
})
