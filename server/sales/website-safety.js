import { lookup as lookupHost } from 'node:dns/promises'
import net from 'node:net'

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.home', '.corp', '.lan']
const BLOCKED_HOSTS = new Set(['localhost', 'localhost.localdomain', 'metadata.google.internal'])

export async function validatePublicWebsiteUrl(value, { lookup = lookupHost } = {}) {
  const url = parseHttpUrl(value)
  if (!url || url.username || url.password || isBlockedHost(url.hostname)) {
    return { ok: false, error: 'The website address is not a public HTTP address.' }
  }

  try {
    const addresses = net.isIP(url.hostname)
      ? [{ address: url.hostname }]
      : await lookup(url.hostname, { all: true, verbatim: true })
    if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address))) {
      return { ok: false, error: 'The website address does not resolve to a public network.' }
    }
  } catch {
    return { ok: false, error: 'The website address could not be resolved safely.' }
  }

  return { ok: true, url: url.toString() }
}

export function parseHttpUrl(value, base) {
  try {
    const url = new URL(value, base)
    return ['http:', 'https:'].includes(url.protocol) ? url : null
  } catch {
    return null
  }
}

export function isPublicIp(value) {
  const version = net.isIP(value)
  if (version === 4) return isPublicIpv4(value)
  if (version === 6) return isPublicIpv6(value)
  return false
}

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return BLOCKED_HOSTS.has(host) || BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
}

function isPublicIpv4(value) {
  const [a, b] = value.split('.').map(Number)
  if (![a, b].every(Number.isInteger)) return false
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && (b === 0 || b === 168)) return false
  if (a === 198 && (b === 18 || b === 19 || b === 51)) return false
  if (a === 203 && b === 0) return false
  return true
}

function isPublicIpv6(value) {
  const address = value.toLowerCase()
  if (address === '::' || address === '::1' || address.startsWith('fe80:') || address.startsWith('fc') || address.startsWith('fd')) return false
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  return !mapped || isPublicIpv4(mapped[1])
}
