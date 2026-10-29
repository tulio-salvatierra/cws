const SHORT_GOOGLE_HOSTS = new Set(['g.page', 'g.co', 'goo.gl', 'maps.app.goo.gl'])

function isGoogleBusinessProfileHost(hostname) {
  const host = String(hostname || '').toLowerCase()
  return host === 'google.com' || host.endsWith('.google.com') || SHORT_GOOGLE_HOSTS.has(host)
}

// This is a manually entered reference, not a provider connection. Keep the
// accepted set intentionally narrow because Lead members can read its href.
export function normalizeGoogleBusinessProfileUrl(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return null
  if (text.length > 2048) return false

  try {
    const url = new URL(text)
    if (url.protocol !== 'https:' || !isGoogleBusinessProfileHost(url.hostname)) return false
    return url.toString()
  } catch {
    return false
  }
}
