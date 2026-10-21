import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function BusinessDecisions({ summary, onReload }) {
  const [editing, setEditing] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [responding, setResponding] = useState(null)
  const [responseNotice, setResponseNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!summary) return null

  async function save(row, changes) {
    setBusy(true)
    setError('')
    try {
      const result = await supabase.from('business_decisions').update(changes)
        .eq('id', row.id).eq('workspace_id', row.workspace_id).eq('updated_at', row.updated_at).select('id')
      if (result.error) throw result.error
      if (!result.data?.length) throw new Error('The decision changed or you no longer have owner access. Reload and review again.')
      setEditing(null)
      setConfirmation(null)
      await onReload()
    } catch (saveError) { setError(saveError.message || 'The decision could not be saved.') }
    finally { setBusy(false) }
  }

  async function recordResponse(event) {
    event.preventDefault()
    if (!responding.reason.trim()) { setError('Enter a reason before saving your response.'); return }
    setBusy(true)
    setError('')
    setResponseNotice('')
    try {
      const { data } = await supabase.auth.getSession()
      const result = await fetch('/api/ceo-today', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'laya_response', response: responding.response, reason: responding.reason, review_token: responding.token }),
      })
      const payload = await result.json()
      if (!result.ok) throw new Error(payload.error || 'Your response could not be saved.')
      setResponding(null)
      setResponseNotice('Response saved. The decision was not changed.')
      try { await onReload() } catch { setError('Response saved, but history could not reload. Reload CEO Today to see it.') }
    } catch (saveError) { setError(saveError.message || 'Your response could not be saved.') }
    finally { setBusy(false) }
  }

  return <section id="business-decisions" aria-label="Business decisions" className="mt-7 rounded-2xl border border-indigo-400/30 bg-gray-900/60 p-5">
    <h2 className="text-lg font-semibold text-white">Business decisions</h2>
    <p className="mt-2 text-sm text-gray-300">{summary.due_count || 0} due for review. Only active decisions bind the business; only you can activate them.</p>
    <p className="mt-2 text-xs text-gray-400">Review dates use Chicago time. Read each revisit condition and record when it occurs.</p>
    {summary.available === false && <p className="mt-3 text-amber-200">Business decisions are unavailable. Reload to try again.</p>}
    {responseNotice && <p role="status" className="mt-3 text-sky-200">{responseNotice}</p>}
    {summary.can_manage && summary.response_history_available === false && <p className="mt-3 text-amber-200">Response history is unavailable. Reload to try again.</p>}
    {error && <p role="alert" className="mt-3 text-rose-200">{error}</p>}
    {(summary.items || []).map(row => <article id={`business-decision-${row.id}`} key={row.id} className="mt-4 rounded-xl border border-gray-700 p-4">
      <p className="text-xs uppercase text-indigo-200">{row.status}{row.review_due ? ' · Review due' : ''}</p>
      <h3 className="mt-2 font-semibold text-white">{row.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{row.decision}</p>
      {row.context && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-400">Context: {row.context}</p>}
      <p className="mt-2 text-sm text-gray-400">Review by: {row.review_by || 'Not set'} · Revisit: {row.revisit_condition || 'Not set'}</p>
      {row.evaluation && <DecisionEvaluation evaluation={row.evaluation} />}
      {summary.can_manage && row.review_token && <div className="mt-3 flex gap-4 text-sm text-sky-200">
        {['act', 'dismiss'].map(response => <button key={response} disabled={busy} onClick={() => { setResponding({ id: row.id, response, reason: '', token: row.review_token }); setConfirmation(null); setEditing(null); setError(''); setResponseNotice('') }}>{response === 'act' ? 'Act' : 'Dismiss'}</button>)}
      </div>}
      {responding?.id === row.id && <form aria-label="Laya owner response" className="mt-3 space-y-3 rounded-xl border border-sky-300/20 p-3" onSubmit={recordResponse}>
        <p className="text-sm text-gray-200">Record {responding.response === 'act' ? 'Act' : 'Dismiss'} for this evaluation. This saves your response and the reviewed evidence; it does not activate or edit the decision.</p>
        <label className="block text-sm text-gray-200">Reason<textarea required maxLength={2000} value={responding.reason} onChange={event => setResponding({ ...responding, reason: event.target.value })} className="mt-2 block w-full rounded bg-gray-800 p-2" /></label>
        <button disabled={busy} className="mr-4 text-sm text-sky-200">Save {responding.response === 'act' ? 'Act' : 'Dismiss'} response</button>
        <button type="button" disabled={busy} onClick={() => setResponding(null)} className="text-sm text-gray-400">Cancel response</button>
      </form>}
      {!!row.responses?.length && <details className="mt-4 text-sm text-gray-300">
        <summary className="cursor-pointer">Saved responses ({row.responses.length} among the latest 30)</summary>
        {row.responses.map(item => <div key={item.id} className="mt-3 border-t border-gray-700 pt-3">
          <p>{item.response === 'act' ? 'Act' : 'Dismiss'} · {item.created_at}</p>
          <p className="mt-1 whitespace-pre-wrap">Reason: {item.reason}</p>
          <details className="mt-2"><summary className="cursor-pointer">Reviewed snapshot and evaluation</summary>
            <p className="mt-2 whitespace-pre-wrap">{item.input_snapshot.decision.title}: {item.input_snapshot.decision.decision}</p>
            <p>Status at review: {item.input_snapshot.decision.status} · Review by: {item.input_snapshot.decision.review_by || 'Not set'} · Revisit: {item.input_snapshot.decision.revisit_condition || 'Not set'}</p>
            <DecisionEvaluation evaluation={item.evaluation} />
          </details>
        </div>)}
      </details>}
      {!row.evaluation && row.review_reasons?.map(reason => <p key={reason} className="mt-2 text-sm text-amber-200">{reason}</p>)}
      {summary.can_manage && ['proposed', 'active'].includes(row.status) && <div className="mt-3 flex flex-wrap gap-4 text-sm text-indigo-200">
        <button disabled={busy} onClick={() => { setEditing({ ...row }); setResponding(null); setConfirmation(null); setError('') }}>Edit review details</button>
        {row.status === 'proposed' && <button disabled={busy} onClick={() => { setConfirmation(row); setResponding(null); setEditing(null); setError('') }}>Review activation</button>}
        {row.status === 'active' && <button disabled={busy} onClick={() => save(row, { condition_observed_at: row.condition_observed_at ? null : new Date().toISOString() })}>{row.condition_observed_at ? 'Clear condition observation' : 'Record condition occurred'}</button>}
        <button disabled={busy} onClick={() => save(row, { status: row.status === 'active' ? 'superseded' : 'rejected' })}>{row.status === 'active' ? 'Supersede decision' : 'Reject proposal'}</button>
      </div>}
      {editing?.id === row.id && <form className="mt-4 space-y-3" onSubmit={event => { event.preventDefault(); void save(row, { review_by: editing.review_by || null, revisit_condition: editing.revisit_condition || null }) }}>
        <label className="block text-sm text-gray-200">Review by<input required type="date" value={editing.review_by || ''} onChange={e => setEditing({ ...editing, review_by: e.target.value })} className="ml-3 rounded bg-gray-800 p-2" /></label>
        {row.status === 'proposed' && <label className="block text-sm text-gray-200">Revisit condition<textarea required maxLength={2000} value={editing.revisit_condition || ''} onChange={e => setEditing({ ...editing, revisit_condition: e.target.value })} className="mt-2 block w-full rounded bg-gray-800 p-2" /></label>}
        <button disabled={busy} className="mr-4 text-sm text-indigo-200">Save review details</button>
        <button type="button" disabled={busy} className="text-sm text-gray-400" onClick={() => setEditing(null)}>Cancel</button>
      </form>}
      {confirmation?.id === row.id && <div role="group" aria-label={`Activate ${row.title}`} className="mt-4 border-t border-gray-700 pt-3 text-sm text-gray-200">
        <p>Activate “{row.title}” with the exact decision and review terms shown above? This makes it binding.</p>
        {(!row.review_by || !row.revisit_condition?.trim()) ? <p className="mt-2 text-amber-200">Set a review date and revisit condition before activation.</p> : <button disabled={busy} className="mt-3 mr-4 rounded bg-indigo-500 px-3 py-2 text-white" onClick={() => save(row, { status: 'active' })}>I activate this decision</button>}
        <button disabled={busy} onClick={() => setConfirmation(null)}>Cancel activation</button>
      </div>}
    </article>)}
    {summary.available && !summary.items?.length && <p className="mt-3 text-sm text-gray-400">No business decisions recorded.</p>}
  </section>
}

function DecisionEvaluation({ evaluation }) {
  return <div className="mt-4 rounded-xl border border-sky-300/20 bg-sky-300/5 p-3 text-sm">
    <p className="font-semibold text-sky-200">Laya · {evaluation.verdict.replaceAll('_', ' ')}</p>
    <p className="mt-2 text-gray-200">{evaluation.next_action}</p>
    {!!evaluation.missing_data.length && <p className="mt-2 text-amber-200">Missing or invalid data: {evaluation.missing_data.join(', ')}</p>}
    <details className="mt-3 text-gray-300">
      <summary className="cursor-pointer">Why · Source evidence</summary>
      <p className="mt-2 text-xs text-gray-400">{evaluation.policy_version} · {evaluation.business_date} · {evaluation.time_zone}</p>
      {evaluation.why.map((item, index) => <div key={index} className="mt-3">
        <p>{item.claim}</p>
        <a className="text-xs text-sky-200 underline" href={`#business-decision-${item.source.id}`}>Source: {item.source.table} · {item.source.id}</a>
        <dl className="mt-1 break-words text-xs text-gray-400">{Object.entries(item.source.fields).map(([field, value]) => <div key={field}><dt className="inline">{field}: </dt><dd className="inline">{value == null ? 'not recorded' : String(value)}</dd></div>)}</dl>
      </div>)}
      {evaluation.assumptions.map(item => <p key={item} className="mt-3 text-xs text-gray-400">{item}</p>)}
    </details>
    <p className="mt-3 text-xs text-gray-400">Advisory only. A review recommendation never activates or changes a decision.</p>
  </div>
}
