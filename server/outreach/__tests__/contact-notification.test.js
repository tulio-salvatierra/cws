import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({send:vi.fn(),from:vi.fn(),delay:vi.fn()}))
vi.mock('../../../api/lib/resend.js',()=>({getFromEmail:mocks.from,sendResendEmail:mocks.send}))
import { notifyContactLead } from '../contact-notification.js'
const lead={name:'Visitor',email:'visitor@example.com',phone:null,company:null,inquiry_service:'audit',inquiry_message:'<script>untrusted</script>\nProject details',source:'contact-page|contact|en'}
describe('contact owner notification',()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.from.mockReturnValue('CWS <verified@example.com>');mocks.send.mockResolvedValue({data:{id:'email-1'},error:null});vi.spyOn(console,'error').mockImplementation(()=>{})})
  it('uses fixed recipient, verified sender and visitor reply-to with plain-text details',async()=>{
    expect(await notifyContactLead('lead-1',{...lead,to:'attacker@example.com'})).toBe(true)
    const [payload,options]=mocks.send.mock.calls[0]
    expect(payload).toMatchObject({from:'CWS <verified@example.com>',to:['info@cicerowebstudio.xyz'],replyTo:lead.email,subject:'New contact inquiry — Cicero Web Studio'})
    expect(payload.html).toBeUndefined();expect(payload.text).toContain(lead.inquiry_message)
    expect(payload.text).toContain('Phone: Not provided');expect(payload.text).toContain('Project type: A website audit')
    expect(payload.text).toContain('https://www.cicerowebstudio.xyz/admin/sales')
    expect(options.idempotencyKey).toBe('contact-inquiry-lead-1')
  })
  it('reuses identical payload/key for transient and browser retries',async()=>{
    mocks.send.mockResolvedValueOnce({error:{statusCode:503}})
    expect(await notifyContactLead('lead-1',lead)).toBe(true)
    expect(await notifyContactLead('lead-1',lead)).toBe(true)
    expect(mocks.send.mock.calls[0]).toEqual(mocks.send.mock.calls[1]);expect(mocks.send.mock.calls[1]).toEqual(mocks.send.mock.calls[2])
  })
  it('catches thrown network errors and reports failure without leaking the message',async()=>{
    mocks.send.mockRejectedValue(new Error('private data'))
    expect(await notifyContactLead('lead-1',lead)).toBe(false)
    expect(mocks.send).toHaveBeenCalledTimes(2)
    expect(console.error).toHaveBeenCalledWith('Contact notification unconfirmed',{leadId:'lead-1'})
  })
  it('does not retry permanent provider failures',async()=>{
    mocks.send.mockResolvedValue({error:{statusCode:403}})
    expect(await notifyContactLead('lead-1',lead)).toBe(false);expect(mocks.send).toHaveBeenCalledTimes(1)
  })
  it('does not send without a configured sender',async()=>{
    mocks.from.mockReturnValue(null)
    expect(await notifyContactLead('lead-1',lead)).toBe(false);expect(mocks.send).not.toHaveBeenCalled()
  })
})
