/* global process */

export const FOOTER_MARKER = '\n\n---\nCommercial email from Cicero Web Studio.'
const UNSUBSCRIBE_BASE = 'https://www.cicerowebstudio.xyz/unsubscribe'
export const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

export function postalAddress() {
  const address = process.env.OUTREACH_POSTAL_ADDRESS?.trim()
  if (!address || /[{}]|your address|placeholder/i.test(address)) throw new Error('Commercial email is unavailable until the owner postal address is configured.')
  return address
}

// Persistent random tokens have no expiry and are independent of signing-key rotation.
// ignoreDuplicates prevents draft preparation from reactivating an opted-out address.
export async function emailPreference(client, workspaceId, email) {
  const normalized = normalizeEmail(email)
  const inserted = await client.from('outreach_email_preferences').upsert({ workspace_id: workspaceId, email: normalized }, { onConflict: 'workspace_id,email', ignoreDuplicates: true })
  if (inserted.error) throw new Error('Email preferences could not be checked.')
  const result = await client.from('outreach_email_preferences').select('id, email, unsubscribed_at').eq('workspace_id', workspaceId).eq('email', normalized).single()
  if (result.error || !result.data) throw new Error('Email preferences could not be checked.')
  return result.data
}

export async function isEmailSuppressed(client, workspaceId, email) {
  const result = await client.from('outreach_email_preferences').select('unsubscribed_at').eq('workspace_id', workspaceId).eq('email', normalizeEmail(email)).maybeSingle()
  if (result.error) throw new Error('Email preferences could not be checked.')
  return Boolean(result.data?.unsubscribed_at)
}

export async function suppressEmail(client, workspaceId, email, reason, ownerId = null) {
  const preference = await emailPreference(client, workspaceId, email)
  const result = await client.from('outreach_email_preferences').update({ unsubscribed_at: new Date().toISOString(), reason, recorded_by: ownerId }).eq('id', preference.id).is('unsubscribed_at', null)
  if (result.error) throw new Error('The opt-out could not be saved. Please try again.')
}

export function unsubscribeUrl(preference) {
  return `${UNSUBSCRIBE_BASE}?token=${encodeURIComponent(preference.id)}`
}

export function commercialBody(body, preference) {
  const address = postalAddress()
  const content = String(body || '').split(FOOTER_MARKER)[0].replace(/\n*Unsubscribe: \{\{unsubscribe_url\}\}/g, '').trim()
  const message = `${content}${FOOTER_MARKER}\n${address}\nUnsubscribe from all marketing emails: ${unsubscribeUrl(preference)}`
  if (!content || message.length > 20000 || /{{[^}]+}}/.test(message)) throw new Error('Review the email: content is missing, too long, or contains unresolved template fields.')
  return message
}

export function validCommercialBody(body, preference) {
  return typeof body === 'string' && body === commercialBody(body, preference)
}

