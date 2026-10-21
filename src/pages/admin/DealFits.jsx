import DealBudget from './DealBudget'
import { Link } from 'react-router-dom'

export default function DealFits({summary,canManage,onReload}) {
  return <section aria-label="Negocio Listo deal fit" className="mt-7 rounded-2xl border border-indigo-400/30 p-5">
    <h2 className="text-lg font-semibold text-white">Negocio Listo · Deal fit</h2>
    <p className="mt-2 text-sm text-gray-400">Laya checks recorded terms against the $50/hour floor, $300 setup baseline and capacity evidence. Advisory only; this never accepts a deal or activates a decision.</p>
    {!summary.available && <p className="mt-3 text-amber-200">Deal records are unavailable or incomplete. Other priorities are unaffected.</p>}
    {summary.available && !summary.items.length && <p className="mt-3 text-gray-400">No recorded Negocio Listo inquiries or agreements to evaluate.</p>}
    {summary.items.map(item=><article key={item.id} className="mt-4 border-t border-gray-800 pt-4">
      <h3 className="font-semibold text-white">{item.title}</h3>
      <p className="mt-1 text-sm text-amber-200">Laya · {item.evaluation.verdict.replaceAll('_',' ')} · {item.evaluation.business_date} (Chicago)</p>
      <ul className="mt-3 space-y-2 text-sm text-gray-300">{item.evaluation.checks.map(check=><li key={check.key}><strong>{check.label} · {check.status.replaceAll('_',' ')}</strong><p>{check.detail}</p>{check.gross_hour_ceiling!=null && <p>Gross upper bound before costs: {check.gross_hour_ceiling} total hours for the recorded term. This does not establish affordability.</p>}</li>)}</ul>
      <p className="mt-3 text-sm text-gray-300">{item.evaluation.next_action}</p>
      <Link to={item.href} className="mt-3 inline-block text-sm text-indigo-300">Review source records</Link>
      <details className="mt-3 text-xs text-gray-400"><summary>Deal-fit sources and missing data</summary>
        {item.evaluation.policy_sources.map(source=><p key={source.section}>{source.document} §{source.section} · {source.rule}</p>)}
        <ul className="mt-2 list-disc pl-5">{item.evaluation.missing_data.map(text=><li key={text}>{text}</li>)}</ul>
        {item.evaluation.why.map((item,index)=><p key={index} className="mt-2 break-words">{item.claim} {item.source.table} · {item.source.id} · {Object.entries(item.source.fields).map(([key,value])=>`${key}: ${value ?? 'not recorded'}`).join(' · ')}</p>)}
      </details>
      {canManage && item.agreement && <DealBudget key={`${item.id}:${item.budget?.revision || 'new'}`} item={item} workspaceId={summary.workspace_id} today={summary.today} onReload={onReload} />}
    </article>)}
  </section>
}
