import { Link } from 'react-router-dom'
import LayaOwnerResponse from './LayaOwnerResponse'

export default function LifecycleReviews({ summary, onReload }) {
  return <section aria-label="Negocio Listo lifecycle" className="mt-7 rounded-2xl border border-emerald-400/30 p-5">
    <h2 className="text-lg font-semibold text-white">Negocio Listo lifecycle</h2>
    <p className="mt-2 text-xs text-gray-400">Derived for {summary.today} · Chicago time. Laya is advisory; no stages, payments or launches are changed automatically.</p>
    {summary.available === false && <p className="mt-2 text-amber-200">Lifecycle records are unavailable. Other priorities are unaffected.</p>}
    {summary.available && !summary.items.length && <p className="mt-2 text-sm text-gray-400">No Negocio Listo inquiries or recorded agreements in this workspace.</p>}
    {summary.items.map(item => <article key={item.id} className="mt-4 border-t border-gray-800 pt-3">
      <p className="text-xs text-emerald-200">{item.stage.replaceAll('_', ' ')}</p>
      <h3 className="mt-1 font-semibold text-white">{item.title}</h3>
      <p className="mt-2 text-sm text-gray-300">{item.why_now}</p>
      {item.evaluation && <>
        <p className="mt-2 text-sm text-sky-200">Laya · {item.evaluation.verdict.replaceAll('_', ' ')} · {item.evaluation.business_date} (Chicago)</p>
        <p className="mt-2 text-sm">{item.evaluation.next_action}</p>
        {!!item.evaluation.missing_data.length && <ul className="mt-2 list-disc pl-5 text-sm text-amber-200">{item.evaluation.missing_data.map(text => <li key={text}>{text}</li>)}</ul>}
      </>}
      <Link to={item.href} className="mt-2 inline-block text-sm text-emerald-200">{item.cta_label}</Link>
      <details className="mt-2 text-xs text-gray-400"><summary>Lifecycle source evidence</summary>
        {item.evaluation ? <>
          <p>{item.evaluation.policy_version} · {item.evaluation.evaluated_at}</p>
          {item.evaluation.why.map((claim, index) => <div key={index} className="mt-2 break-words"><p>{claim.claim} {claim.source.table} · {claim.source.id} · Workspace {claim.source.workspace_id}</p><pre className="max-h-80 overflow-auto whitespace-pre-wrap">{JSON.stringify(claim.source.fields, null, 2)}</pre></div>)}
          {item.evaluation.assumptions.map(text => <p key={text} className="mt-2">{text}</p>)}
        </> : item.sources.map((source, index) => <p key={index}>{source.table} · {source.id}</p>)}
      </details>
      <LayaOwnerResponse key={item.owner_response?.review_token || item.id} review={item.owner_response} label="Lifecycle" onReload={onReload} />
    </article>)}
  </section>
}
