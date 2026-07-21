// Supabase is temporarily disabled so the app can build and deploy without
// requiring VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY or the
// `@supabase/supabase-js` runtime.
//
// This module exposes a no-op stub that mimics the shape of the Supabase
// client so existing consumers (auth, drafts, keywords, analytics, calendar)
// keep rendering without crashing. All reads resolve to empty data and all
// writes/auth calls resolve without performing anything.
//
// To re-enable Supabase, restore the previous implementation from git history
// (it imported `createClient` from '@supabase/supabase-js').

export const isSupabaseConfigured = false

const emptyResult = { data: [], error: null }

// A chainable, awaitable query builder. Every method returns the same builder,
// and awaiting it (or calling `.then`) resolves to `{ data: [], error: null }`.
function createQueryBuilder() {
  const builder = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve) => resolve(emptyResult)
        }
        return () => builder
      },
    }
  )
  return builder
}

function createChannel() {
  const channel = {
    on: () => channel,
    subscribe: () => channel,
    unsubscribe: () => {},
  }
  return channel
}

const auth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe() {} } },
  }),
  signInWithPassword: async () => ({
    data: { session: null, user: null },
    error: { message: 'Supabase is disabled in this build.' },
  }),
  signOut: async () => ({ error: null }),
}

const storage = {
  from: () => ({
    upload: async () => ({ data: null, error: null }),
    remove: async () => ({ data: null, error: null }),
    list: async () => ({ data: [], error: null }),
    createSignedUrl: async () => ({ data: null, error: null }),
    getPublicUrl: () => ({ data: { publicUrl: '' } }),
  }),
}

export const supabase = {
  auth,
  storage,
  from: () => createQueryBuilder(),
  rpc: () => createQueryBuilder(),
  channel: () => createChannel(),
  removeChannel: () => {},
}
