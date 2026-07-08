import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Don't throw at module load — that would crash the entire app (including
  // public marketing pages) just because admin-only Supabase config is missing.
  // Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your build environment
  // (e.g. Vercel → Project Settings → Environment Variables) and redeploy.
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. ' +
      'Supabase-backed features are disabled until these env vars are set at build time.'
  )
}

function createMissingConfigProxy() {
  const message =
    'Supabase is not configured: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ' +
    'are missing from this build. Set them in your environment and redeploy.'

  return new Proxy(
    {},
    {
      get() {
        throw new Error(message)
      },
      apply() {
        throw new Error(message)
      },
    }
  )
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMissingConfigProxy()
