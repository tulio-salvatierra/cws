import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function CampaignsPage() {
  const [state, setState] = useState({ loading: true, error: '', campaigns: [] })
  const [showArchivedTests, setShowArchivedTests] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      const membership = await supabase.from('workspace_members').select('workspace_id').eq('status', 'active').order('created_at').limit(1).single()
      if (membership.error) throw membership.error

      const [campaigns, channels] = await Promise.all([
        supabase.from('campaigns').select('id, code, title, description, status, updated_at, channel_id, is_test, test_archived, test_archived_at').eq('workspace_id', membership.data.workspace_id).order('updated_at', { ascending: false }),
        supabase.from('channels').select('id, name').eq('workspace_id', membership.data.workspace_id),
      ])
      if (campaigns.error) throw campaigns.error
      if (channels.error) throw channels.error

      const channelNames = new Map((channels.data || []).map((channel) => [channel.id, channel.name]))
      if (active) {
        setState({
          loading: false,
          error: '',
          campaigns: (campaigns.data || []).map((campaign) => ({ ...campaign, channelName: channelNames.get(campaign.channel_id) })),
        })
      }
    }

    load().catch((error) => active && setState({ loading: false, error: error.message || 'Unable to load campaigns.', campaigns: [] }))
    return () => { active = false }
  }, [])

  if (state.loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading campaigns…</div>

  const archivedTestCount = state.campaigns.filter((campaign) => campaign.test_archived).length
  const visibleCampaigns = showArchivedTests ? state.campaigns : state.campaigns.filter((campaign) => !campaign.test_archived)

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12">
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <Link className="text-sm font-semibold text-orange-300" to="/admin/workspace">← Workspace</Link>
        <Link className="rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950" to="/admin/campaigns/new">+ New campaign</Link>
      </div>
      <div className="mt-10 flex flex-col justify-between gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Workspace campaigns</p>
          <h1 className="mt-3 text-4xl font-semibold">Work in motion</h1>
          <p className="mt-3 text-slate-400">Campaigns belong to a workspace and stay connected to their channel and content variants.</p>
        </div>
        <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">{visibleCampaigns.length} campaign{visibleCampaigns.length === 1 ? '' : 's'}</span>
      </div>

      {archivedTestCount > 0 && <button type="button" onClick={() => setShowArchivedTests((shown) => !shown)} className="mt-6 text-sm font-semibold text-amber-200">{showArchivedTests ? 'Hide archived tests' : `Show archived tests (${archivedTestCount})`}</button>}

      {state.error ? <p className="mt-8 text-rose-200">{state.error}</p> : <div className="mt-8 grid gap-4">
        {visibleCampaigns.map((campaign) => <Link className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-orange-300/50" key={campaign.id} to={`/admin/campaigns/${campaign.id}`}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">{campaign.code}</p>
                {campaign.is_test && <span className="rounded-full border border-amber-300/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">Test{campaign.test_archived ? ' · archived' : ''}</span>}
              </div>
              <h2 className="mt-2 text-2xl font-semibold">{campaign.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{campaign.channelName || 'Channel not assigned'}</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">{campaign.status.replaceAll('_', ' ')}</span>
          </div>
          {campaign.description && <p className="mt-5 max-w-2xl leading-6 text-slate-300">{campaign.description}</p>}
          <p className="mt-5 text-sm font-semibold text-orange-200">Open campaign →</p>
        </Link>)}
        {visibleCampaigns.length === 0 && <p className="text-sm text-slate-400">No operational campaigns.</p>}
      </div>}
    </div>
  </main>
}
