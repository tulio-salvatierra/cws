export default function LayaAdvisory({ assessment }) {
  if (!assessment || assessment.status === 'not_configured') return null
  if (!assessment.available) return <p className="mt-4 rounded-xl border border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-400">Laya advisory assessment unavailable. This does not affect owner review.</p>

  const answers = assessment.result?.answers || {}
  const forbiddenClaim = answers.forbidden_claim?.noul
  const briefFit = answers.brief_fit?.score
  const recommendation = answers.review_priority?.choice
  const confidence = answers.review_priority?.confidence

  return <section className="mt-5 rounded-2xl border border-sky-300/20 bg-sky-300/[0.04] p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Laya advisory · {assessment.policy_version}</p><div className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><p><span className="block text-slate-400">Forbidden claim</span><span className="font-semibold text-white">{typeof forbiddenClaim === 'number' ? `${Math.round(forbiddenClaim * 100)}%` : '—'}</span></p><p><span className="block text-slate-400">Brief fit</span><span className="font-semibold text-white">{typeof briefFit === 'number' ? `${briefFit.toFixed(2)} / 3` : '—'}</span></p><p><span className="block text-slate-400">Recommendation</span><span className="font-semibold capitalize text-white">{recommendation || '—'}{typeof confidence === 'number' ? ` · ${Math.round(confidence * 100)}% confidence` : ''}</span></p></div><p className="mt-3 text-xs text-slate-400">Advisory only. Owner review remains required before a draft can enter a campaign.</p></section>
}
