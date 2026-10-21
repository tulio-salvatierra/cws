import { useEffect, useId, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const types = { decision_review: 'Decision', goal_pace: 'Goal pace', deal_fit: 'Deal fit' }

export default function LayaResponseHistory({ history }) {
  const [state, setState] = useState({ pages: [history], index: 0, filter: 'all' })
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const sequence = useRef(0)
  const selectId = useId()
  useEffect(() => {
    sequence.current += 1
    setState({ pages: [history], index: 0, filter: 'all' })
    setFailure(null); setBusy(false)
    return () => { sequence.current += 1 }
  }, [history])
  if (!history?.can_view) return null
  const page = state.pages[state.index]
  const items = page?.items || []
  async function load(type, cursor = null, reset = false) {
    const request = ++sequence.current
    setBusy(true); setFailure(null)
    try {
      const { data } = await supabase.auth.getSession()
      const params = new URLSearchParams({ view: 'laya_history', type })
      if (cursor) params.set('cursor', cursor)
      const result = await fetch(`/api/ceo-today?${params}`, { headers: { Authorization: `Bearer ${data.session?.access_token || ''}` } })
      const payload = await result.json()
      if (request !== sequence.current) return
      if (!result.ok || !payload.laya_response_history?.available) throw new Error(payload.error || 'Response history could not load.')
      const next = payload.laya_response_history
      setState(previous => reset ? { pages: [next], index: 0, filter: type }
        : { ...previous, pages: [...previous.pages.slice(0, previous.index + 1), next], index: previous.index + 1 })
    } catch (error) {
      if (request === sequence.current) setFailure({ message: error.message || 'Response history could not load.', type, cursor, reset })
    } finally { if (request === sequence.current) setBusy(false) }
  }
  return <section aria-label="Laya response history" className="mt-8 rounded-xl border border-sky-300/20 p-5">
    <h2 className="text-xl font-semibold">Laya response history</h2>
    <p className="mt-2 text-sm text-gray-400">Owner-only saved responses. Responses record intent; decision activation remains separate.</p>
    {failure && <div role="alert" className="mt-3 text-amber-200">{failure.message} The displayed page has not changed. {page?.available !== false && <button type="button" disabled={busy} onClick={() => load(failure.type, failure.cursor, failure.reset)}>Retry history</button>}</div>}
    {page?.available === false ? <div className="mt-3 text-amber-200"><p role="alert">Response history is unavailable.</p><button type="button" disabled={busy} onClick={() => load('all', null, true)}>Retry history</button></div> : <>
      <label htmlFor={selectId} className="mt-4 block text-sm">Review type</label><select id={selectId} disabled={busy} value={state.filter} onChange={event => load(event.target.value, null, true)} className="mt-2 rounded bg-gray-800 p-2">
        <option value="all">All types</option>
        {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <p className="mt-2 text-xs text-gray-400">Page {state.index + 1} · {items.length} responses · {types[state.filter] || 'All types'} · Newest first. Up to 30 per page.</p>
      {!items.length && <p className="mt-3 text-sm">{state.filter === 'all' ? 'No saved Laya responses yet.' : 'No saved responses for this type.'}</p>}
      {items.map(row => <article key={row.id} className="mt-4 border-t border-gray-700 pt-4">
        <h3 className="font-semibold">{types[row.evaluator] || row.evaluator} · {row.response === 'act' ? 'Act' : 'Dismiss'}</h3>
        <p className="mt-1 text-xs text-gray-400">{row.created_at} · {row.subject_type || 'business_decision'} · {row.subject_id || row.decision_id}</p>
        <p className="mt-2 whitespace-pre-wrap">Reason: {row.reason}</p>
        <p className="mt-2 text-sm">Reviewed {row.evaluation?.policy_version} · {row.evaluation?.business_date} · {row.evaluation?.verdict?.replaceAll('_', ' ')}</p>
        <details className="mt-3 text-sm"><summary>Saved input snapshot and evaluation</summary><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify({ input_snapshot: row.input_snapshot, evaluation: row.evaluation }, null, 2)}</pre></details>
      </article>)}
      <nav aria-label="Laya history pages" className="mt-4 flex gap-4 text-sm text-sky-200">
        <button type="button" disabled={busy || state.index === 0} onClick={() => { setFailure(null); setState(previous => ({ ...previous, index: previous.index - 1 })) }}>Newer responses</button>
        <button type="button" disabled={busy || !page?.next_cursor} onClick={() => load(state.filter, page.next_cursor)}>Older responses</button>
      </nav>
    </>}
    {busy && <p role="status" className="mt-3 text-sm">Loading response history…</p>}
  </section>
}
