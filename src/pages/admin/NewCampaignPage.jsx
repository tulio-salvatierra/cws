import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function campaignInsertErrorMessage(error, code) {
  if (error?.code === '23505') {
    return `Campaign code ${code} already exists in this workspace. Use a different code.`
  }

  return error?.message || 'Unable to create campaign.'
}

export default function NewCampaignPage() {
  const [channels, setChannels] = useState([])
  const [workspaceId, setWorkspaceId] = useState(null)
  const [form, setForm] = useState({ code: '', title: '', description: '', status: 'idea', channel_id: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    async function load() {
      const membership = await supabase.from('workspace_members').select('workspace_id').eq('status', 'active').order('created_at').limit(1).single()
      if (membership.error) return setError(membership.error.message)
      setWorkspaceId(membership.data.workspace_id)
      const result = await supabase.from('channels').select('id, name').eq('workspace_id', membership.data.workspace_id).order('name')
      if (result.error) setError(result.error.message)
      else { setChannels(result.data || []); setForm((current) => ({ ...current, channel_id: result.data?.[0]?.id || '' })) }
    }
    load()
  }, [])
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('')
    const { data: user } = await supabase.auth.getUser()
    const result = await supabase.from('campaigns').insert({ ...form, workspace_id: workspaceId, created_by: user.user.id }).select('id').single()
    if (result.error) { setError(campaignInsertErrorMessage(result.error, form.code)); setSaving(false); return }
    navigate(`/admin/campaigns/${result.data.id}`)
  }
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-3xl"><Link className="text-sm font-semibold text-orange-300" to="/admin/campaigns">← Campaigns</Link><h1 className="mt-10 text-4xl font-semibold">New campaign</h1><p className="mt-3 text-slate-400">Create a workspace-owned campaign and connect it to a channel.</p><form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6"><label className="block text-sm text-slate-300">Code<input required pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*" title="Use letters and numbers separated by single hyphens." value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CWS-002" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" /></label><label className="block text-sm text-slate-300">Title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" /></label><label className="block text-sm text-slate-300">Channel<select required value={form.channel_id} onChange={e => setForm({ ...form, channel_id: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white">{channels.map(channel => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label><label className="block text-sm text-slate-300">Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="4" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" /></label>{error && <p role="alert" className="text-sm text-rose-300">{error}</p>}<button disabled={saving || !workspaceId} className="rounded-full bg-orange-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Creating…' : 'Create campaign'}</button></form></div></main>
}
