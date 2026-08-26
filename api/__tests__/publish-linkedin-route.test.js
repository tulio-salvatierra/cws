import { describe, expect, it } from 'vitest'

import publishHandler from '../publish-linkedin'
import routeHandler from '../publish/linkedin'

describe('LinkedIn publish route wrapper', () => {
  it('exports the canonical LinkedIn publish handler', () => {
    expect(routeHandler).toBe(publishHandler)
  })
})
