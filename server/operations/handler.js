import {
  OPERATIONS_PROJECT_STATUSES,
  OPERATIONS_PROJECT_TYPES,
  REQUIREMENT_RESPONSIBLE_PARTIES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TIMINGS,
  buildOperationsReadModel,
} from './readiness.js'
import {
  authenticateOperationsOwner,
  authenticateOperationsWorkspace,
  cleanText,
  missingOperationsEnv,
  parseBody,
} from './shared.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  const missing = missingOperationsEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing Operations environment variables: ${missing.join(', ')}` })
  return req.method === 'GET' ? loadOperations(req, res) : runOwnerAction(req, res)
}

async function loadOperations(req, res) {
  const context = await authenticateOperationsWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const projectId = queryProjectId(req)
  if (projectId === false) return res.status(400).json({ ok: false, error: 'project_id must be a valid project identifier.' })

  const projectsQuery = context.client
    .from('operations_projects')
    .select('id, workspace_id, client_id, name, project_type, status, created_at, updated_at')
    .eq('workspace_id', context.workspaceId)
    .order('created_at', { ascending: true })
  if (projectId) projectsQuery.eq('id', projectId)
  const [projects, requirements, clients] = await Promise.all([
    projectsQuery,
    context.client.from('project_requirements')
      .select('id, workspace_id, project_id, requirement_key, label, category, status, timing, responsible_party, notes, requested_at, received_at, created_at, updated_at')
      .eq('workspace_id', context.workspaceId)
      .order('created_at', { ascending: true }),
    context.client.from('clients')
      .select('id, workspace_id, name, contact_email, contact_phone, status, created_at')
      .eq('workspace_id', context.workspaceId)
      .eq('status', 'active')
      .order('name', { ascending: true }),
  ])
  const failed = [projects, requirements, clients].find((result) => result.error)
  if (failed) return res.status(502).json({ ok: false, error: failed.error.message })

  return res.status(200).json({
    ok: true,
    operations: buildOperationsReadModel({
      workspaceId: context.workspaceId,
      projects: projects.data || [],
      requirements: requirements.data || [],
      clients: clients.data || [],
    }),
  })
}

async function runOwnerAction(req, res) {
  const context = await authenticateOperationsOwner(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const body = parseBody(req.body)
  if (body.action === 'create_operations_project') return createOperationsProject(context, body, res)
  if (body.action === 'update_operations_project') return updateOperationsProject(context, body, res)
  if (body.action === 'update_project_requirement') return updateProjectRequirement(context, body, res)
  return res.status(400).json({ ok: false, error: 'Unknown Operations action.' })
}

async function createOperationsProject(context, body, res) {
  const clientName = cleanText(body.client_name, 200)
  const projectName = cleanText(body.project_name, 200)
  const projectType = cleanText(body.project_type, 50)
  const contactEmail = cleanText(body.contact_email, 320)
  const contactPhone = cleanText(body.contact_phone, 80)
  if (!clientName || !projectName || !OPERATIONS_PROJECT_TYPES.includes(projectType)) {
    return res.status(400).json({ ok: false, error: 'Client name, project name, and a valid project type are required.' })
  }
  const result = await context.client.rpc('create_operations_project', {
    p_workspace_id: context.workspaceId,
    p_client_name: clientName,
    p_contact_email: contactEmail,
    p_contact_phone: contactPhone,
    p_project_name: projectName,
    p_project_type: projectType,
    p_created_by: context.user.id,
  })
  if (result.error || !result.data) return res.status(502).json({ ok: false, error: 'The Operations project could not be created.' })
  return res.status(201).json({ ok: true, project: result.data })
}

async function updateOperationsProject(context, body, res) {
  const projectId = cleanText(body.project_id, 50)
  const status = cleanText(body.status, 50)
  if (!UUID.test(projectId) || !OPERATIONS_PROJECT_STATUSES.includes(status)) {
    return res.status(400).json({ ok: false, error: 'A project and valid status are required.' })
  }
  const result = await context.client.from('operations_projects')
    .update({ status })
    .eq('id', projectId)
    .eq('workspace_id', context.workspaceId)
    .select('id, status, updated_at')
    .maybeSingle()
  if (result.error) return res.status(502).json({ ok: false, error: result.error.message })
  if (!result.data) return res.status(404).json({ ok: false, error: 'Operations project not found.' })
  return res.status(200).json({ ok: true, project: result.data })
}

async function updateProjectRequirement(context, body, res) {
  const requirementId = cleanText(body.requirement_id, 50)
  const status = cleanText(body.status, 50)
  const timing = cleanText(body.timing, 50)
  const responsibleParty = cleanText(body.responsible_party, 50)
  const notes = cleanText(body.notes, 2000) || null
  if (!UUID.test(requirementId) || !REQUIREMENT_STATUSES.includes(status) || !REQUIREMENT_TIMINGS.includes(timing) || !REQUIREMENT_RESPONSIBLE_PARTIES.includes(responsibleParty)) {
    return res.status(400).json({ ok: false, error: 'Requirement details are invalid.' })
  }
  const now = new Date().toISOString()
  const values = {
    status,
    timing,
    responsible_party: responsibleParty,
    notes,
    received_at: status === 'received' ? now : null,
  }
  const result = await context.client.from('project_requirements')
    .update(values)
    .eq('id', requirementId)
    .eq('workspace_id', context.workspaceId)
    .select('id, project_id, status, timing, responsible_party, notes, requested_at, received_at, updated_at')
    .maybeSingle()
  if (result.error) return res.status(502).json({ ok: false, error: result.error.message })
  if (!result.data) return res.status(404).json({ ok: false, error: 'Project requirement not found.' })
  return res.status(200).json({ ok: true, requirement: result.data })
}

function queryProjectId(req) {
  const value = req.query?.project_id
  if (value === undefined || value === null || value === '') return null
  return UUID.test(String(value)) ? String(value) : false
}
