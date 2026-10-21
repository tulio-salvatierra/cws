import GoalEvidence from './GoalEvidence'
export default function GoalPace({ pace, canManage, onReload }) {
  return <section aria-label="Negocio Listo goal pace" className="mt-7 rounded-2xl border border-amber-400/30 bg-gray-900/60 p-5">
    <h2 className="text-lg font-semibold text-white">Negocio Listo · Goal pace</h2>
    <p className="mt-2 text-sm text-gray-200">Goal: {pace.goal.target} active subscriptions by {pace.goal.deadline} · Checkpoint: at least {pace.checkpoint.target} signed by {pace.checkpoint.deadline}.</p>
    <p className="mt-2 text-sm text-amber-200">Active: {pace.goal.recorded ?? 'unknown'} · Signed by checkpoint: {pace.checkpoint.recorded ?? 'unknown'} · Pace: {pace.verified ? 'verified counts; forecast unavailable' : 'needs data'}</p>
    <p className="mt-2 text-xs text-gray-400">As of {pace.business_date} · Chicago time. Recorded agreements: {pace.recorded_agreements ?? 'unavailable'} (not a signed or active count).</p>
    <p className="mt-2 text-xs text-gray-400">Goal deadline: {deadline(pace.goal.days_remaining)} · Checkpoint: {deadline(pace.checkpoint.days_remaining)}.</p>
    <p className="mt-3 text-sm text-gray-300">{pace.next_action}</p>
    <p className="mt-2 text-xs text-gray-400">{pace.forecast_note}</p>
    <details className="mt-3 text-xs text-gray-400"><summary>Goal sources and missing evidence</summary>
      <p className="mt-2">Approved product context: {pace.target_source.document} §{pace.target_source.section}, v{pace.target_source.version}. This does not activate a business decision.</p>
      <ul className="mt-2 list-disc pl-5">{pace.missing_data.map(item => <li key={item}>{item}</li>)}</ul>
      {pace.why.map(item => <p key={item.source.id} className="mt-2 break-words">{item.claim} {item.source.table} · {item.source.id} · {Object.entries(item.source.fields).map(([key,value]) => `${key}: ${value ?? 'not recorded'}`).join(' · ')}</p>)}
    </details>
    {canManage && <GoalEvidence pace={pace} onReload={onReload} />}
  </section>
}

function deadline(days) {
  return days < 0 ? `${Math.abs(days)} days past deadline` : days === 0 ? 'due today' : `${days} days remaining`
}
