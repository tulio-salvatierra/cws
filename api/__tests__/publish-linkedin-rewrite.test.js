import { describe, expect, it } from 'vitest'

import vercelConfig from '../../vercel.json'

describe('LinkedIn publish route rewrite', () => {
  it('routes the UI publish path to the existing Vercel function', () => {
    expect(vercelConfig.rewrites).toContainEqual({
      source: '/api/publish/linkedin',
      destination: '/api/publish-linkedin',
    })
  })
})
