import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const departmentNavigation = [
  ['Sales', 'Work the full Sales command queue and prospects.', '/admin/sales'],
  ['Marketing', 'Review weekly publishing and its durable history.', '/admin/marketing'],
  ['Operations', 'Review active client work, readiness, and delivery blockers.', '/admin/operations'],
  ['Accounting', 'Review expected, received, and outstanding money.', '/admin/accounting'],
  ['Compliance', 'Review owner-verified business obligations and deadlines.', '/admin/compliance'],
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

      <section className="mt-7 rounded-2xl border border-indigo-400/30 bg-gray-900/60 p-5" aria-label="Marketing content reviews">
        <h2 className="text-lg font-semibold text-white">Marketing · Content reviews</h2>
        {ceo?.laya_reviews?.available === false && <p className="mt-2 text-sm text-amber-200">Assessment history is unavailable. Your other priorities are unaffected.</p>}
        {!!ceo?.laya_reviews?.pending?.length && <p className="mt-2 text-sm text-gray-300">{ceo.laya_reviews.pending.length} awaiting your review among the latest 100 assessments.</p>}
        {(ceo?.laya_reviews?.pending || []).slice(0, 3).map(run => <Link key={run.id} to={`/admin/marketing#laya-run-${run.id}`} className="mt-3 block text-sm text-indigo-300">Review: {run.title}{!run.available ? ' — automated check unavailable' : ''}</Link>)}
        <Link to="/admin/marketing#laya-assessments" className="mt-4 inline-block text-sm font-semibold text-indigo-300">Evaluate content in Marketing →</Link>
        <p className="mt-2 text-xs text-gray-500">Human review only. Laya does not approve or publish content.</p>
      </section>

      <section className="mt-10 border-t border-gray-800 pt-8" aria-labelledby="departments-heading">
        <h2 id="departments-heading" className="text-lg font-semibold text-white">Departments</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {departmentNavigation.map(([title, description, href]) => <Link key={href} to={href} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 transition hover:border-indigo-500">
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
