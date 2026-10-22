import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function TestLeadControls({ leads = [], workspaceId, canManage = false, onReload }) {
  const [selected, setSelected] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  if (!canManage) return null
  const lead = leads.find(row => row.id === selected)
  const excluded = leads.filter(row => row.is_test === true)
  async function save(event) {
    event.preventDefault()
    if (!lead || !reason.trim() || busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await supabase.from('leads').update({ is_test: lead.is_test !== true, test_record_reason: reason.trim() })
        .eq('id', lead.id).eq('workspace_id', workspaceId).eq('is_test', lead.is_test === true).select('id')
      if (result.error) throw result.error
      if (!result.data?.length) throw new Error('The classification changed or owner access is unavailable. Reload Sales and review again.')
      setSelected(''); setReason(''); setMessage('Test classification saved. Existing records and saved responses were preserved.')
      await onReload()
    } catch (failure) { setError(failure.message || 'Test classification could not be saved.') }
    finally { setBusy(false) }
  }
  return <section aria-label="Owner test lead controls" className="mt-8 rounded-2xl border border-amber-300/30 p-5">
    <h2 className="text-lg font-semibold">Owner · Test lead exclusion</h2>
    <p className="mt-2 text-sm text-slate-300">Explicitly exclude a test lead from Sales priorities, progress counts, CEO Today, and Laya lifecycle/deal-fit advice. Names never set this flag automatically. Restoring a lead recalculates live advice. Sends, promised actions, lead details and saved Laya history stay intact. This does not activate a decision or block a separately confirmed send elsewhere.</p>
    {message && <p role="status" className="mt-3 text-emerald-200">{message}</p>}
    {error && <p role="alert" className="mt-3 text-rose-200">{error}</p>}
    <p className="mt-3 text-sm">{excluded.length} test leads excluded.</p>
    {excluded.map(row => <div key={row.id} className="mt-3 border-t border-white/10 pt-3 text-sm"><h3>{row.company || row.name || row.id}</h3><p>Reason: {row.test_record_reason}</p><p className="break-all text-slate-400">Recorded by {row.test_record_by} · {row.test_record_at}</p></div>)}
    <form onSubmit={save} className="mt-4 space-y-3">
      <label className="block">Lead<select disabled={busy} aria-label="Test classification lead" value={selected} onChange={event => { setSelected(event.target.value); setReason(''); setMessage(''); setError('') }} className="ml-2 rounded bg-slate-800 p-2"><option value="">Choose lead</option>{leads.map(row => <option key={row.id} value={row.id}>{row.company || row.name || row.id}{row.is_test ? ' · excluded test' : ''}</option>)}</select></label>
      {lead && <>
        <p>{lead.is_test ? 'Restore this lead to live priorities and advice?' : 'Exclude this lead as a test record?'}</p>
        <label className="block">Classification reason<textarea required maxLength={2000} disabled={busy} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 block w-full rounded bg-slate-800 p-2" /></label>
        <button disabled={busy || !reason.trim()} className="rounded border border-amber-300/50 px-3 py-2">{lead.is_test ? 'Restore live lead' : 'Exclude test lead'}</button>
      </>}
    </form>
  </section>
}
