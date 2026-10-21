import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authenticateWorkspace: vi.fn(),
  missingOutreachEnv: vi.fn(() => []),
}))

vi.mock('../../server/outreach/shared.js', () => ({
  authenticateWorkspace: mocks.authenticateWorkspace,
  parseBody: body => body || {},
  missingOutreachEnv: mocks.missingOutreachEnv,
}))

import handler from '../ceo-today.js'
import { createResponseToken, createEvaluationResponseToken, readResponseToken } from '../../server/laya/responses.js'

function response() {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) }
  return res
}

function query(result) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
    order: vi.fn(() => chain),
  }
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return chain
}

function activeLead() {
  return {
    id: 'lead-a', name: 'Ada', company: 'Ada Plumbing', email: null, phone: '+13125550123',
    status: 'contacted', sales_classification: 'prospect', response_state: 'no_response',
    locality: 'Chicago', last_contacted_at: null, created_at: '2026-09-09T15:00:00.000Z',
  }
}

function activeOperationsProject(overrides = {}) {
  return {
    id: 'project-a', workspace_id: 'workspace-a', client_id: 'client-a', name: 'Ecclection Website',
    project_type: 'website_build', status: 'setup', created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z',
    ...overrides,
  }
}

function neededClientRequirement(overrides = {}) {
  return {
    id: 'requirement-a', workspace_id: 'workspace-a', project_id: 'project-a', requirement_key: 'project_specific_requirements',
    label: 'Project-specific requirements', category: 'project_specific', status: 'needed', timing: 'needed_now', responsible_party: 'client',
    notes: null, requested_at: '2026-09-01T15:00:00.000Z', received_at: null, created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z',
    ...overrides,
  }
}

