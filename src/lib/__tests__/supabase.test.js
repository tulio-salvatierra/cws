import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('supabase client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.resetModules()
  })

  it('exports a supabase client object', async () => {
    const { supabase } = await import('../supabase.js')
    expect(supabase).toBeDefined()
    expect(supabase.from).toBeDefined()
  })

  it('does not initialize when env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.resetModules()

    const { supabase, isSupabaseConfigured } = await import('../supabase.js')
    expect(isSupabaseConfigured()).toBe(false)
    expect(() => supabase.from('keywords')).toThrow(/Supabase is not configured/)
  })
})
