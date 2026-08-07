import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function VariantDetailPage() {
  const { variantId } = useParams()
  const [state, setState] = useState({ loading: true, error: '', variant: null, approval: null, workspaceId: null })
  const [feedback, setFeedback] = useState('')
  const [actionError, setActionError] = useState('')
  useEffect(() => {
    let active = true
    async function load() {
      const membership = await supabase.from('workspace_members').select('workspace_id').eq('status', 'active').order('created_at').limit(1).single()
      if (membership.error) throw membership.error
      const [variant, approval] = await Promise.all([
        supabase.from('content_variants').select('id, code, locale, working_title, status, transcript, caption_text, campaign_id').eq('id', variantId).eq('workspace_id', membership.data.workspace_id).single(),
        supabase.from('approvals').select('id, status, feedback, reviewed_at').eq('content_variant_id', variantId).eq('workspace_id', membership.data.workspace_id).order('created_at', { ascending: false }).limit(1),
      ])
      if (variant.error) throw variant.error
      if (approval.error) throw approval.error
      if (active) setState({ loading: false, error: '', variant: variant.data, approval: approval.data?.[0] || null, workspaceId: membership.data.workspace_id })
    }
    load().catch((error) => active && setState({ loading: false, error: error.message || 'Unable to load variant.', variant: null, approval: null }))
    return () => { active = false }
  }, [variantId])
  async function requestApproval() {
    setActionError(''); const { data: user } = await supabase.auth.getUser()
    const result = await supabase.from('approvals').insert({ workspace_id: state.workspaceId, content_variant_id: variantId, created_by: user.user.id, status: 'pending' }).select('id, status, feedback, reviewed_at').single()
    if (result.error) setActionError(result.error.message); else setState({ ...state, approval: result.data })
  }
  async function review(status) {
    setActionError(''); const result = await supabase.from('approvals').update({ status, feedback: feedback || null }).eq('id', state.approval.id).select('id, status, feedback, reviewed_at').single()
    if (result.error) setActionError(result.error.message); else setState({ ...state, approval: result.data })
  }
  if (state.loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading content variant…</div>
  if (state.error) return <main className="min-h-screen bg-slate-950 px-6 py-12 text-white"><p className="text-rose-200">{state.error}</p><Link className="mt-4 inline-block text-orange-300" to="/admin/workspace">Back to workspace</Link></main>
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-4xl"><Link className="text-sm font-semibold text-orange-300" to={`/admin/campaigns/${state.variant.campaign_id}`}>← Campaign</Link><p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Content variant · {state.variant.locale}</p><h1 className="mt-3 text-4xl font-semibold">{state.variant.working_title}</h1><p className="mt-2 text-sm text-slate-500">{state.variant.code}</p><section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Script and caption</p><p className="mt-4 whitespace-pre-wrap leading-7 text-slate-200">{state.variant.transcript || state.variant.caption_text || 'Draft content has not been added yet.'}</p></section><section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Approval</p><p className="mt-3 text-lg font-semibold">{state.approval?.status?.replaceAll('_', ' ') || 'Not requested'}</p>{state.approval?.feedback && <p className="mt-2 text-slate-300">{state.approval.feedback}</p>}{actionError && <p className="mt-3 text-sm text-rose-300">{actionError}</p>}{!state.approval && <button onClick={requestApproval} className="mt-4 rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950">Request review</button>}{state.approval?.status === 'pending' && <div className="mt-4 space-y-3"><textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Optional review feedback" rows="3" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" /><div className="flex gap-3"><button onClick={() => review('approved')} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">Approve</button><button onClick={() => review('revision_requested')} className="rounded-full border border-rose-300/40 px-4 py-2 text-sm font-semibold text-rose-200">Request revision</button></div></div>}</section></div></main>
}
