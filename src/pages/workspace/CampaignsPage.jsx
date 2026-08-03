import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function CampaignsPage() {
  const [state, setState] = useState({ loading: true, error: '', campaigns: [] })
  useEffect(() => {
    let active = true
    async function load() {
      const membership = await supabase.from('workspace_members').select('workspace_id').eq('status', 'active').order('created_at').limit(1).single()
      if (membership.error) throw membership.error
      const campaigns = await supabase.from('campaigns').select('id, code, title, description, status, updated_at, channels(name)').eq('workspace_id', membership.data.workspace_id).order('updated_at', { ascending: false })
      if (campaigns.error) throw campaigns.error
      if (active) setState({ loading: false, error: '', campaigns: campaigns.data || [] })
    }
    load().catch((error) => active && setState({ loading: false, error: error.message || 'Unable to load campaigns.', campaigns: [] }))
    return () => { active = false }
  }, [])
  if (state.loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading campaigns…</div>
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-5xl"><Link className="text-sm font-semibold text-orange-300" to="/workspace">← Workspace</Link><div className="mt-10 flex flex-col justify-between gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Workspace campaigns</p><h1 className="mt-3 text-4xl font-semibold">Work in motion</h1><p className="mt-3 text-slate-400">Campaigns belong to a workspace and stay connected to their channel and content variants.</p></div><span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">{state.campaigns.length} campaign{state.campaigns.length === 1 ? '' : 's'}</span></div>{state.error ? <p className="mt-8 text-rose-200">{state.error}</p> : <div className="mt-8 grid gap-4">{state.campaigns.map((campaign) => <Link className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-orange-300/50" key={campaign.id} to={`/workspace/campaigns/${campaign.id}`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">{campaign.code}</p><h2 className="mt-2 text-2xl font-semibold">{campaign.title}</h2><p className="mt-2 text-sm text-slate-400">{campaign.channels?.name || 'Channel not assigned'}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">{campaign.status.replaceAll('_', ' ')}</span></div>{campaign.description && <p className="mt-5 max-w-2xl leading-6 text-slate-300">{campaign.description}</p>}<p className="mt-5 text-sm font-semibold text-orange-200">Open campaign →</p></Link>)}</div>}</div></main>
}