describe('CEO Today endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GENERATION_SUPABASE_SERVICE_ROLE_KEY', 'test-secret')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-11T15:00:00Z'))
    mocks.missingOutreachEnv.mockReturnValue([])
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

  it('requires authenticated workspace access before reading any department state', async () => {
    mocks.authenticateWorkspace.mockResolvedValue({ error: 'Authentication required.', status: 401 })
    const res = response()

    await handler({ method: 'GET' }, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Authentication required.' })
  })

  it('reads only workspace-scoped durable department state without provider or reconciliation calls', async () => {
    const queries = []
    const client = {
      from: vi.fn((table) => {
        const data = table === 'leads'
          ? [activeLead()]
          : table === 'marketing_publish_attempts'
            ? [{
                id: 'attempt-a', marketing_slot_key: '2026-09-07:post-a', asset_id: 'website-launch', asset_path: '/images/en-launch.png',
                destination: 'multi:cicero-web-studio', provider_status: 'posted', provider_error: null,
                created_at: '2026-09-08T15:00:00.000Z', updated_at: '2026-09-08T15:00:00.000Z',
              }]
            : table === 'marketing_publish_destination_results'
              ? ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'].map((platform) => ({ attempt_id: 'attempt-a', platform, provider_status: 'posted', provider_error: null }))
              : table === 'operations_projects'
                ? [activeOperationsProject(), { ...activeOperationsProject(), id: 'project-b', workspace_id: 'workspace-b' }]
          : table === 'project_requirements'
                  ? [neededClientRequirement(), { ...neededClientRequirement(), id: 'requirement-b', workspace_id: 'workspace-b', project_id: 'project-b' }]
                  : table === 'financial_obligations'
                    ? [{ id: 'obligation-a', workspace_id: 'workspace-a', client_id: 'client-a', operations_project_id: null, description: 'September website work', amount_cents: 75000, currency: 'USD', obligation_type: 'milestone', due_date: '2026-09-10', status: 'expected', created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z' }, { id: 'obligation-b', workspace_id: 'workspace-b', client_id: 'client-b', operations_project_id: null, description: 'Other workspace', amount_cents: 90000, currency: 'USD', obligation_type: 'milestone', due_date: '2026-09-10', status: 'expected', created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z' }]
                    : table === 'payment_receipts'
                      ? []
                  : table === 'recurring_revenue'
                        ? [{ id: 'recurring-a', workspace_id: 'workspace-a', client_id: 'client-a', description: 'Healthy care plan', amount_cents: 7000, currency: 'USD', cadence: 'monthly', status: 'active', provider: 'square', provider_reference: null, started_at: '2026-03-13', next_expected_at: '2026-10-04', ended_at: null, created_at: '2026-03-13T15:00:00.000Z', updated_at: '2026-03-13T15:00:00.000Z' }]
                        : table === 'compliance_requirements'
                          ? [
                              { id: 'compliance-a', workspace_id: 'workspace-a', title: 'Illinois annual report', category: 'filing', authority_name: 'Illinois Secretary of State', source_url: 'https://www.ilsos.gov/', jurisdiction: 'Illinois', description: 'Annual filing.', applicability_status: 'needs_verification', verified_by_owner_at: null, verified_by_owner_id: null, verified_source_at: null, recurrence_type: 'annual', recurrence_interval: null, last_completed_at: null, next_due_date: null, status: 'active', notes: null, created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z' },
                              { id: 'compliance-b', workspace_id: 'workspace-b', title: 'Other workspace requirement', category: 'filing', authority_name: 'Other', source_url: null, jurisdiction: null, description: 'Other.', applicability_status: 'needs_verification', verified_by_owner_at: null, verified_by_owner_id: null, verified_source_at: null, recurrence_type: 'annual', recurrence_interval: null, last_completed_at: null, next_due_date: null, status: 'active', notes: null, created_at: '2026-09-01T15:00:00.000Z', updated_at: '2026-09-01T15:00:00.000Z' },
                            ]
                          : table === 'compliance_completions'
                            ? []
                  : table === 'clients'
                    ? [{ id: 'client-a', workspace_id: 'workspace-a', name: 'Ecclection', contact_email: null, contact_phone: null, status: 'active', created_at: '2026-09-01T15:00:00.000Z' }, { id: 'client-b', workspace_id: 'workspace-b', name: 'Other', contact_email: null, contact_phone: null, status: 'active', created_at: '2026-09-01T15:00:00.000Z' }]
              : []
        const current = query({ data, error: null })
        queries.push({ table, current })
        return current
      }),
    }
    mocks.authenticateWorkspace.mockResolvedValue({ client, workspaceId: 'workspace-a' })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = response()

    await handler({ method: 'GET' }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toMatchObject({ ok: true })
    expect(res.json.mock.calls[0][0].actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ department: 'SALES', human_action: 'Call Ada Plumbing' }),
    ]))
    expect(queries.map(({ table }) => table)).toEqual([
      'leads',
      'sales_promised_actions',
      'outreach_sends',
      'marketing_publish_attempts',
      'marketing_slot_resolutions',
      'operations_projects',
      'project_requirements',
      'clients',
      'financial_obligations',
      'payment_receipts',
      'recurring_revenue',
      'compliance_requirements',
      'compliance_completions',
      'negocio_listo_evidence',
      'negocio_listo_completeness',
      'client_service_agreements',
      'agreement_installments',
      'negocio_listo_deal_budgets',
      'project_costs',
      'marketing_publish_destination_results',
      'agent_runs',
      'business_decisions',
    ])
    for (const { table, current } of queries) {
      if (table !== 'marketing_publish_destination_results') expect(current.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
      expect(table).not.toContain('bundle')
    }
    expect(queries.find(({ table }) => table === 'marketing_publish_destination_results').current.in).toHaveBeenCalledWith('attempt_id', ['attempt-a'])
    expect(queries.find(({ table }) => table === 'operations_projects').current.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(queries.find(({ table }) => table === 'project_requirements').current.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(queries.find(({ table }) => table === 'clients').current.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(res.json.mock.calls[0][0].all_actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'operations:project-a', source_type: 'operations_delivery' }),
      expect.objectContaining({ id: 'accounting:financial_obligation:obligation-a', department: 'ACCOUNTING', business_priority: 'CONTROL MONEY', href: '/admin/accounting' }),
      expect.objectContaining({ id: 'compliance:compliance-a', department: 'COMPLIANCE', business_priority: 'PROTECT', href: '/admin/compliance' }),
    ]))
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('scopes decisions and owner controls to the authenticated workspace', async () => {
    const queries = []
    const client = { from: vi.fn(table => {
      const data = table === 'workspace_members' ? { role: 'owner' }
        : table === 'business_decisions' ? [{ id: 'decision-a', workspace_id: 'workspace-a', title: 'Synthetic', decision: 'Terms', status: 'active', review_by: '2026-09-11', revisit_condition: 'Owner observation', activated_by: 'owner-a', activated_at: '2026-09-01T12:00:00Z' }, { id: 'other', workspace_id: 'workspace-b', status: 'active', review_by: '2026-09-11' }] : []
      const current = query({ data, error: null }); queries.push({ table, current }); return current
    }) }
    mocks.authenticateWorkspace.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'owner-a' } })
    const res = response()
    await handler({ method: 'GET' }, res)
    expect(res.json.mock.calls[0][0].business_decisions).toMatchObject({ can_manage: true, due_count: 1, items: [expect.objectContaining({ id: 'decision-a', evaluation: expect.objectContaining({ evaluator: 'decision_review', verdict: 'do', money_at_stake: null, why: expect.arrayContaining([expect.objectContaining({ source: expect.objectContaining({ table: 'business_decisions', id: 'decision-a', workspace_id: 'workspace-a' }) })]) }) })] })
    expect(readResponseToken(res.json.mock.calls[0][0].business_decisions.items[0].review_token, {workspaceId:'workspace-a',user:{id:'owner-a'}})).toMatchObject({input_snapshot:{decision:{id:'decision-a'}}})
    expect(queries.find(q => q.table === 'workspace_members').current.eq).toHaveBeenCalledWith('user_id', 'owner-a')
  })

  it('keeps department priorities available if the decision read fails', async () => {
    const client = { from: vi.fn(table => query({ data: [], error: table === 'business_decisions' ? { message: 'unavailable' } : null })) }
    mocks.authenticateWorkspace.mockResolvedValue({ client, workspaceId: 'workspace-a' })
    const res = response()
    await handler({ method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toMatchObject({ ok: true, business_decisions: { available: false, items: [] } })
  })

  it('keeps other priorities when lifecycle agreement reads fail',async()=>{
    const client={from:vi.fn(table=>query({data:[],error:table==='client_service_agreements'?{message:'unavailable'}:null}))}
    mocks.authenticateWorkspace.mockResolvedValue({client,workspaceId:'workspace-a'})
    const res=response();await handler({method:'GET'},res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].negocio_listo).toMatchObject({available:false,items:[]})
    expect(res.json.mock.calls[0][0].deal_fit).toEqual({available:false,items:[]})
    expect(res.json.mock.calls[0][0].goal_pace).toMatchObject({verdict:"needs_data",recorded_agreements:null,goal:{recorded:null},checkpoint:{recorded:null}})
  })

  it('keeps lifecycle and department priorities when goal evidence is unavailable',async()=>{
    const client={from:vi.fn(table=>query({data:[],error:table==='negocio_listo_evidence'?{message:'unavailable'}:null}))}
    mocks.authenticateWorkspace.mockResolvedValue({client,workspaceId:'workspace-a'})
    const res=response();await handler({method:'GET'},res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].negocio_listo.available).toBe(true)
    expect(res.json.mock.calls[0][0].goal_pace).toMatchObject({verdict:'needs_data',goal:{recorded:null},checkpoint:{recorded:null}})
    expect(res.json.mock.calls[0][0].actions.length).toBeGreaterThan(0)
  })

  it('projects scoped inquiry deal-fit checks without extra queries, writes or provider calls',async()=>{
    const rows=[{...activeLead(),workspace_id:'workspace-a',source:'negocio-listo|plan=basico'}]
    const client={from:vi.fn(table=>query({data:table==='leads'?rows:[],error:null}))}
    mocks.authenticateWorkspace.mockResolvedValue({client,workspaceId:'workspace-a'})
    const res=response();await handler({method:'GET'},res)
    expect(res.status).toHaveBeenCalledWith(200)
    const item=res.json.mock.calls[0][0].deal_fit.items[0]
    expect(item.evaluation).toMatchObject({evaluator:'deal_fit',verdict:'needs_data',subject:{id:'lead-a',workspace_id:'workspace-a'}})
    expect(item.evaluation.checks.map(c=>c.status)).toEqual(['needs_data','needs_data','needs_data'])
    expect(item.owner_response).toEqual({can_respond:false})
  })

  it('withholds deal fit when owner budgets cannot load without hiding lifecycle',async()=>{
    const client={from:vi.fn(table=>query({data:[],error:table==='negocio_listo_deal_budgets'?{message:'unavailable'}:null}))}
    mocks.authenticateWorkspace.mockResolvedValue({client,workspaceId:'workspace-a'})
    const res=response();await handler({method:'GET'},res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].deal_fit).toEqual({available:false,items:[]})
    expect(res.json.mock.calls[0][0].negocio_listo.available).toBe(true)
  })

  it('issues owner-only exact goal/deal reviews and independently scopes their history',async()=>{
    const source={...activeLead(),workspace_id:'workspace-a',source:'negocio-listo|inline'}
    const history=[{id:'goal-history',evaluator:'goal_pace',subject_type:'negocio_listo_goal',subject_id:'negocio-listo-2026-12-31'},{id:'deal-history',evaluator:'deal_fit',subject_type:'lead',subject_id:'lead-a'},{id:'other',evaluator:'deal_fit',subject_type:'lead',subject_id:'other'}]
    const client={from:vi.fn(table=>query({data:table==='workspace_members'?{role:'owner'}:table==='leads'?[source]:table==='laya_evaluations'?history:[],error:null}))}
    const context={client,workspaceId:'workspace-a',user:{id:'owner-a'}};mocks.authenticateWorkspace.mockResolvedValue(context)
    const res=response();await handler({method:'GET'},res)
    const payload=res.json.mock.calls[0][0]
    const goal=readResponseToken(payload.goal_pace.owner_response.review_token,context)
    expect(goal.evaluation.evaluator).toBe('goal_pace')
    expect(goal.input_snapshot.inputs.now).toBe(goal.evaluation.evaluated_at)
    expect(payload.goal_pace.owner_response.responses.map(r=>r.id)).toEqual(['goal-history'])
    const item=payload.deal_fit.items[0]
    expect(readResponseToken(item.owner_response.review_token,context).input_snapshot.inputs.lead).toEqual(source)
    expect(item.owner_response.responses.map(r=>r.id)).toEqual(['deal-history'])
    expect(item.response_input).toBeUndefined()
    expect(payload.review_inputs).toBeUndefined()
    expect(goal.evaluation.owner_response).toBeUndefined()
  })

  it.each(['decision','history'])('keeps owner goal/deal response controls independent of unavailable %s reads',async failed=>{
    const source={...activeLead(),workspace_id:'workspace-a',source:'negocio-listo|inline'}
    const client={from:vi.fn(table=>query({data:table==='workspace_members'?{role:'owner'}:table==='leads'?[source]:[],error:table===(failed==='decision'?'business_decisions':'laya_evaluations')?{message:'unavailable'}:null}))}
    mocks.authenticateWorkspace.mockResolvedValue({client,workspaceId:'workspace-a',user:{id:'owner-a'}})
    const res=response();await handler({method:'GET'},res)
    const payload=res.json.mock.calls[0][0]
    expect(payload.goal_pace.owner_response.can_respond).toBe(true)
    expect(payload.deal_fit.items[0].owner_response.can_respond).toBe(true)
    if(failed==='history')expect(payload.goal_pace.owner_response.history_available).toBe(false)
  })

  it.each(['goal_pace','deal_fit'])('persists owner %s response without activating or recomputing',async evaluator=>{
    const subject=evaluator==='goal_pace'?{type:'negocio_listo_goal',id:'negocio-listo-2026-12-31',workspace_id:'workspace-a'}:{type:'lead',id:'lead-a',workspace_id:'workspace-a'}
    const evaluation={evaluator,policy_version:'v2',subject,verdict:'needs_data',evaluated_at:new Date().toISOString(),business_date:'2026-09-11',time_zone:'America/Chicago'}
    const inputs={workspaceId:'workspace-a',now:evaluation.evaluated_at,...(evaluator==='deal_fit'?{lead:{id:'lead-a',workspace_id:'workspace-a'}}:{agreements:[]})}
    const insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'saved'}})})}))
    const client={from:vi.fn(table=>table==='workspace_members'?query({data:{role:'owner'}}):{insert})}
    const context={client,workspaceId:'workspace-a',user:{id:'owner-a'}};mocks.authenticateWorkspace.mockResolvedValue(context)
    const review_token=createEvaluationResponseToken(context,inputs,evaluation)
    const res=response();await handler({method:'POST',body:{action:'laya_response',response:'dismiss',reason:'Owner reason',review_token,status:'active',evaluation:{verdict:'do'}}},res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(client.from.mock.calls).toEqual([['workspace_members'],['laya_evaluations']])
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({decision_id:null,evaluator,evaluation,input_snapshot:expect.objectContaining({inputs}),response:'dismiss',reason:'Owner reason'}))
  })

  it.each(['act','dismiss'])('persists only owner %s response evidence through POST', async choice => {
    const source={id:'decision-a',workspace_id:'workspace-a',status:'proposed',decision:'Reviewed terms'}
    const evaluation={evaluator:'decision_review',policy_version:'decision-review-v1',subject:{id:'decision-a',workspace_id:'workspace-a'},evaluated_at:'2026-09-11T15:00:00Z',business_date:'2026-09-11',time_zone:'America/Chicago'}
    const insert=vi.fn(()=>({select:()=>({single:async()=>({data:{id:'saved-response'}})})}))
    const client={from:vi.fn(table=>table==='workspace_members'?query({data:{role:'owner'}}):{insert})}
    const context={client,workspaceId:'workspace-a',user:{id:'owner-a'}}
    mocks.authenticateWorkspace.mockResolvedValue(context)
    const review_token=createResponseToken(context,source,evaluation)
    const res=response()
    await handler({method:'POST',body:{action:'laya_response',response:choice,reason:'Owner reason',review_token,created_by:'forged'}},res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(client.from.mock.calls).toEqual([['workspace_members'],['laya_evaluations']])
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({created_by:'owner-a',response:choice,reason:'Owner reason',input_snapshot:expect.objectContaining({decision:source}),evaluation}))
  })

  it.each(['member', null])('denies Laya responses for non-owner role %s', async role => {
    const client = { from: vi.fn(() => query({ data: role ? { role } : null })) }
    mocks.authenticateWorkspace.mockResolvedValue({ client, workspaceId: 'workspace-a', user: { id: 'member-a' } })
    const res=response()
    await handler({ method:'POST', body:{action:'laya_response',response:'act',reason:'reason'} },res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(client.from.mock.calls).toEqual([['workspace_members']])
  })

  it('accepts only the Laya response action, never a decision activation action', async () => {
    const client = { from: vi.fn(() => query({ data: {role:'owner'} })) }
    mocks.authenticateWorkspace.mockResolvedValue({client, workspaceId:'workspace-a', user:{id:'owner-a'}})
    const res=response()
    await handler({method:'POST',body:{action:'activate',status:'active'}},res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(client.from.mock.calls).toEqual([['workspace_members']])
  })

  it('rejects unsupported methods without changing business state', async () => {
    const res = response()

    await handler({ method: 'PATCH' }, res)

    expect(res.status).toHaveBeenCalledWith(405)
    expect(mocks.authenticateWorkspace).not.toHaveBeenCalled()
  })
})
