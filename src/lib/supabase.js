import { createClient } from '@supabase/supabase-js'

let client = null

export function isSupabaseConfigured() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  )
}

function getClient() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url?.trim() || !key?.trim()) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time (Vercel → Settings → Environment Variables → Production).',
    )
  }

  if (!client) {
    client = createClient(url, key)
  }

  return client
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getClient()
      const value = instance[prop]
      return typeof value === 'function' ? value.bind(instance) : value
    },
  },
)
