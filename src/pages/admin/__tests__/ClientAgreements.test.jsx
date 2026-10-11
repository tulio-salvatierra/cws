import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ClientAgreements from '../ClientAgreements'
const agreement = { id:'a',client_id:'c',product_name:'Website',setup_cents:30000,monthly_cents:15000,term_months:12,launch_date:null }
describe('client product agreements',()=>{
 it('creates an agreement using the existing setup bill without recording new cash',async()=>{
  const onAction=vi.fn().mockResolvedValue({ok:true})
  render(<ClientAgreements clients={[{id:'c',name:'Upholstery'}]} obligations={[{id:'o',client_id:'c',description:'Existing setup',amount_cents:30000,status:'expected'}]} onAction={onAction} />)
  fireEvent.click(screen.getByRole('button',{name:'Assign product to client'}))
  fireEvent.change(screen.getByLabelText('Customer'),{target:{value:'c'}})
  fireEvent.change(screen.getByLabelText('Agreed product / service name'),{target:{value:'Website'}})
  fireEvent.change(screen.getByLabelText('Monthly price (USD)'),{target:{value:'150'}})
  fireEvent.change(screen.getByLabelText('Existing setup bill / payment'),{target:{value:'o'}})
  fireEvent.click(screen.getByRole('button',{name:'Save client agreement'}))
  await waitFor(()=>expect(onAction).toHaveBeenCalledWith(expect.objectContaining({action:'create_client_agreement',setup_obligation_id:'o',setup_cents:30000,monthly_cents:15000,term_months:12})))
  expect(onAction).toHaveBeenCalledTimes(1)
 })
 it('requires an explicit launch confirmation and explains Square is pending',async()=>{
  const onAction=vi.fn().mockResolvedValue({ok:true})
  render(<ClientAgreements agreements={[agreement]} clients={[{id:'c',name:'Upholstery'}]} onAction={onAction} />)
  expect(screen.getByText(/Square: setup pending/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Website is live — start monthly billing'}))
  expect(onAction).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Actual website launch date'),{target:{value:'2026-01-31'}})
  fireEvent.click(screen.getByRole('button',{name:'Confirm launch and billing schedule'}))
  await waitFor(()=>expect(onAction).toHaveBeenCalledWith({action:'launch_client_agreement',id:'a',launch_date:'2026-01-31'}))
 })
})
