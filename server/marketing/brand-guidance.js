import { URL } from 'node:url'
import { readFileSync } from 'node:fs'

// Fixed repository files only: never accept a path or brand policy from a request.
// Explicit includeFiles in vercel.json keeps these available in the server bundle.
const guides = [
  ['branding/README.md', new URL('../../branding/README.md', import.meta.url)],
  ['branding/evergreen-generation.md', new URL('../../branding/evergreen-generation.md', import.meta.url)],
]

export function brandGuidance() {
  try {
    return guides.map(([name, url]) => {
      const content = readFileSync(url, 'utf8').trim()
      // Fail rather than silently omit or truncate brand guidance.
      if (!content.startsWith('# ') || content.length > 24_000) throw new Error('Invalid guide')
      return `--- ${name} ---\n${content}\n--- End ${name} ---`
    }).join('\n\n')
  } catch {
    throw new Error('CWS brand guidance is unavailable. Restore the bundled branding guides before retrying generation.')
  }
}
