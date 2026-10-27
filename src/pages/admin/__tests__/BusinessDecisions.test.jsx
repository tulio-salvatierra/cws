import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ update: vi.fn(), from: vi.fn(), getSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { from: mocks.from, auth: { getSession: mocks.getSession } } }))
import BusinessDecisions from '../BusinessDecisions'
const row = { id: 'a', workspace_id: 'w', title: 'Offer candidate', decision: 'Keep this offer', status: 'proposed', review_by: '2026-12-31', revisit_condition: 'Four signed agreements', updated_at: 'v1', review_reasons: [] }
const reload = vi.fn()
const show = (overrides = {}) => render(<BusinessDecisions summary={{ available: true, items: [row], can_manage: true, ...overrides }} onReload={reload} />)
beforeEach(() => {
  vi.clearAllMocks()
  mocks.getSession.mockResolvedValue({data:{session:{access_token:'synthetic-token'}}})
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true,response_id:'saved'})}))
  const chain = { eq: vi.fn(() => chain), select: vi.fn().mockResolvedValue({ data: [{ id: 'a' }] }) }
  mocks.update.mockReturnValue(chain)
  mocks.from.mockReturnValue({ update: mocks.update })
})
afterEach(()=>vi.unstubAllGlobals())
describe('Business decisions owner controls', () => {
  it('opens and cancels response forms without writes or activation', () => {
    show({items:[{...row,review_token:'signed-review'}]})
    fireEvent.click(screen.getByRole('button',{name:'Act',exact:true}))
    expect(screen.getByText(/does not activate or edit the decision/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel response'))
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it.each(['Act','Dismiss'])('saves owner %s with a reason and reviewed token only', async response => {
    show({items:[{...row,review_token:'signed-review'}]})
    fireEvent.click(screen.getByRole('button',{name:response,exact:true}))
    fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Owner rationale'}})
    fireEvent.click(screen.getByRole('button',{name:`Save ${response} response`}))
    await screen.findByText('Response saved. The decision was not changed.')
    expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body)).toEqual({action:'laya_response',response:response.toLowerCase(),reason:'Owner rationale',review_token:'signed-review'})
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('does not expose response controls to members', () => {
    show({can_manage:false,items:[{...row,review_token:'signed-review'}]})
    expect(screen.queryByRole('button',{name:'Act',exact:true})).not.toBeInTheDocument()
    expect(screen.queryByRole('button',{name:'Dismiss',exact:true})).not.toBeInTheDocument()
  })
  it('retains the same review for a failed-save retry', async () => {
    globalThis.fetch.mockResolvedValue({ok:false,json:async()=>({error:'Retry this review.'})})
    show({items:[{...row,review_token:'signed-review'}]})
    fireEvent.click(screen.getByRole('button',{name:'Dismiss',exact:true}))
    fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Owner rationale'}})
    fireEvent.click(screen.getByText('Save Dismiss response'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Retry this review.')
    expect(screen.getByLabelText('Reason')).toHaveValue('Owner rationale')
    expect(reload).not.toHaveBeenCalled()
  })

  it('shows a source-backed advisory without adding mutation authority', () => {
    const evaluation = { verdict: 'needs_data', policy_version: 'decision-review-v1', business_date: '2026-10-21', time_zone: 'America/Chicago', next_action: 'Complete review details.', missing_data: ['review_by'], assumptions: ['Owner-observed conditions only.'], why: [{ claim: 'Review date is not recorded.', source: { table: 'business_decisions', id: row.id, fields: { review_by: null } } }] }
    show({ can_manage: false, items: [{ ...row, evaluation }] })
    expect(screen.getByText('Laya · needs data')).toBeInTheDocument()
    expect(screen.getByText('Complete review details.')).toBeInTheDocument()
    expect(screen.getByText(/Missing or invalid data: review_by/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Why · Source evidence'))
    expect(screen.getByText('Review date is not recorded.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Source: business_decisions/ })).toHaveAttribute('href', '#business-decision-a')
    expect(screen.getByText(/never activates or changes a decision/)).toBeInTheDocument()
    expect(screen.queryByText('Review activation')).not.toBeInTheDocument()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('does not write on rendering, reload, or reviewing activation', () => {
    show()
    fireEvent.click(screen.getByText('Review activation'))
    expect(screen.getByText('I activate this decision')).toBeInTheDocument()
    expect(mocks.update).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Cancel activation'))
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('requires the explicit owner action and reloads the durable result', async () => {
    show()
    fireEvent.click(screen.getByText('Review activation'))
    fireEvent.click(screen.getByText('I activate this decision'))
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(mocks.update).toHaveBeenCalledWith({ status: 'active' })
    const chain = mocks.update.mock.results[0].value
    expect(chain.eq).toHaveBeenCalledWith('updated_at', 'v1')
    expect(chain.eq).toHaveBeenCalledWith('workspace_id', 'w')
  })
  it('does not offer activation to a member', () => {
    show({ can_manage: false })
    expect(screen.queryByText('Review activation')).not.toBeInTheDocument()
  })
  it('explains missing review terms before allowing activation', () => {
    show({ items: [{ ...row, revisit_condition: null }] })
    fireEvent.click(screen.getByText('Review activation'))
    expect(screen.getByText(/Set a review date/)).toBeInTheDocument()
    expect(screen.queryByText('I activate this decision')).not.toBeInTheDocument()
  })
  it('reports stale writes without claiming success', async () => {
    show()
    const chain = { eq: vi.fn(() => chain), select: vi.fn().mockResolvedValue({ data: [] }) }
    mocks.update.mockReturnValue(chain)
    fireEvent.click(screen.getByText('Review activation'))
    fireEvent.click(screen.getByText('I activate this decision'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/decision changed/)
    expect(reload).not.toHaveBeenCalled()
  })
})

it('records optional feedback on decision responses without editing the decision',async()=>{
  show({items:[{...row,review_token:'signed-review'}]})
  fireEvent.click(screen.getByRole('button',{name:'Dismiss',exact:true}))
  fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Wrong timing'}})
  fireEvent.change(screen.getByLabelText('Reason category (optional)'),{target:{value:'not_now'}})
  fireEvent.change(screen.getByLabelText('What would you do instead? (optional)'),{target:{value:'Finish delivery first'}})
  fireEvent.click(screen.getByRole('button',{name:'Save Dismiss response'}))
  await screen.findByText('Response saved. The decision was not changed.')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({reason_category:'not_now',alternative_action:'Finish delivery first',review_token:'signed-review'})
  expect(mocks.update).not.toHaveBeenCalled()
})
