import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const VARIANT_STATUSES = [
  'draft',
  'script_ready',
  'ready_to_record',
  'recorded',
  'rough_cut',
  'fine_cut',
  'captions_pending',
  'ready_for_review',
  'approved',
  'exported',
  'published',
  'archived',
]

const VARIANT_FIELDS = 'id, code, locale, working_title, status, transcript, tone, editing_notes, caption_text, export_reference, exported_by, exported_at, export_snapshot, campaign_id'

const MANUAL_VARIANT_STATUSES = VARIANT_STATUSES.filter(
  (status) => !['ready_for_review', 'approved', 'exported', 'published'].includes(status),
)

function statusOptions(currentStatus) {
  return MANUAL_VARIANT_STATUSES.includes(currentStatus)
    ? MANUAL_VARIANT_STATUSES
    : [...MANUAL_VARIANT_STATUSES, currentStatus]
}

function formFromVariant(variant) {
  return {
    transcript: variant.transcript || '',
    tone: variant.tone || '',
    editing_notes: variant.editing_notes || '',
    caption_text: variant.caption_text || '',
    export_reference: variant.export_reference || '',
    status: variant.status,
  }
}

function statusLabel(status) {
  return status.replaceAll('_', ' ')
}

export default function VariantDetailPage() {
  const { variantId } = useParams()
  const [state, setState] = useState({ loading: true, error: '', variant: null, approval: null, workspaceId: null })
  const [form, setForm] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [saveError, setSaveError] = useState('')
  const [approvalError, setApprovalError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [approvalActionPending, setApprovalActionPending] = useState(false)
  const [reviewDecision, setReviewDecision] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const [exportConfirm, setExportConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const membership = await supabase.from('workspace_members').select('workspace_id').eq('status', 'active').order('created_at').limit(1).single()
      if (membership.error) throw membership.error

      const [variant, approval] = await Promise.all([
        supabase.from('content_variants').select(VARIANT_FIELDS).eq('id', variantId).eq('workspace_id', membership.data.workspace_id).single(),
        supabase.from('approvals').select('id, status, feedback, reviewed_at, content_snapshot').eq('content_variant_id', variantId).eq('workspace_id', membership.data.workspace_id).order('created_at', { ascending: false }).limit(1),
      ])

      if (variant.error) throw variant.error
      if (approval.error) throw approval.error
      if (active) {
        setState({ loading: false, error: '', variant: variant.data, approval: approval.data?.[0] || null, workspaceId: membership.data.workspace_id })
        setForm(formFromVariant(variant.data))
      }
    }

    load().catch((error) => active && setState({ loading: false, error: error.message || 'Unable to load variant.', variant: null, approval: null }))
    return () => { active = false }
  }, [variantId])

  async function saveVariant(event) {
    event.preventDefault()
    if (state.variant?.export_snapshot) return
    setSaving(true)
    setSaveError('')
    setSaveMessage('')

    const result = await supabase
      .from('content_variants')
      .update(form)
      .eq('id', variantId)
      .eq('workspace_id', state.workspaceId)
      .select(VARIANT_FIELDS)
      .single()

    if (result.error) {
      setSaveError(result.error.message)
    } else {
      setState((current) => ({ ...current, variant: result.data }))
      setForm(formFromVariant(result.data))
      setSaveMessage('Variant saved.')
    }
    setSaving(false)
  }

  async function requestApproval() {
    setApprovalError('')
    setApprovalActionPending(true)
    const { data, error: userError } = await supabase.auth.getUser()

    if (userError || !data?.user) {
      setApprovalError(userError?.message || 'Unable to identify the current user.')
      setApprovalActionPending(false)
      return
    }

    const result = await supabase.from('approvals').insert({ workspace_id: state.workspaceId, content_variant_id: variantId, created_by: data.user.id, status: 'pending' }).select('id, status, feedback, reviewed_at, content_snapshot').single()
    if (result.error) {
      setApprovalError(result.error.message)
    } else {
      setState((current) => ({ ...current, approval: result.data, variant: { ...current.variant, status: 'ready_for_review' } }))
      setForm((current) => ({ ...current, status: 'ready_for_review' }))
      setFeedback('')
      setReviewDecision(null)
    }
    setApprovalActionPending(false)
  }

  async function review(status) {
    setApprovalError('')
    setReviewing(true)
    const result = await supabase.from('approvals').update({ status, feedback: feedback || null }).eq('id', state.approval.id).select('id, status, feedback, reviewed_at, content_snapshot').single()
    if (result.error) {
      setApprovalError(result.error.message)
    } else {
      const variantStatus = status === 'approved' ? 'approved' : 'draft'
      setState((current) => ({ ...current, approval: result.data, variant: { ...current.variant, status: variantStatus } }))
      setForm((current) => ({ ...current, status: variantStatus }))
      setFeedback('')
      setReviewDecision(null)
    }
    setReviewing(false)
  }

  async function recordExport() {
    setExportError('')
    setExporting(true)
    const result = await supabase
      .from('content_variants')
      .update({
        ...form,
        caption_text: form.caption_text.trim(),
        export_reference: form.export_reference.trim(),
        status: 'exported',
      })
      .eq('id', variantId)
      .eq('workspace_id', state.workspaceId)
      .select(VARIANT_FIELDS)
      .single()

    if (result.error) {
      setExportError(result.error.message)
    } else {
      setState((current) => ({ ...current, variant: result.data }))
      setForm(formFromVariant(result.data))
      setExportConfirm(false)
    }
    setExporting(false)
  }

  function beginExport() {
    const missingFields = []
    if (!form?.caption_text.trim()) missingFields.push('the final caption')
    if (!form?.export_reference.trim()) missingFields.push('an export filename or reference')

    if (missingFields.length > 0) {
      setExportError(`Add ${missingFields.join(' and ')} before recording the export.`)
      return
    }

    setExportError('')
    setExportConfirm(true)
  }

  if (state.loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading content variant…</div>
  if (state.error) return <main className="min-h-screen bg-slate-950 px-6 py-12 text-white"><p className="text-rose-200">{state.error}</p><Link className="mt-4 inline-block text-orange-300" to="/admin/workspace">Back to workspace</Link></main>

  const variant = state.variant
  const exportLocked = Boolean(variant.export_snapshot)
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-4xl">
    <Link className="text-sm font-semibold text-orange-300" to={`/admin/campaigns/${variant.campaign_id}`}>← Campaign</Link>
    <p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Content variant · {variant.locale}</p>
    <h1 className="mt-3 text-4xl font-semibold">{variant.working_title}</h1>
    <p className="mt-2 text-sm text-slate-500">{variant.code}</p>

    <form onSubmit={saveVariant} className="mt-10 space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Variant workspace</p>
          <p className="mt-2 text-sm text-slate-400">Edit this language/version independently from the campaign and other variants.</p>
        </div>
        <label className="text-sm text-slate-300">Status
          <select aria-label="Status" disabled={exportLocked} value={form?.status || ''} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-2 block rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60">
            {statusOptions(form?.status || variant.status).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
        </label>
      </div>

      <label className="block text-sm text-slate-300">Transcript / script
        <textarea aria-label="Transcript / script" disabled={exportLocked} rows="7" value={form?.transcript || ''} onChange={(event) => setForm({ ...form, transcript: event.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white disabled:opacity-60" />
      </label>
      <label className="block text-sm text-slate-300">Tone
        <textarea aria-label="Tone" disabled={exportLocked} rows="3" value={form?.tone || ''} onChange={(event) => setForm({ ...form, tone: event.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white disabled:opacity-60" />
      </label>
      <label className="block text-sm text-slate-300">Editing notes
        <textarea aria-label="Editing notes" disabled={exportLocked} rows="4" value={form?.editing_notes || ''} onChange={(event) => setForm({ ...form, editing_notes: event.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white disabled:opacity-60" />
      </label>
      <label className="block text-sm text-slate-300">Caption text
        <textarea aria-label="Caption text" disabled={exportLocked} rows="4" value={form?.caption_text || ''} onChange={(event) => setForm({ ...form, caption_text: event.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white disabled:opacity-60" />
      </label>
      <label className="block text-sm text-slate-300">Export filename or reference
        <input aria-label="Export filename or reference" disabled={exportLocked} value={form?.export_reference || ''} onChange={(event) => setForm({ ...form, export_reference: event.target.value })} placeholder="Filename, folder, or delivery reference" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white disabled:opacity-60" />
      </label>
      {saveError && <p className="text-sm text-rose-300">{saveError}</p>}
      {saveMessage && <p className="text-sm text-emerald-300" role="status">{saveMessage}</p>}
      {!exportLocked && <button disabled={!form || saving} className="rounded-full bg-orange-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>}
      {exportLocked && <p className="text-sm text-emerald-200">The exported content and handoff evidence are locked.</p>}
    </form>

    <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Approval</p>
      <p className="mt-3 text-lg font-semibold">{statusLabel(state.approval?.status || 'not_requested')}</p>
      {state.approval?.feedback && <p className="mt-2 text-slate-300">{state.approval.feedback}</p>}
      {!state.approval && <div className="mt-4"><p className="mb-3 text-sm text-slate-400">Submitting captures an immutable snapshot of the current variant and moves it to ready for review. It does not approve or publish anything.</p><button disabled={approvalActionPending} onClick={requestApproval} className="rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{approvalActionPending ? 'Requesting…' : 'Request review'}</button></div>}
      {state.approval?.status === 'revision_requested' && <button disabled={approvalActionPending} onClick={requestApproval} className="mt-4 rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{approvalActionPending ? 'Re-submitting…' : 'Re-submit for review'}</button>}
      {state.approval?.status === 'pending' && <div className="mt-4 space-y-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4">
        <div>
          <p className="font-semibold text-amber-100">Submitted for owner review</p>
          <p className="mt-1 text-sm text-slate-400">An immutable content snapshot was captured. No approval decision has been recorded yet. The controls below perform a separate owner review.</p>
        </div>
        <label className="block text-sm text-slate-300">Reviewer feedback
          <textarea aria-label="Reviewer feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Optional feedback for this review decision" rows="3" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" />
        </label>
        {!reviewDecision && <div className="flex flex-wrap gap-3">
          <button disabled={reviewing} onClick={() => setReviewDecision('approved')} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">Approve</button>
          <button disabled={reviewing} onClick={() => setReviewDecision('revision_requested')} className="rounded-full border border-rose-300/40 px-4 py-2 text-sm font-semibold text-rose-200 disabled:opacity-50">Request revision</button>
        </div>}
        {reviewDecision && <div role="alertdialog" aria-label="Confirm review decision" className="rounded-2xl border border-orange-300/30 bg-slate-950/60 p-4">
          <p className="font-semibold">Confirm {reviewDecision === 'approved' ? 'approval' : 'revision request'}</p>
          <p className="mt-1 text-sm text-slate-400">This is a separate owner decision and will complete the pending approval record.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button disabled={reviewing} onClick={() => review(reviewDecision)} className="rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{reviewing ? 'Saving decision…' : reviewDecision === 'approved' ? 'Confirm approval' : 'Confirm revision request'}</button>
            <button disabled={reviewing} onClick={() => setReviewDecision(null)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-50">Cancel</button>
          </div>
        </div>}
      </div>}
      {approvalError && <p className="mt-4 text-sm text-rose-300">{approvalError}</p>}
    </section>

    {(variant.status === 'approved' || exportLocked) && <section className="mt-6 rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.04] p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Export handoff</p>
      {variant.status === 'approved' && <><h2 className="mt-3 text-xl font-semibold">Prepare the approved variant for external export</h2><p className="mt-2 text-sm text-slate-400">Add the final caption and Final Cut filename or delivery reference above. Confirming saves the current fields, captures an immutable handoff snapshot, and marks the variant exported. It does not publish or contact n8n.</p><button type="button" disabled={exporting} onClick={beginExport} className="mt-4 rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">Mark exported</button></>}
      {exportLocked && <><h2 className="mt-3 text-xl font-semibold">Export recorded</h2><p className="mt-2 text-sm text-slate-300">{variant.export_reference}</p>{variant.exported_at && <time className="mt-2 block text-xs text-slate-500">Recorded {new Date(variant.exported_at).toLocaleString()}</time>}<p className="mt-3 text-sm text-slate-400">No publication action was triggered.</p></>}
      {exportError && <p role="alert" className="mt-4 text-sm text-rose-300">{exportError}</p>}
      {exportConfirm && <div role="alertdialog" aria-label="Confirm export handoff" className="mt-4 rounded-2xl border border-emerald-300/30 bg-slate-950/70 p-4"><p className="font-semibold">Confirm export handoff</p><p className="mt-1 text-sm text-slate-400">This locks the current content, caption, and export reference as the final exported handoff. It will not publish anything.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={exporting} onClick={recordExport} className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{exporting ? 'Recording…' : 'Confirm exported'}</button><button type="button" disabled={exporting} onClick={() => setExportConfirm(false)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-50">Cancel</button></div></div>}
    </section>}
  </div></main>
}
