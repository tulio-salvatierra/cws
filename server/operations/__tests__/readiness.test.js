import { describe, expect, it } from 'vitest'
import { buildOperationsReadModel, projectReadModel } from '../readiness.js'

const project = {
  id: 'project-a', workspace_id: 'workspace-a', client_id: 'client-a', name: 'Northside Website', project_type: 'website_build', status: 'setup', created_at: '2026-09-12T10:00:00.000Z', updated_at: '2026-09-12T10:00:00.000Z',
}

function requirement(overrides = {}) {
  return {
    id: 'requirement-a', workspace_id: 'workspace-a', project_id: 'project-a', requirement_key: 'business_basics', label: 'Business basics', category: 'business_basics', status: 'needed', timing: 'needed_now', responsible_party: 'client', requested_at: '2026-09-10T10:00:00.000Z', received_at: null, created_at: '2026-09-10T10:00:00.000Z', updated_at: '2026-09-10T10:00:00.000Z', notes: null,
    ...overrides,
  }
}

describe('Operations readiness projection', () => {
  it('derives readiness and a client wait from needed-now client requirements', () => {
    const result = projectReadModel(project, [
      requirement(),
      requirement({ id: 'requirement-b', requirement_key: 'brand_assets', label: 'Brand assets', status: 'received', received_at: '2026-09-11T10:00:00.000Z' }),
      requirement({ id: 'requirement-c', requirement_key: 'legal_policies', label: 'Legal policies', status: 'not_applicable' }),
      requirement({ id: 'requirement-d', requirement_key: 'photos_video', label: 'Photos and video', timing: 'opportunity' }),
    ])

    expect(result.readiness).toEqual({ received_count: 1, applicable_count: 2, percent: 50 })
    expect(result.delivery_state).toBe('waiting_on_client')
    expect(result.waiting_on_client).toBe(true)
    expect(result.waiting_on_cws).toBe(false)
    expect(result.ready_to_work).toBe(false)
    expect(result.oldest_blocker_since).toBe('2026-09-10T10:00:00.000Z')
  })

  it('prioritizes client blockers when both client and CWS work are outstanding', () => {
    const result = projectReadModel(project, [
      requirement({ id: 'client', label: 'Client logo', responsible_party: 'client', requested_at: '2026-09-11T10:00:00.000Z' }),
      requirement({ id: 'cws', requirement_key: 'brand_assets', label: 'CWS asset review', responsible_party: 'cws', requested_at: '2026-09-10T10:00:00.000Z' }),
    ])
    expect(result.delivery_state).toBe('waiting_on_client')
    expect(result.blocker_count).toBe(2)
    expect(result.current_blocker.label).toBe('Client logo')
  })

  it('derives waiting on CWS only when client-owned needed-now blockers are clear', () => {
    const result = projectReadModel({ ...project, status: 'in_progress' }, [
      requirement({ responsible_party: 'cws', label: 'CWS access review' }),
      requirement({ id: 'later', requirement_key: 'brand_assets', label: 'Brand assets', timing: 'needed_later' }),
    ])
    expect(result.delivery_state).toBe('waiting_on_cws')
    expect(result.waiting_on_cws).toBe(true)
  })

  it('reports ready to work when all needed-now requirements are received or not applicable', () => {
    const result = projectReadModel({ ...project, status: 'in_progress' }, [
      requirement({ status: 'received', received_at: '2026-09-12T10:00:00.000Z' }),
      requirement({ id: 'b', requirement_key: 'brand_assets', label: 'Brand assets', status: 'not_applicable' }),
      requirement({ id: 'c', requirement_key: 'photos_video', label: 'Photos and video', timing: 'needed_later' }),
    ])
    expect(result.delivery_state).toBe('ready_to_work')
    expect(result.ready_to_work).toBe(true)
    expect(result.blocker_count).toBe(0)
  })

  it('retains an explicit waiting status when the owner has no fixed-item blocker to record', () => {
    const result = projectReadModel({ ...project, status: 'waiting_on_cws' }, [
      requirement({ status: 'received', received_at: '2026-09-12T10:00:00.000Z' }),
    ])
    expect(result.delivery_state).toBe('waiting_on_cws')
    expect(result.human_reason).toBe('Project is manually marked waiting on CWS.')
  })

  it('keeps terminal project status over readiness blockers', () => {
    const completed = projectReadModel({ ...project, status: 'completed' }, [requirement()])
    const paused = projectReadModel({ ...project, status: 'paused' }, [requirement({ responsible_party: 'cws' })])
    expect(completed.delivery_state).toBe('completed')
    expect(paused.delivery_state).toBe('paused')
  })

  it('does not expose another workspace project, client, or requirement', () => {
    const model = buildOperationsReadModel({
      workspaceId: 'workspace-a',
      projects: [project, { ...project, id: 'project-b', workspace_id: 'workspace-b', name: 'Other workspace' }],
      requirements: [requirement(), requirement({ id: 'foreign-requirement', workspace_id: 'workspace-b', project_id: 'project-a', label: 'Foreign requirement' })],
      clients: [{ id: 'client-a', workspace_id: 'workspace-a', name: 'Northside' }, { id: 'client-a', workspace_id: 'workspace-b', name: 'Other client' }],
    })
    expect(model.projects).toHaveLength(1)
    expect(model.projects[0].client.name).toBe('Northside')
    expect(model.projects[0].requirements).toHaveLength(1)
    expect(model.ceo_projection).toEqual([expect.objectContaining({ project_id: 'project-a', client_name: 'Northside' })])
  })
})
