import LayaOwnerResponse from './LayaOwnerResponse'

export default function PriorityEvaluation({item,onReload}) {
  const evaluation=item.evaluation
  if(!evaluation)return null
  return <section aria-label="Laya priority evaluation" className="mt-4 rounded-xl border border-sky-300/20 p-3 text-sm">
    <p className="font-semibold text-sky-200">Laya · {evaluation.verdict.replaceAll('_',' ')}</p>
    <p className="mt-2 text-gray-200">{evaluation.next_action}</p>
    {evaluation.missing_data?.map(text=><p key={text} className="mt-2 text-amber-200">{text}</p>)}
    <details className="mt-3 text-xs text-gray-400"><summary>Priority source evidence</summary>
      <p>{evaluation.policy_version} · {evaluation.business_date} · {evaluation.time_zone}</p>
      {evaluation.why.map((claim,index)=><div key={index} className="mt-3"><p>{claim.claim}</p><p>{claim.source.table} · {claim.source.id} · Workspace {claim.source.workspace_id} · Version {claim.source.version || 'not recorded'}</p><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(claim.source.fields,null,2)}</pre></div>)}
      {evaluation.policy_sources?.map((source,index)=><p key={index} className="mt-2">Policy: {source.document} {source.section ? `§${source.section}` : source.rule}</p>)}
      {evaluation.assumptions.map(text=><p key={text} className="mt-2">{text}</p>)}
    </details>
    <LayaOwnerResponse key={item.owner_response?.review_token || item.id} review={item.owner_response} label="Priority" onReload={onReload} />
  </section>
}
