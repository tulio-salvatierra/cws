import LayaOwnerResponse from './LayaOwnerResponse'

const VERDICTS = {
  do: { label: 'Recommended', tone: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' },
  hold: { label: 'Wait for now', tone: 'border-amber-300/25 bg-amber-300/10 text-amber-100' },
  needs_data: { label: 'Needs more information', tone: 'border-amber-300/25 bg-amber-300/10 text-amber-100' },
  skip: { label: 'Not recommended', tone: 'border-gray-500/40 bg-gray-500/10 text-gray-300' },
}

export default function PriorityEvaluation({ item, onReload }) {
  const evaluation = item.evaluation
  if (!evaluation) return null
  const verdict = VERDICTS[evaluation.verdict] || { label: 'Review needed', tone: 'border-gray-500/40 text-gray-300' }

  return <section aria-label="Laya priority evaluation" className="[&_p]:mb-0 mt-5 rounded-xl border border-sky-300/20 bg-sky-950/20 p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-sky-200">Laya’s recommendation</p>
      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${verdict.tone}`}>{verdict.label}</span>
    </div>

    <div className="mt-4 max-w-prose">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Next step</p>
      <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-gray-100">{evaluation.next_action}</p>
    </div>

    {!!evaluation.missing_data?.length && <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 sm:p-4">
      <p className="text-sm font-semibold text-amber-100">Before you act</p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-100/90">
        {evaluation.missing_data.map(text => <li key={text} className="whitespace-pre-wrap">{text}</li>)}
      </ul>
    </div>}

    <details className="mt-4 rounded-lg border border-gray-700/70 text-sm text-gray-300">
      <summary className="cursor-pointer px-3 py-3 font-medium text-sky-200">Why Laya reached this recommendation</summary>
      <div className="space-y-4 border-t border-gray-700/70 p-3 leading-6 sm:p-4">
        <p className="text-xs text-gray-400">Reviewed {evaluation.business_date} · {evaluation.time_zone} · {evaluation.policy_version}</p>
        {evaluation.why.map((claim, index) => <div key={index}>
          <p>{claim.claim}</p>
          <details className="mt-2 text-xs text-gray-400">
            <summary className="cursor-pointer py-1">Exact source record {index + 1}</summary>
            <p className="mt-2 break-words">{claim.source.table} · {claim.source.id} · Workspace {claim.source.workspace_id} · Version {claim.source.version || 'not recorded'}</p>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-950/60 p-3">{JSON.stringify(claim.source.fields, null, 2)}</pre>
          </details>
        </div>)}
        {evaluation.policy_sources?.map((source, index) => <p key={index} className="break-words text-xs text-gray-400">Policy: {source.document} {source.section ? `§${source.section}` : source.rule}</p>)}
        {evaluation.assumptions.map(text => <p key={text} className="text-sm text-gray-400">{text}</p>)}
      </div>
    </details>
    <LayaOwnerResponse key={item.owner_response?.review_token || item.id} review={item.owner_response} label="Priority" onReload={onReload} />
  </section>
}
