import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PriorityEvaluation from './PriorityEvaluation'

export default function NextMoveControls({ item, onReload }) {
  const [closing, setClosing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [handoff, setHandoff] = useState(false)
  const [scope, setScope] = useState(item.scope_evidence || { agreement_reference: '', request: '', inclusion: 'unknown', revisions_used: null, revision_allowance: null, estimated_hours: null, proposed_fee_cents: null })
  async function save(choice, extra = {}) {
    setBusy(true); setError(''); setNotice('')
    try {
      const { data } = await supabase.auth.getSession()
      const response = await fetch('/api/ceo-today', { method: 'POST', headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'next_move_choice', choice, review_token: item.move_token, ...extra }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Choice could not be saved.')
      setClosing(false)
      if (choice === 'handoff') setHandoff(true)
      setNotice(choice === 'do' ? 'Intent recorded. Open the department below to carry out the work.' : 'Choice saved.')
      try { await onReload() } catch { setError('Choice saved, but the board could not reload. Refresh before another choice.') }
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const disabled = busy || !item.move_token
  return <div className="mt-4 space-y-3">
    {item.scope_check?.status === 'likely_scope_change' && <p className="text-sm text-amber-200">Likely scope change · Review the agreement before saying yes.</p>}
    {item.scope_check?.below_floor && <p className="text-sm text-amber-200">Recorded fee and effort fall below $50/hour. Review before agreeing.</p>}
    <div className="flex flex-wrap items-start gap-3">
      <button disabled={disabled} className="rounded-lg bg-indigo-500 px-4 py-2 text-white disabled:opacity-50" onClick={() => save('do')}>Do it now</button>
      <button disabled={disabled} className="rounded-lg border border-gray-600 px-4 py-2 text-gray-200 disabled:opacity-50" onClick={() => save('later')}>Later (2 days)</button>
      <details className="min-w-0 flex-1 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300">
        <summary className="cursor-pointer">More</summary>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            <button disabled={disabled} onClick={() => save('handoff')}>Hand to Claude</button>
            <button disabled={disabled} onClick={() => setClosing(true)}>Close task</button>
            <button disabled={disabled} onClick={() => save('drop')}>Drop</button>
          </div>
          <p className="text-xs text-gray-400">Choices apply to this recommendation. Completing the underlying work still happens in its department. No message, charge, publish, or client commitment runs here.</p>
          <Link className="inline-block text-indigo-300" to={item.href}>{item.cta_label}</Link>
          {item.next_move?.source && <details><summary>Source fields for this why</summary><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify({ template: item.next_move.why.template, fields: item.next_move.fields, source: item.next_move.source, due_source: item.next_move.due_source, action_source: item.next_move.action_source }, null, 2)}</pre></details>}
          <details>
            <summary>Scope and $50/hour check</summary>
            <p className="my-3 text-xs text-gray-400">Compare the actual request with the agreement. An addition is a new page, function, deliverable, or recurring responsibility outside the agreement. Unknown fields stay unknown.</p>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); save('scope', { scope }) }}>
              {[['agreement_reference', 'Agreement reference / agreed deliverables'], ['request', 'Client request']].map(([key, label]) => <label key={key} className="block">{label}<textarea required maxLength={key === 'request' ? 2000 : 1000} className="mt-1 block w-full rounded bg-gray-800 p-2" value={scope[key]} onChange={e => setScope({ ...scope, [key]: e.target.value })} /></label>)}
              <label className="block">Agreement comparison<select className="ml-2 rounded bg-gray-800 p-2" value={scope.inclusion} onChange={e => setScope({ ...scope, inclusion: e.target.value })}><option value="unknown">Not verified</option><option value="addition">Addition beyond agreed scope</option><option value="revision">Revision to an agreed deliverable</option></select></label>
              {[['revisions_used', 'Revisions already used'], ['revision_allowance', 'Agreed revision allowance'], ['estimated_hours', 'Estimated additional whole hours'], ['proposed_fee_cents', 'Owner-proposed fee ($, optional)']].map(([key, label]) => <label key={key} className="block">{label}<input type="number" min="0" max="100000000" step={key === 'proposed_fee_cents' ? '0.01' : '1'} className="mt-1 block rounded bg-gray-800 p-2" value={scope[key] == null ? '' : key === 'proposed_fee_cents' ? scope[key] / 100 : scope[key]} onChange={e => setScope({ ...scope, [key]: e.target.value === '' ? null : key === 'proposed_fee_cents' ? Math.round(Number(e.target.value) * 100) : Number(e.target.value) })} /></label>)}
              <p>{item.scope_check?.text}</p><p className="text-xs text-gray-400">{item.scope_check?.note}</p>
              <button disabled={disabled} className="rounded border border-indigo-400 px-3 py-2">Save scope evidence</button>
            </form>
          </details>
          <PriorityEvaluation item={item} onReload={onReload} />
        </div>
      </details>
    </div>
    {closing && <div role="group" aria-label="Did it work?" className="rounded-lg border border-gray-700 p-4">
      <p className="text-gray-100">Did it work?</p>
      <div className="mt-3 flex flex-wrap gap-4">{[['yes','Yes'],['no','No'],['not_yet','Not yet'],['skip','Skip']].map(([value,label]) => <button disabled={disabled} key={value} onClick={() => save('close', { outcome: value })}>{label}</button>)}<button disabled={busy} onClick={() => setClosing(false)}>Cancel</button></div>
    </div>}
    {handoff && <div className="rounded-lg border border-gray-700 p-3"><p>Copy this handoff into Claude:</p><textarea readOnly aria-label="Claude handoff" className="mt-2 min-h-32 w-full rounded bg-gray-800 p-2" value={`${item.human_action}\nWhy: ${item.next_move.why.text}\nSource: ${JSON.stringify(item.next_move.source)}\nPrepare work for owner review. Do not send, publish, charge, or commit to the client.`} /></div>}
    {notice && <p role="status" className="text-sm text-emerald-200">{notice}</p>}
    {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
  </div>
}

export function MoveReview({ review }) {
  if (!review) return null
  return <details className="mt-7 rounded-xl border border-gray-700 p-5 text-sm text-gray-300">
    <summary className="cursor-pointer font-semibold">Laya · Last 30 days</summary>
    {!review.available ? <p className="mt-3">Choice history is unavailable. No acceptance or outcome totals can be shown.</p> : <>
      <p className="mt-3">Counts reflect recorded clicks, grouped by rule. Acceptance = Do it now ÷ (Do it now + Drop). Later is separate. Only the latest closing outcome per card/rule is counted. Not yet keeps the recommendation available for a later outcome; Skip is excluded from outcome judgments. Older Act/Dismiss responses remain in their existing history.</p>
      {!review.groups?.length && <p className="mt-3">No classified recommendation choices recorded in this window.</p>}
      <div className="mt-3 overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Rule','Accepted','Dropped','Later','Acceptance','Yes','No','Pending','Skip'].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{review.groups?.map(g => <tr key={g.rule}>{[({urgent_deadline:'Urgent deadline',money_follow_up:'Money follow-up',marketing_action:'Marketing action',delivery_blocker:'Delivery blocker'}[g.type] || 'Unclassified') + ' · V1',g.accepted,g.dropped,g.deferred,g.acceptance === null ? 'No decisions' : `${(100*g.acceptance).toFixed(1)}%`,g.yes,g.no,g.pending,g.skipped].map((v,i) => <td key={i} className="p-2">{v}</td>)}</tr>)}</tbody></table></div>
      <p className="mt-4">Review repeated Drops and No outcomes. Check timing, eligibility, and missing evidence. Change one rule, record its date, then review the next 30 days. Rules never change automatically.</p>
    </>}
  </details>
}
