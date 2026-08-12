import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function defaultCode(run) {
  return `CWS-AI-${run.id.slice(0, 8).toUpperCase()}`
}

export default function GeneratedDraftReviewCard({ run, campaigns, onReviewed }) {
  const eligibleCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.channel_id === run.output?.channel_id),
    [campaigns, run.output?.channel_id],
  )
  const [campaignId, setCampaignId] = useState(eligibleCampaigns[0]?.id || '')
  const [code, setCode] = useState(defaultCode(run))
  const [title, setTitle] = useState(run.input?.topic || 'Generated content draft')
  const [draftText, setDraftText] = useState(run.output?.draft_text || '')
  const [feedback, setFeedback] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function review(action) {
    if (!confirmed) {
      setError('Confirm the review decision before continuing.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Your session expired. Sign in again.')

      const response = await fetch('/api/review-generated-draft', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: run.id,
          action,
          feedback,
          ...(action === 'accept' ? {
            campaign_id: campaignId,
            code,
            working_title: title,
            draft_text: draftText,
          } : {}),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Draft review failed.')
      await onReviewed(result)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Draft review failed.')
    } finally {
      setSaving(false)
    }
  }

  if (run.status !== 'needs_review') {
    const variantId = run.output?.review?.content_variant_id
    return <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="font-semibold">{run.agent_key}</p><p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{run.command_level} · {run.status}</p></div><time className="text-xs text-slate-500">{new Date(run.created_at).toLocaleString()}</time></div><p className="mt-4 whitespace-pre-wrap border-t border-white/10 pt-4 text-sm text-slate-300">{run.output?.draft_text}</p>{variantId && <Link className="mt-4 inline-flex text-sm font-semibold text-orange-300" to={`/admin/variants/${variantId}`}>Open accepted variant →</Link>}</article>
  }

  return <article className="rounded-3xl border border-amber-300/30 bg-amber-300/[0.05] p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Owner review · Brief v{run.output?.brief_version}</p><h2 className="mt-2 text-2xl font-semibold">{run.input?.topic || 'Generated draft'}</h2></div><time className="text-xs text-slate-500">{new Date(run.created_at).toLocaleString()}</time></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Destination campaign<select aria-label="Destination campaign" required value={campaignId} onChange={(event) => setCampaignId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"><option value="">Select campaign</option>{eligibleCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.code} · {campaign.title}</option>)}</select></label><label className="text-sm font-semibold">Variant code<input aria-label="Variant code" required pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white" /></label></div><label className="mt-4 block text-sm font-semibold">Working title<input aria-label="Working title" required maxLength="200" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white" /></label><label className="mt-4 block text-sm font-semibold">Draft text<textarea aria-label="Draft text" required maxLength="20000" rows="9" value={draftText} onChange={(event) => setDraftText(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white" /></label><label className="mt-4 block text-sm font-semibold">Review note (optional)<textarea aria-label="Review note" maxLength="2000" rows="3" value={feedback} onChange={(event) => setFeedback(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white" /></label>{!eligibleCampaigns.length && <p className="mt-4 text-sm text-amber-200">Create a campaign for this channel before accepting the draft.</p>}<label className="mt-5 flex items-start gap-3 text-sm text-slate-300"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />I confirm this owner review decision. Accept creates one new draft variant; reject preserves the run without creating content.</label>{error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}<div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={saving || !confirmed || !campaignId || !code || !title.trim() || !draftText.trim()} onClick={() => review('accept')} className="rounded-full bg-emerald-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Saving…' : 'Accept into campaign'}</button><button type="button" disabled={saving || !confirmed} onClick={() => review('reject')} className="rounded-full border border-rose-300/40 px-5 py-3 font-semibold text-rose-200 disabled:opacity-50">Reject proposal</button></div></article>
}
