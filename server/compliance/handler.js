import {
  COMPLIANCE_CATEGORIES,
  RECURRENCE_TYPES,
  buildComplianceReadModel,
} from './read-model.js'
import {
  authenticateComplianceOwner,
  authenticateWorkspace,
  cleanText,
  dateOnly,
  missingComplianceEnv,
  parseBody,
  safeSourceUrl,
  validUuid,
} from './shared.js'

const requirementFields = 'id, workspace_id, title, category, authority_name, source_url, jurisdiction, description, applicability_status, verified_by_owner_at, verified_by_owner_id, verified_source_at, recurrence_type, recurrence_interval, last_completed_at, next_due_date, status, notes, created_at, updated_at'
const completionFields = 'id, workspace_id, compliance_requirement_id, completed_at, notes, recorded_by, created_at'

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  const missing = missingComplianceEnv()
  if (missing.length) return res.status(500).json({ ok: false, error: `Missing Compliance environment variables: ${missing.join(', ')}` })
  return req.method === 'GET' ? loadCompliance(req, res) : runOwnerAction(req, res)
}

async function loadCompliance(req, res) {
  const context = await authenticateWorkspace(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const [requirements, completions] = await Promise.all([
    context.client.from('compliance_requirements').select(requirementFields)
      .eq('workspace_id', context.workspaceId).order('created_at', { ascending: true }),
    context.client.from('compliance_completions').select(completionFields)
      .eq('workspace_id', context.workspaceId).order('completed_at', { ascending: false }),
  ])
  const failed = [requirements, completions].find((result) => result.error)
  if (failed) return res.status(502).json({ ok: false, error: 'Compliance records could not be loaded.' })
  return res.status(200).json({
    ok: true,
    compliance: buildComplianceReadModel({
      workspaceId: context.workspaceId,
      requirements: requirements.data || [],
      completions: completions.data || [],
    }),
  })
}

async function runOwnerAction(req, res) {
  const context = await authenticateComplianceOwner(req)
  if (context.error) return res.status(context.status).json({ ok: false, error: context.error })
  const body = parseBody(req.body)
  if (body.action === 'create_possible_compliance_requirement') return createPossibleRequirement(context, body, res)
  if (body.action === 'verify_compliance_requirement_applies') return verifyRequirementApplies(context, body, res)
  if (body.action === 'mark_compliance_requirement_not_applicable') return markRequirementNotApplicable(context, body, res)
  if (body.action === 'update_compliance_requirement_details') return updateRequirementDetails(context, body, res)
  if (body.action === 'set_compliance_due_date') return setComplianceDueDate(context, body, res)
  if (body.action === 'record_compliance_completion') return recordComplianceCompletion(context, body, res)
  return res.status(400).json({ ok: false, error: 'Unknown Compliance action.' })
}

async function createPossibleRequirement(context, body, res) {
  const values = inputValues(body)
  if (values.error) return res.status(400).json({ ok: false, error: values.error })
  const result = await context.client.from('compliance_requirements').insert({
    workspace_id: context.workspaceId,
    ...values.data,
    status: 'active',
    applicability_status: 'needs_verification',
    verified_by_owner_at: null,
    verified_by_owner_id: null,
    verified_source_at: null,
    created_by: context.user.id,
  }).select(requirementFields).maybeSingle()
  if (result.error) return res.status(502).json({ ok: false, error: 'The possible requirement could not be saved.' })
  return res.status(201).json({ ok: true, requirement: result.data })
}

async function verifyRequirementApplies(context, body, res) {
  const requirement = await loadedRequirement(context, body.compliance_requirement_id)
  if (requirement.error) return res.status(requirement.status).json({ ok: false, error: requirement.error })
  const authorityName = cleanText(body.authority_name, 200) || requirement.data.authority_name
  const sourceUrl = sourceValue(body, requirement.data.source_url)
  if (!authorityName || sourceUrl === false) return res.status(400).json({ ok: false, error: 'A valid authority and source URL are required when supplied.' })
  const now = new Date().toISOString()
  const result = await context.client.from('compliance_requirements').update({
    authority_name: authorityName,
    source_url: sourceUrl,
    applicability_status: 'applies',
    verified_by_owner_at: now,
    verified_by_owner_id: context.user.id,
    verified_source_at: now,
  }).eq('id', requirement.data.id).eq('workspace_id', context.workspaceId).select(requirementFields).maybeSingle()
  if (result.error || !result.data) return res.status(502).json({ ok: false, error: 'The requirement could not be verified.' })
  return res.status(200).json({ ok: true, requirement: result.data })
}

async function markRequirementNotApplicable(context, body, res) {
  const requirement = await loadedRequirement(context, body.compliance_requirement_id)
  if (requirement.error) return res.status(requirement.status).json({ ok: false, error: requirement.error })
  const now = new Date().toISOString()
  const result = await context.client.from('compliance_requirements').update({
    applicability_status: 'not_applicable',
    verified_by_owner_at: now,
    verified_by_owner_id: context.user.id,
    verified_source_at: now,
  }).eq('id', requirement.data.id).eq('workspace_id', context.workspaceId).select(requirementFields).maybeSingle()
  if (result.error || !result.data) return res.status(502).json({ ok: false, error: 'The requirement could not be marked not applicable.' })
  return res.status(200).json({ ok: true, requirement: result.data })
}

async function updateRequirementDetails(context, body, res) {
  const requirement = await loadedRequirement(context, body.compliance_requirement_id)
  if (requirement.error) return res.status(requirement.status).json({ ok: false, error: requirement.error })
  const values = inputValues(body)
  if (values.error) return res.status(400).json({ ok: false, error: values.error })
  const result = await context.client.from('compliance_requirements').update(values.data)
    .eq('id', requirement.data.id).eq('workspace_id', context.workspaceId).select(requirementFields).maybeSingle()
  if (result.error || !result.data) return res.status(502).json({ ok: false, error: 'Compliance requirement details could not be saved.' })
  return res.status(200).json({ ok: true, requirement: result.data })
}

async function setComplianceDueDate(context, body, res) {
  const requirement = await loadedRequirement(context, body.compliance_requirement_id)
  if (requirement.error) return res.status(requirement.status).json({ ok: false, error: requirement.error })
  const dueDate = dateOnly(body.next_due_date, { required: true })
  if (!dueDate) return res.status(400).json({ ok: false, error: 'A valid next due date is required.' })
  if (requirement.data.applicability_status !== 'applies' || !requirement.data.verified_by_owner_at) {
    return res.status(409).json({ ok: false, error: 'Only an owner-verified applicable requirement can receive a due date.' })
  }
  const result = await context.client.from('compliance_requirements').update({ next_due_date: dueDate })
    .eq('id', requirement.data.id).eq('workspace_id', context.workspaceId).select(requirementFields).maybeSingle()
  if (result.error || !result.data) return res.status(502).json({ ok: false, error: 'The due date could not be saved.' })
  return res.status(200).json({ ok: true, requirement: result.data })
}

async function recordComplianceCompletion(context, body, res) {
  const requirementId = cleanText(body.compliance_requirement_id, 50)
  const completedAt = dateOnly(body.completed_at, { required: true })
  const nextDueDate = dateOnly(body.next_due_date)
  const notes = cleanText(body.notes, 2000) || null
  if (!validUuid(requirementId) || !completedAt || (body.next_due_date && !nextDueDate)) {
    return res.status(400).json({ ok: false, error: 'A requirement and valid completion date are required.' })
  }
  const result = await context.client.rpc('record_compliance_completion', {
    p_workspace_id: context.workspaceId,
    p_requirement_id: requirementId,
    p_completed_at: completedAt,
    p_next_due_date: nextDueDate,
    p_notes: notes,
    p_recorded_by: context.user.id,
  })
  if (result.error || !result.data) return res.status(409).json({ ok: false, error: 'Completion could not be recorded. Confirm applicability and the next due date where required.' })
  return res.status(201).json({ ok: true, completion: result.data })
}

async function loadedRequirement(context, value) {
  const requirementId = cleanText(value, 50)
  if (!validUuid(requirementId)) return { error: 'The Compliance requirement is invalid.', status: 400 }
  const result = await context.client.from('compliance_requirements').select(requirementFields)
    .eq('id', requirementId).eq('workspace_id', context.workspaceId).maybeSingle()
  if (result.error) return { error: 'Compliance requirement could not be loaded.', status: 502 }
  if (!result.data) return { error: 'Compliance requirement was not found.', status: 404 }
  return { data: result.data }
}

function inputValues(body) {
  const title = cleanText(body.title, 200)
  const category = cleanText(body.category, 50)
  const authorityName = cleanText(body.authority_name, 200)
  const sourceUrl = safeSourceUrl(body.source_url)
  const jurisdiction = cleanText(body.jurisdiction, 200) || null
  const description = cleanText(body.description, 2000)
  const recurrenceType = cleanText(body.recurrence_type, 50)
  const recurrenceInterval = body.recurrence_interval === '' || body.recurrence_interval === null || body.recurrence_interval === undefined
    ? null : Number(body.recurrence_interval)
  const nextDueDate = dateOnly(body.next_due_date)
  const notes = cleanText(body.notes, 2000) || null
  if (!title || !COMPLIANCE_CATEGORIES.includes(category) || !authorityName || !description || !RECURRENCE_TYPES.includes(recurrenceType) || sourceUrl === false || (body.next_due_date && !nextDueDate)) {
    return { error: 'Title, category, authority, description, and recurrence details are required.' }
  }
  if (recurrenceType === 'custom' && (!Number.isInteger(recurrenceInterval) || recurrenceInterval < 1 || recurrenceInterval > 120)) {
    return { error: 'Custom recurrence requires an interval from 1 to 120 months.' }
  }
  if (recurrenceType !== 'custom' && recurrenceInterval !== null) return { error: 'Only custom recurrence may include an interval.' }
  return {
    data: {
      title,
      category,
      authority_name: authorityName,
      source_url: sourceUrl,
      jurisdiction,
      description,
      recurrence_type: recurrenceType,
      recurrence_interval: recurrenceInterval,
      next_due_date: nextDueDate,
      notes,
    },
  }
}

function sourceValue(body, current) {
  if (body.source_url === undefined) return current || null
  return safeSourceUrl(body.source_url)
}
