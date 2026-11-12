// @vitest-environment node
import { URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { brandGuidance } from '../brand-guidance.js'

vi.mock('node:fs', async importOriginal => {
  const fs = await importOriginal()
  return { ...fs, readFileSync: vi.fn(fs.readFileSync) }
})

const read = vi.mocked(readFileSync)

describe('bundled CWS brand guidance', () => {
  it('includes both canonical guides verbatim rather than a duplicated brand summary', () => {
    const guidance = brandGuidance()
    for (const name of ['README.md', 'evergreen-generation.md']) {
      expect(guidance).toContain(readFileSync(new URL(`../../../branding/${name}`, import.meta.url), 'utf8').trim())
    }
  })

  it.each(['', 'not Markdown', '# ' + 'x'.repeat(24_000)])('rejects invalid guide content without an unbranded fallback', content => {
    read.mockReturnValueOnce(content)
    expect(() => brandGuidance()).toThrow('CWS brand guidance is unavailable')
  })

  it('handles missing bundled files without leaking filesystem paths', () => {
    read.mockImplementationOnce(() => { throw new Error('ENOENT /private/deployment/path') })
    expect(() => brandGuidance()).toThrow('CWS brand guidance is unavailable')
  })
})
