import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function NewDecisionPage() {
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [decision, setDecision] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    const normalizedTitle = title.trim()
    const normalizedDecision = decision.trim()
    if (!normalizedTitle || !normalizedDecision) {
      setError('Title and decision are required.')
      return
    }

    setSaving(true)
    setError('')
    const [membership, userResult] = await Promise.all([
      supabase.from('workspace_members').select('workspace_id').eq('status', 'active').order('created_at').limit(1).single(),
      supabase.auth.getUser(),
    ])

    if (membership.error || userResult.error || !userResult.data?.user) {
      setError(membership.error?.message || userResult.error?.message || 'Unable to identify the current user.')
      setSaving(false)
      return
    }

    const result = await supabase.from('decisions').insert({
      workspace_id: membership.data.workspace_id,
      title: normalizedTitle,
      context: context.trim() || null,
      decision: normalizedDecision,
      status: 'proposed',
      created_by: userResult.data.user.id,
    }).select('id').single()

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
    } else {
      navigate('/admin/knowledge')
    }
  }

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12">
    <div className="mx-auto max-w-3xl">
      <Link className="text-sm font-semibold text-orange-300" to="/admin/knowledge">← Knowledge</Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Knowledge</p>
      <h1 className="mt-3 text-4xl font-semibold">New decision</h1>
      <p className="mt-3 text-slate-400">Capture a proposed decision and the reasoning needed for owner review.</p>
      <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <label className="block text-sm text-slate-300">Title
          <input required maxLength="200" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" />
        </label>
        <label className="block text-sm text-slate-300">Context
          <textarea rows="4" value={context} onChange={(event) => setContext(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" />
        </label>
        <label className="block text-sm text-slate-300">Decision
          <textarea required rows="6" value={decision} onChange={(event) => setDecision(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" />
        </label>
        <p className="text-sm text-slate-500">New decisions start as proposed.</p>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button disabled={saving} className="rounded-full bg-orange-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Creating…' : 'Create decision'}</button>
      </form>
    </div>
  </main>
}
