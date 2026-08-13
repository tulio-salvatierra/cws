#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo 'Usage: ./scripts/record-published.sh <platform> <language> <published-url> [brief_version]' >&2
}

if [[ -z "${PUBLISHED_WEBHOOK_SECRET:-}" ]]; then
  echo 'PUBLISHED_WEBHOOK_SECRET is not set. Export it for this terminal session, then try again.' >&2
  exit 1
fi

if [[ $# -lt 3 || $# -gt 4 ]]; then
  usage
  exit 1
fi

platform="$1"
language="$2"
published_url="$3"
brief_version="${4:-}"
endpoint="${PUBLISHED_ENDPOINT_URL:-https://cws-two.vercel.app/api/published}"

case "$platform" in
  instagram|facebook|x|linkedin|pinterest|whatsapp|youtube) ;;
  *)
    echo 'Invalid platform. Accepted values: instagram, facebook, x, linkedin, pinterest, whatsapp, youtube.' >&2
    exit 1
    ;;
esac

case "$language" in
  en|es) ;;
  *)
    echo 'Invalid language. Accepted values: en, es.' >&2
    exit 1
    ;;
esac

if [[ -n "$brief_version" && ! "$brief_version" =~ ^[1-9][0-9]*$ ]]; then
  echo 'brief_version must be a positive integer.' >&2
  exit 1
fi

node --input-type=module - "$platform" "$language" "$published_url" "$brief_version" "$endpoint" <<'NODE'
const [platform, language, externalUrl, briefVersionValue, endpoint] = process.argv.slice(2)

let parsedUrl
try {
  parsedUrl = new URL(externalUrl)
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error()
} catch {
  console.error('published-url must be a valid HTTP or HTTPS URL.')
  process.exit(1)
}

function deriveExternalPostId(url, selectedPlatform) {
  const segments = url.pathname.split('/').filter(Boolean)
  const segmentAfter = (...markers) => {
    const index = segments.findIndex((segment) => markers.includes(segment.toLowerCase()))
    return index >= 0 ? segments[index + 1] : ''
  }

  if (selectedPlatform === 'youtube') {
    if (url.hostname === 'youtu.be') return segments[0] || ''
    return url.searchParams.get('v') || segmentAfter('shorts', 'live') || ''
  }
  if (selectedPlatform === 'instagram') return segmentAfter('p', 'reel', 'tv')
  if (selectedPlatform === 'x') return segmentAfter('status')
  if (selectedPlatform === 'facebook') return segmentAfter('posts', 'reel', 'videos')
  if (selectedPlatform === 'pinterest') return segmentAfter('pin')

  return segments.at(-1) || ''
}

const externalPostId = deriveExternalPostId(parsedUrl, platform)
const payload = {
  platform,
  language,
  external_url: parsedUrl.toString(),
  published_at: new Date().toISOString(),
  source: 'manual',
  ...(externalPostId ? { external_post_id: externalPostId } : {}),
  ...(briefVersionValue ? { brief_version: Number(briefVersionValue) } : {}),
}

let response
try {
  response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-published-webhook-secret': process.env.PUBLISHED_WEBHOOK_SECRET,
    },
    body: JSON.stringify(payload),
  })
} catch (error) {
  console.error(`Could not reach the publication endpoint: ${error.message}`)
  process.exit(1)
}

const responseText = await response.text()
let result
try {
  result = JSON.parse(responseText)
} catch {
  result = null
}

if (!response.ok || !result?.ok || !result?.id) {
  const message = result?.error || responseText || 'Unknown endpoint response.'
  console.error(`Recording failed (HTTP ${response.status}): ${message}`)
  process.exit(1)
}

console.log(`Published row ID: ${result.id}`)
console.log(`Created: ${result.created ? 'yes' : 'no (already existed)'}`)
if (externalPostId) console.log(`External post ID: ${externalPostId}`)
NODE
