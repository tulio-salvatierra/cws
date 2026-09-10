import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const secondaryNavigation = [
  ['Workspace', 'Campaigns, variants, knowledge, and agent history.', '/admin/workspace'],
  ['Marketing', 'Review weekly publishing and its durable history.', '/admin/marketing'],
  ['Sales', 'Work the full Sales command queue and prospects.', '/admin/sales'],
  ['Clients', 'Open the separate client workspace.', '/admin/clients'],
]

async function loadCeoToday() {
  const { data } = await supabase.auth.getSession()
  const response = await fetch('/api/ceo-today', {
    headers: { Authorization: `Bearer ${data.session?.access_token || ''}` },
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'CEO Today could not load.')
  return payload
}

export default function AdminOverview() {
  const [ceo, setCeo] = useState(null)
  const [error, setError] = useState('')
  const [notNow, setNotNow] = useState(() => new Set())

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const next = await loadCeoToday()
        if (active) {
          setCeo(next)
          setError('')
        }
      } catch (loadError) {
        if (active) setError(loadError.message)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const actions = useMemo(
    () => (ceo?.actions || []).filter((item) => !notNow.has(item.id)),
    [ceo, notNow],
  )

  return <div className="p-6 md:p-10">
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold text-white">CEO Today</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">What should I work on right now?</p>

      {error && <p role="alert" className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
      {!error && !ceo && <p className="mt-6 text-sm text-gray-400">Loading today’s priorities…</p>}

      {ceo && <section className="mt-7 space-y-3" aria-label="CEO Today actions">
        {actions.map((item) => <CeoActionCard key={item.id} item={item} onNotNow={() => setNotNow((current) => new Set(current).add(item.id))} />)}
        {!actions.length && <p className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 text-sm text-gray-400">No further action is shown in this view. Reload to recalculate from current department state.</p>}
      </section>}

      <section className="mt-10 border-t border-gray-800 pt-8" aria-labelledby="other-workspaces-heading">
        <h2 id="other-workspaces-heading" className="text-lg font-semibold text-white">Other workspaces</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {secondaryNavigation.map(([title, description, href]) => <Link key={href} to={href} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 transition hover:border-indigo-500">
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-gray-400">{description}</p>
          </Link>)}
        </div>
      </section>
    </div>
  </div>
}

function CeoActionCard({ item, onNotNow }) {
  return <article className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 shadow-2xl shadow-black/10">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">{item.department} · {item.business_priority}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{item.human_action}</h2>
      </div>
      <button type="button" onClick={onNotNow} className="text-sm text-gray-400 transition hover:text-white">Not now</button>
    </div>
    <p className="mt-4 text-sm leading-6 text-gray-300"><span className="font-medium text-white">Why now:</span> {item.why_now}</p>
    <Link to={item.href} className="mt-5 inline-flex rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">{item.cta_label}</Link>
  </article>
}
