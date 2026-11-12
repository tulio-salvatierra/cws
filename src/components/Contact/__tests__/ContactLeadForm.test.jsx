import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactLeadForm from '../ContactLeadForm'
import { submitContactLead } from '../../../lib/negocioListoLead'
vi.mock('../../../lib/negocioListoLead', () => ({ submitContactLead: vi.fn(), hasValidUsPhone: value => value.replace(/\D/g, '').length === 10 }))
function fill() {
  fireEvent.change(screen.getByLabelText('Your name *'), { target: { value: 'Test Visitor' } })
  fireEvent.change(screen.getByLabelText('Email address *'), { target: { value: 'visitor@example.com' } })
  fireEvent.change(screen.getByLabelText('What can we help with? *'), { target: { value: 'new' } })
  fireEvent.change(screen.getByLabelText('Tell us about your project *'), { target: { value: 'A new website' } })
}
describe('Contact inquiry form', () => {
  beforeEach(() => vi.clearAllMocks())
  it('submits optional-phone details and only confirms after the request succeeds', async () => {
    let resolve
    submitContactLead.mockReturnValue(new Promise(done => { resolve = done }))
    render(<ContactLeadForm />); fill()
    fireEvent.submit(screen.getByRole('button', { name: 'Let’s talk about my project' }).closest('form'))
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled()
    expect(submitContactLead).toHaveBeenCalledWith(expect.objectContaining({phone:'',email:'visitor@example.com',service:'new',message:'A new website'}))
    resolve({ok:true})
    await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('received'))
  })
  it('preserves entered details after failure and allows retry', async () => {
    submitContactLead.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ok:true})
    render(<ContactLeadForm />);fill()
    fireEvent.submit(screen.getByRole('button', { name: 'Let’s talk about my project' }).closest('form'))
    await screen.findByRole('alert')
    expect(screen.getByLabelText('Tell us about your project *')).toHaveValue('A new website')
    fireEvent.submit(screen.getByRole('button', { name: 'Let’s talk about my project' }).closest('form'))
    await screen.findByRole('status');expect(submitContactLead).toHaveBeenCalledTimes(2)
  })
})
