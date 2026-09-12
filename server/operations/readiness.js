export const OPERATIONS_PROJECT_STATUSES = [
  'setup',
  'in_progress',
  'waiting_on_client',
  'waiting_on_cws',
  'completed',
  'paused',
]

export const OPERATIONS_PROJECT_TYPES = [
  'website_build',
  'website_refresh',
  'photography_video',
  'marketing_support',
  'other',
]

export const REQUIREMENT_STATUSES = ['needed', 'received', 'not_applicable']
export const REQUIREMENT_TIMINGS = ['needed_now', 'needed_later', 'opportunity']
export const REQUIREMENT_RESPONSIBLE_PARTIES = ['client', 'cws']

const TERMINAL_STATUSES = new Set(['completed', 'paused'])
const MANUAL_WAITING_STATUSES = new Set(['waiting_on_client', 'waiting_on_cws'])

export function buildOperationsReadModel({ workspaceId, projects = [], requirements = [], clients = [] }) {
  const clientById = new Map((clients || [])
    .filter((client) => client?.workspace_id === workspaceId)
    .map((client) => [client.id, client]))
  const requirementsByProject = new Map()

  for (const requirement of requirements || []) {
    if (!requirement || requirement.workspace_id !== workspaceId) continue
    const rows = requirementsByProject.get(requirement.project_id) || []
    rows.push(requirement)
    requirementsByProject.set(requirement.project_id, rows)
  }

  const items = (projects || [])
    .filter((project) => project?.workspace_id === workspaceId)
    .map((project) => projectReadModel(project, requirementsByProject.get(project.id) || [], clientById.get(project.client_id) || null))
    .sort(compareProjects)

  return {
    projects: items,
    ceo_projection: items
      .filter((project) => !TERMINAL_STATUSES.has(project.status))
      .map((project) => ({
        project_id: project.id,
        client_name: project.client?.name || 'Client unavailable',
        project_name: project.name,
        delivery_state: project.delivery_state,
        blocker_count: project.blocker_count,
        oldest_blocker_since: project.oldest_blocker_since,
        human_reason: project.human_reason,
      })),
  }
}

export function projectReadModel(project, sourceRequirements = [], client = null) {
  const requirements = [...sourceRequirements].sort((left, right) => left.label.localeCompare(right.label))
  const activeRequirements = requirements.filter((requirement) => requirement.status !== 'not_applicable' && requirement.timing !== 'opportunity')
  const receivedRequirements = activeRequirements.filter((requirement) => requirement.status === 'received')
  const blockers = requirements.filter((requirement) => requirement.status === 'needed' && requirement.timing === 'needed_now')
  const clientBlockers = blockers.filter((requirement) => requirement.responsible_party === 'client')
  const cwsBlockers = blockers.filter((requirement) => requirement.responsible_party === 'cws')
  const deliveryState = resolveDeliveryState(project.status, clientBlockers, cwsBlockers)
  const readinessPercent = activeRequirements.length
    ? Math.round((receivedRequirements.length / activeRequirements.length) * 100)
    : 100
  const activeBlockers = clientBlockers.length ? clientBlockers : cwsBlockers
  const oldestBlockerSince = oldestTimestamp(activeBlockers)

  return {
    id: project.id,
    workspace_id: project.workspace_id,
    name: project.name,
    project_type: project.project_type,
    status: project.status,
    created_at: project.created_at,
    updated_at: project.updated_at,
    client: client ? {
      id: client.id,
      name: client.name,
      contact_email: client.contact_email || null,
      contact_phone: client.contact_phone || null,
    } : null,
    requirements,
    readiness: {
      received_count: receivedRequirements.length,
      applicable_count: activeRequirements.length,
      percent: readinessPercent,
    },
    blocker_count: blockers.length,
    blockers,
    current_blocker: oldestRequirement(activeBlockers),
    oldest_blocker_since: oldestBlockerSince,
    waiting_on_client: deliveryState === 'waiting_on_client',
    waiting_on_cws: deliveryState === 'waiting_on_cws',
    ready_to_work: deliveryState === 'ready_to_work',
    delivery_state: deliveryState,
    human_reason: humanReason({ project, deliveryState, clientBlockers, cwsBlockers, blockers }),
  }
}

export function resolveDeliveryState(status, clientBlockers, cwsBlockers) {
  if (TERMINAL_STATUSES.has(status)) return status
  if (clientBlockers.length) return 'waiting_on_client'
  if (cwsBlockers.length) return 'waiting_on_cws'
  if (MANUAL_WAITING_STATUSES.has(status)) return status
  return 'ready_to_work'
}

function oldestTimestamp(requirements) {
  const oldest = oldestRequirement(requirements)
  return oldest ? blockerTimestamp(oldest) : null
}

function oldestRequirement(requirements) {
  return [...requirements]
    .filter(Boolean)
    .sort((left, right) => String(blockerTimestamp(left) || '').localeCompare(String(blockerTimestamp(right) || '')))[0] || null
}

function blockerTimestamp(requirement) {
  return requirement.requested_at || requirement.updated_at || requirement.created_at || null
}

function humanReason({ project, deliveryState, clientBlockers, cwsBlockers, blockers }) {
  if (deliveryState === 'completed') return 'Project is marked completed.'
  if (deliveryState === 'paused') return 'Project is marked paused.'
  if (clientBlockers.length) return `Waiting on client: ${clientBlockers[0]?.label || 'required information'}.`
  if (cwsBlockers.length) return `Waiting on CWS: ${cwsBlockers[0]?.label || 'identified work'}.`
  if (MANUAL_WAITING_STATUSES.has(project.status)) return project.status === 'waiting_on_client'
    ? 'Project is manually marked waiting on client.'
    : 'Project is manually marked waiting on CWS.'
  if (!blockers.length) return 'No needed-now readiness blocker remains.'
  return 'Project readiness needs review.'
}

function compareProjects(left, right) {
  const leftTerminal = TERMINAL_STATUSES.has(left.status)
  const rightTerminal = TERMINAL_STATUSES.has(right.status)
  if (leftTerminal !== rightTerminal) return leftTerminal ? 1 : -1
  if (left.blocker_count !== right.blocker_count) return right.blocker_count - left.blocker_count
  return left.name.localeCompare(right.name)
}
