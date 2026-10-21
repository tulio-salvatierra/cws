import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function BusinessDecisions({ summary, onReload }) {
  const [editing, setEditing] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
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

  return <section id="business-decisions" aria-label="Business decisions" className="mt-7 rounded-2xl border border-indigo-400/30 bg-gray-900/60 p-5">
    <h2 className="text-lg font-semibold text-white">Business decisions</h2>
    <p className="mt-2 text-sm text-gray-300">{summary.due_count || 0} due for review. Only active decisions bind the business; only you can activate them.</p>
    <p className="mt-2 text-xs text-gray-400">Review dates use Chicago time. Read each revisit condition and record when it occurs.</p>
    {summary.available === false && <p className="mt-3 text-amber-200">Business decisions are unavailable. Reload to try again.</p>}
    {error && <p role="alert" className="mt-3 text-rose-200">{error}</p>}
    {(summary.items || []).map(row => <article key={row.id} className="mt-4 rounded-xl border border-gray-700 p-4">
      <p className="text-xs uppercase text-indigo-200">{row.status}{row.review_due ? ' · Review due' : ''}</p>
      <h3 className="mt-2 font-semibold text-white">{row.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{row.decision}</p>
      {row.context && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-400">Context: {row.context}</p>}
      <p className="mt-2 text-sm text-gray-400">Review by: {row.review_by || 'Not set'} · Revisit: {row.revisit_condition || 'Not set'}</p>
      {row.review_reasons?.map(reason => <p key={reason} className="mt-2 text-sm text-amber-200">{reason}</p>)}
      {summary.can_manage && ['proposed', 'active'].includes(row.status) && <div className="mt-3 flex flex-wrap gap-4 text-sm text-indigo-200">
        <button disabled={busy} onClick={() => { setEditing({ ...row }); setConfirmation(null); setError('') }}>Edit review details</button>
        {row.status === 'proposed' && <button disabled={busy} onClick={() => { setConfirmation(row); setEditing(null); setError('') }}>Review activation</button>}
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
