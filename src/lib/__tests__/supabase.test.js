import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('supabase client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('exports a supabase client object', async () => {
    const { supabase } = await import('../supabase.js')
    expect(supabase).toBeDefined()
    expect(supabase.from).toBeDefined()
  })
})
