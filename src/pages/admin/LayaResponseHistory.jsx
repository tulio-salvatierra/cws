import { useEffect, useId, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const types = { decision_review: 'Decision', goal_pace: 'Goal pace', deal_fit: 'Deal fit' }

export default function LayaResponseHistory({ history }) {
  const [state, setState] = useState({ pages: [history], index: 0, filter: 'all', response: 'all', from: '', to: '', search: '' })
  const [dates, setDates] = useState({ from: '', to: '' })
  const [search, setSearch] = useState('')
  const [validation, setValidation] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const sequence = useRef(0)
  const selectId = useId()
  useEffect(() => {
    sequence.current += 1
    setState({ pages: [history], index: 0, filter: 'all', response: 'all', from: '', to: '', search: '' })
    setFailure(null); setBusy(false); setDates({ from: '', to: '' }); setValidation(''); setSearch('')
    return () => { sequence.current += 1 }
  }, [history])
  if (!history?.can_view) return null
  const page = state.pages[state.index]
  const items = page?.items || []
  async function load(type, cursor = null, reset = false, selected = { response: state.response, from: state.from, to: state.to, search: state.search }) {
    const request = ++sequence.current
    setBusy(true); setFailure(null); setValidation('')
    try {
      const { data } = await supabase.auth.getSession()
      const params = new URLSearchParams({ view: 'laya_history', type })
      if (selected.response !== 'all') params.set('response', selected.response)
      if (selected.from) params.set('from', selected.from)
      if (selected.to) params.set('to', selected.to)
      if (selected.search) params.set('search', selected.search)
      if (cursor) params.set('cursor', cursor)
      const result = await fetch(`/api/ceo-today?${params}`, { headers: { Authorization: `Bearer ${data.session?.access_token || ''}` } })
      const payload = await result.json()
      if (request !== sequence.current) return
      if (!result.ok || !payload.laya_response_history?.available) throw new Error(payload.error || 'Response history could not load.')
      const next = payload.laya_response_history
      setState(previous => reset ? { pages: [next], index: 0, filter: type, ...selected }
        : { ...previous, pages: [...previous.pages.slice(0, previous.index + 1), next], index: previous.index + 1 })
      if (reset) { setDates({ from: selected.from, to: selected.to }); setSearch(selected.search || '') }
    } catch (error) {
      if (request === sequence.current) setFailure({ message: error.message || 'Response history could not load.', type, cursor, reset, selected })
    } finally { if (request === sequence.current) setBusy(false) }
  }
  return <section aria-label="Laya response history" className="mt-8 rounded-xl border border-sky-300/20 p-5">
    <h2 className="text-xl font-semibold">Laya response history</h2>
    <p className="mt-2 text-sm text-gray-400">Owner-only saved responses. Responses record intent; decision activation remains separate.</p>
    {failure && <div role="alert" className="mt-3 text-amber-200">{failure.message} The displayed page has not changed. {page?.available !== false && <button type="button" disabled={busy} onClick={() => load(failure.type, failure.cursor, failure.reset, failure.selected)}>Retry history</button>}</div>}
    {page?.available === false ? <div className="mt-3 text-amber-200"><p role="alert">Response history is unavailable.</p><button type="button" disabled={busy} onClick={() => load('all', null, true)}>Retry history</button></div> : <>
      <label htmlFor={selectId} className="mt-4 block text-sm">Review type</label><select id={selectId} disabled={busy} value={state.filter} onChange={event => load(event.target.value, null, true)} className="mt-2 rounded bg-gray-800 p-2">
        <option value="all">All types</option>
        {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <label htmlFor={`${selectId}-response`} className="mt-3 block text-sm">Response</label><select id={`${selectId}-response`} disabled={busy} value={state.response} onChange={event => load(state.filter, null, true, { response: event.target.value, from: state.from, to: state.to, search: state.search })} className="ml-3 rounded bg-gray-800 p-2">
        <option value="all">All responses</option><option value="act">Act</option><option value="dismiss">Dismiss</option>
      </select>
      <form className="mt-3 flex flex-wrap items-end gap-3 text-sm" onSubmit={event => {
        event.preventDefault()
        load(state.filter, null, true, { response: state.response, from: state.from, to: state.to, search: search.trim() })
      }}>
        <label>Search saved reason or subject<input type="search" maxLength={80} disabled={busy} value={search} onChange={event => setSearch(event.target.value)} className="mt-1 block rounded bg-gray-800 p-2" /></label>
        <button disabled={busy} className="p-2 text-sky-200">Search history</button>
      </form>
      <p className="mt-2 text-xs text-gray-400">Case-insensitive literal text, up to 80 characters. Searches saved reasons, subject IDs/types, decision titles/text, lead names/companies, and agreement product names. Select Search history to apply.</p>
      <form className="mt-3 flex flex-wrap items-end gap-3 text-sm" onSubmit={event => {
        event.preventDefault()
        if (dates.from && dates.to && dates.from > dates.to) { setValidation('Start date must be on or before end date.'); return }
        load(state.filter, null, true, { response: state.response, ...dates, search: state.search })
      }}>
        <label>Saved from (Chicago)<input type="date" disabled={busy} value={dates.from} onChange={event => { setDates(previous => ({ ...previous, from: event.target.value })); setValidation('') }} className="mt-1 block rounded bg-gray-800 p-2" /></label>
        <label>Saved through (Chicago)<input type="date" disabled={busy} value={dates.to} onChange={event => { setDates(previous => ({ ...previous, to: event.target.value })); setValidation('') }} className="mt-1 block rounded bg-gray-800 p-2" /></label>
        <button disabled={busy} className="p-2 text-sky-200">Apply dates</button>
        <button disabled={busy} type="button" className="p-2 text-sky-200" onClick={() => load('all', null, true, { response: 'all', from: '', to: '', search: '' })}>Clear filters</button>
      </form>
      <p className="mt-2 text-xs text-gray-400">Dates include the full saved-response day in Chicago time. Leave either date blank for an open range; select Apply dates to apply.</p>
      {validation && <p role="alert" className="mt-2 text-amber-200">{validation}</p>}
      <p className="mt-2 text-xs text-gray-400">Page {state.index + 1} · {items.length} responses · {types[state.filter] || 'All types'} · {state.response === 'all' ? 'All responses' : state.response === 'act' ? 'Act' : 'Dismiss'} · {state.from || 'Any start'} through {state.to || 'Any end'} (Chicago) · Search: {state.search || 'Any text'} · Newest first. Up to 30 per page.</p>
      {!items.length && <p className="mt-3 text-sm">{state.filter === 'all' && state.response === 'all' && !state.from && !state.to && !state.search ? 'No saved Laya responses yet.' : 'No saved responses match these filters.'}</p>}
      {items.map(row => <article key={row.id} className="mt-4 border-t border-gray-700 pt-4">
        <h3 className="font-semibold">{types[row.evaluator] || row.evaluator} · {row.response === 'act' ? 'Act' : 'Dismiss'}</h3>
        <p className="mt-1 text-xs text-gray-400">{row.created_at} · {row.subject_type || 'business_decision'} · {row.subject_id || row.decision_id}</p>
        <p className="mt-2 text-sm whitespace-pre-wrap">Saved subject: {[row.input_snapshot?.decision?.title, row.input_snapshot?.decision?.decision, row.input_snapshot?.inputs?.lead?.name, row.input_snapshot?.inputs?.lead?.company, row.input_snapshot?.inputs?.agreement?.product_name].filter(Boolean).join(' · ') || row.subject_id || row.decision_id}</p>
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
