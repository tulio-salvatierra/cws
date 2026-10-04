import { authenticateWorkspace, cleanText, missingOutreachEnv, parseBody } from '../outreach/shared.js'

export { authenticateWorkspace, cleanText, missingOutreachEnv, parseBody }

export function missingComplianceEnv() {
  return missingOutreachEnv()
}

export async function authenticateComplianceOwner(req) {
  const context = await authenticateWorkspace(req)
  if (context.error) return context
  const membership = await context.client.from('workspace_members')
    .select('role')
    .eq('workspace_id', context.workspaceId)
    .eq('user_id', context.user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (membership.error) return { error: 'Compliance ownership could not be verified.', status: 502 }
  if (membership.data?.role !== 'owner') return { error: 'An active workspace owner is required for Compliance changes.', status: 403 }
  return context
}

export function validUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

export function dateOnly(value, { required = false } = {}) {
  if (!value && !required) return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T12:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value
}

export function safeSourceUrl(value) {
  const sourceUrl = cleanText(value, 2048)
  if (!sourceUrl) return null
  try {
    const parsed = new URL(sourceUrl)
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.toString() : false
  } catch {
    return false
  }
}
