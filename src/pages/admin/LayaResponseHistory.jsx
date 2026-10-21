import { useState } from 'react'

const types = { decision_review: 'Decision', goal_pace: 'Goal pace', deal_fit: 'Deal fit' }

export default function LayaResponseHistory({ history }) {
  const [filter, setFilter] = useState('all')
  if (!history?.can_view) return null
  const items = (history.items || []).filter(row => filter === 'all' || row.evaluator === filter)
  return <section aria-label="Laya response history" className="mt-8 rounded-xl border border-sky-300/20 p-5">
    <h2 className="text-xl font-semibold">Laya response history</h2>
    <p className="mt-2 text-sm text-gray-400">Owner-only saved responses. Responses record intent; decision activation remains separate.</p>
    {history.available === false ? <p role="alert" className="mt-3 text-amber-200">Response history is unavailable. Reload CEO Today to try again.</p> : <>
      <label className="mt-4 block text-sm">Review type<select value={filter} onChange={event => setFilter(event.target.value)} className="ml-3 rounded bg-gray-800 p-2">
        <option value="all">All types</option>
        {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <p className="mt-2 text-xs text-gray-400">Showing {items.length} matching responses among the latest {history.limit || 30} across Laya, newest first. Older responses remain saved.</p>
      {!items.length && <p className="mt-3 text-sm">{history.items?.length ? 'No matching responses in this history window.' : 'No saved Laya responses yet.'}</p>}
      {items.map(row => <article key={row.id} className="mt-4 border-t border-gray-700 pt-4">
        <h3 className="font-semibold">{types[row.evaluator] || row.evaluator} · {row.response === 'act' ? 'Act' : 'Dismiss'}</h3>
        <p className="mt-1 text-xs text-gray-400">{row.created_at} · {row.subject_type || 'business_decision'} · {row.subject_id || row.decision_id}</p>
        <p className="mt-2 whitespace-pre-wrap">Reason: {row.reason}</p>
        <p className="mt-2 text-sm">Reviewed {row.evaluation?.policy_version} · {row.evaluation?.business_date} · {row.evaluation?.verdict?.replaceAll('_', ' ')}</p>
        <details className="mt-3 text-sm"><summary>Saved input snapshot and evaluation</summary><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify({ input_snapshot: row.input_snapshot, evaluation: row.evaluation }, null, 2)}</pre></details>
      </article>)}
    </>}
  </section>
}
