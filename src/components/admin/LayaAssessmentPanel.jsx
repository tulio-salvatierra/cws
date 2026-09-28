import { useCallback, useEffect, useState } from 'react'

const field = 'mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 p-3 text-sm text-white'
const button = 'rounded-lg border border-indigo-400/40 px-4 py-2 text-sm text-indigo-200 disabled:opacity-50'

export default function LayaAssessmentPanel({ token, selection }) {
  const [data, setData] = useState({ briefs: [], assessments: [] })
  const [topic, setTopic] = useState('')
  const [draft, setDraft] = useState('')
  const [briefId, setBriefId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const request = useCallback(async (body) => {
    const response = await fetch('/api/marketing-creative?feature=laya', {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token || ''}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'The assessment service did not respond. Try again later.')
    return payload
  }, [token])
  const refresh = useCallback(async () => {
    const next = await request()
    setData(next)
    setBriefId(current => next.briefs.some(brief => brief.id === current) ? current : '')
  }, [request])
  useEffect(() => {
    if (!token) return
    let active = true
    request().then(next => {
      if (!active) return
      setData(next)
      setBriefId('')
      setError('')
    }).catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [request, token])
  useEffect(() => {
    const target = window.location.hash.slice(1)
    if (!loading && target.startsWith('laya-')) document.getElementById(target)?.scrollIntoView?.()
  }, [loading, data.assessments])
  useEffect(() => {
    if (selection) {
      setTopic(selection.topic)
      setDraft(selection.draft)
      document.getElementById('laya-assessments')?.scrollIntoView?.({ behavior: 'smooth' })
    }
  }, [selection])
  async function assess(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request({ action: 'assess_marketing_asset', topic, draft, brief_id: briefId })
      setData(current => ({ ...current, assessments: [result.assessment, ...current.assessments].slice(0, 100) }))
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function markReviewed(id) {
    setBusy(true)
    setError('')
    try {
      await request({ action: 'review_laya_assessment', assessment_id: id })
      setData(current => ({ ...current, assessments: current.assessments.map(run => run.id === id ? { ...run, reviewed: true } : run) }))
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const selectedBrief = data.briefs.find(brief => brief.id === briefId)
  return <section id="laya-assessments" aria-labelledby="laya-heading" className="mt-8 scroll-mt-6 rounded-2xl border border-indigo-400/30 bg-gray-900/60 p-6">
    <h2 id="laya-heading" className="text-xl font-semibold text-white">Content check · Laya</h2>
    <p className="mt-2 text-sm text-gray-400">Check social captions, carousel text, or other marketing copy against your saved business brief. Text only—not image inspection. Nothing is approved, scheduled, or published here.</p>
    {loading && <p className="mt-4 text-sm">Loading your business briefs…</p>}
    {error && <p role="alert" className="mt-4 text-sm text-rose-200">{error} <button type="button" className="underline" onClick={() => refresh().then(() => setError('')).catch(err => setError(err.message))}>Reload</button></p>}
    {!loading && !data.briefs.length && <p className="mt-4 text-amber-200">No active business brief is available. Add or activate a channel brief before evaluating content.</p>}
    <form onSubmit={assess} className="mt-5 space-y-4">
      <label className="block text-sm">Business context
        <select className={field} value={briefId} onChange={event => setBriefId(event.target.value)} disabled={busy || !data.briefs.length} required>
          <option value="">{data.briefs.length ? 'Choose the business and language' : 'No active brief'}</option>
          {data.briefs.map(brief => <option key={brief.id} value={brief.id}>{brief.channels?.name || 'Channel'} · {brief.language} · Brief v{brief.version}</option>)}
        </select>
      </label>
      {selectedBrief && <details className="text-sm text-gray-300"><summary className="cursor-pointer">See what Laya knows about your business</summary><dl className="mt-3 space-y-2">
        {[['Audience', selectedBrief.audience], ['Geography', selectedBrief.geography], ['Tone', selectedBrief.tone], ['Allowed topics', selectedBrief.topics_allowed?.join(', ')], ['Forbidden topics', selectedBrief.topics_forbidden?.join(', ')], ['Call to action', selectedBrief.cta], ['Good example', selectedBrief.example_good], ['Bad example', selectedBrief.example_bad]].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd>{value || 'Not specified'}</dd></div>)}
      </dl><p className="mt-3">This is context sent with each check, not permanent model training.</p></details>}
      <label className="block text-sm">Title and intended platforms<input className={field} value={topic} onChange={event => setTopic(event.target.value)} maxLength={300} disabled={busy} required placeholder="5 daily ChatGPT tips · Facebook, Instagram, LinkedIn" /></label>
      <label className="block text-sm">Asset text<textarea className={field} rows={7} value={draft} onChange={event => setDraft(event.target.value)} maxLength={12000} disabled={busy} required placeholder="Paste your hook, slide text, caption, and call to action." /></label>
      <button className={button} disabled={busy || !briefId || !topic.trim() || !draft.trim()}>{busy ? 'Working…' : 'Evaluate with Laya'}</button>
    </form>
    <div className="mt-7 space-y-4" aria-label="Saved content assessments">
      <h3 className="font-semibold">Assessment history · latest 100</h3>
      {data.assessments.map(run => <article id={`laya-run-${run.id}`} key={run.id} className="rounded-xl border border-gray-700 p-4">
        <h4 className="font-semibold">{run.input.topic}</h4>
        <p className="mt-1 text-xs text-gray-400">{new Date(run.created_at).toLocaleString()} · Brief v{run.input.brief_snapshot?.version} · {run.reviewed ? 'Owner reviewed' : 'Awaiting owner review'}</p>
        <AssessmentResult assessment={run.output?.laya} />
        <details className="mt-3 text-sm text-gray-400"><summary className="cursor-pointer">Exact text assessed</summary><p className="mt-2 whitespace-pre-wrap">{run.input.draft}</p></details>
        {!run.reviewed && <button type="button" className={`${button} mt-4`} disabled={busy} onClick={() => markReviewed(run.id)}>I reviewed this feedback</button>}
        <p className="mt-2 text-xs text-gray-500">Review acknowledgment only. Not content approval or permission to publish.</p>
      </article>)}
      {!loading && !data.assessments.length && <p className="text-sm text-gray-400">No saved checks yet.</p>}
    </div>
  </section>
}

function AssessmentResult({ assessment }) {
  if (!assessment?.available) return <p className="mt-3 text-sm text-amber-200">Laya is unavailable. This text has not passed an automated check; review it yourself or run a new assessment later.</p>
  const answers = assessment.result?.answers || {}
  const percent = value => Number.isFinite(value) ? `${Math.round(value * 100)}%` : 'Unavailable'
  return <div className="mt-3 text-sm text-gray-300">
    <p>Possible forbidden claim: {percent(answers.forbidden_claim?.noul)}</p>
    <p>Brief fit: {Number.isFinite(answers.brief_fit?.score) ? `${answers.brief_fit.score.toFixed(2)} / 3` : 'Unavailable'}</p>
    <p>Model suggestion: {answers.review_priority?.choice || 'Unavailable'} · confidence {percent(answers.review_priority?.confidence)}</p>
    <p className="mt-2 text-amber-200">Advisory only. A low-confidence suggestion is uncertain, not approval. These scores do not identify or prove which claim is wrong.</p>
  </div>
}
