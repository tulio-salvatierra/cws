import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const STATUS_STYLES = {
  editing: 'bg-amber-400/15 text-amber-200 border-amber-300/20',
  recorded: 'bg-sky-400/15 text-sky-200 border-sky-300/20',
  pending: 'bg-violet-400/15 text-violet-200 border-violet-300/20',
  approved: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/20',
  revision_requested: 'bg-rose-400/15 text-rose-200 border-rose-300/20',
}

function StatusPill({ status }) {
  const className = STATUS_STYLES[status] || 'bg-white/10 text-slate-200 border-white/10'
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${className}`}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
      Loading workspace…
    </div>
  )
}

export default function WorkspacePage() {
  const [state, setState] = useState({ loading: true, error: '', workspace: null, channels: [], campaigns: [], variants: [], approvals: [] })

  useEffect(() => {
    let active = true

    async function loadWorkspace() {
      const membershipResult = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)

      if (membershipResult.error) throw membershipResult.error
      const membership = membershipResult.data?.[0]
      if (!membership) throw new Error('No active workspace membership was found for this account.')

      const [workspaceResult, channelsResult, campaignsResult, variantsResult, approvalsResult] = await Promise.all([
        supabase.from('workspaces').select('id, name, slug').eq('id', membership.workspace_id).single(),
        supabase.from('channels').select('id, name, slug, audience, voice').eq('workspace_id', membership.workspace_id).order('name'),
        supabase.from('campaigns').select('id, code, title, status, description, channel_id').eq('workspace_id', membership.workspace_id).order('updated_at', { ascending: false }),
        supabase.from('content_variants').select('id, code, locale, working_title, status, campaign_id').eq('workspace_id', membership.workspace_id).order('code'),
        supabase.from('approvals').select('content_variant_id, status, feedback, reviewed_at').eq('workspace_id', membership.workspace_id).order('created_at', { ascending: false }),
      ])

      const failed = [workspaceResult, channelsResult, campaignsResult, variantsResult, approvalsResult].find((result) => result.error)
      if (failed?.error) throw failed.error

      if (active) {
        setState({
          loading: false,
          error: '',
          workspace: workspaceResult.data,
          channels: channelsResult.data || [],
          campaigns: campaignsResult.data || [],
          variants: variantsResult.data || [],
          approvals: approvalsResult.data || [],
        })
      }
    }

    loadWorkspace().catch((error) => {
      if (active) setState((current) => ({ ...current, loading: false, error: error.message || 'Unable to load workspace.' }))
    })

    return () => { active = false }
  }, [])

  const variantApproval = useMemo(() => {
    return new Map(state.approvals.map((approval) => [approval.content_variant_id, approval]))
  }, [state.approvals])

  if (state.loading) return <LoadingState />

  if (state.error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white md:px-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-300/20 bg-rose-950/30 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-200">Workspace unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold">We couldn’t load your operating system.</h1>
          <p className="mt-3 text-slate-300">{state.error}</p>
          <Link className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950" to="/admin/settings">
            Return to admin
          </Link>
        </div>
      </main>
    )
  }

  const campaignById = new Map(state.campaigns.map((campaign) => [campaign.id, campaign]))

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-white md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <Link className="text-sm font-semibold text-orange-300" to="/">Cicero Web Studio</Link>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">CWS Operating System</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">{state.workspace?.name}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">A clear view of the work moving the studio forward.</p>
          </div>
          <Link className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-orange-300/60 hover:text-orange-200" to="/admin">
            Legacy admin
          </Link>
        </header>

        <nav className="flex flex-wrap gap-2 border-b border-white/10 py-4" aria-label="Workspace sections">
          {[['#overview', 'Overview'], ['#campaigns', 'Campaigns'], ['#content', 'Content'], ['/workspace/tasks', 'Tasks']].map(([href, label]) => (
            <a key={href} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-orange-300/50 hover:text-orange-200" href={href}>
              {label}
            </a>
          ))}
        </nav>

        <section id="overview" className="grid scroll-mt-6 gap-4 py-8 sm:grid-cols-3">
          {[
            ['Channels', state.channels.length, 'Independent audiences and voices'],
            ['Campaigns', state.campaigns.length, 'Work currently in motion'],
            ['Variants', state.variants.length, 'Language-specific content records'],
          ].map(([label, value, detail]) => (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" key={label}>
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-4xl font-semibold">{value}</p>
              <p className="mt-2 text-sm text-slate-400">{detail}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace channels</p>
                <h2 className="mt-2 text-2xl font-semibold">Two distinct voices</h2>
              </div>
              <span className="text-2xl text-orange-300">◌</span>
            </div>
            <div className="mt-6 space-y-3">
              {state.channels.map((channel) => (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4" key={channel.id}>
                  <p className="font-semibold">{channel.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{channel.audience || 'Audience definition coming next.'}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="campaigns" className="scroll-mt-6 rounded-3xl border border-orange-300/20 bg-orange-300/[0.06] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">Active campaign</p>
            {state.campaigns.map((campaign) => (
                <div key={campaign.id}>
                <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-3xl font-semibold">{campaign.code}</h2>
                    <p className="mt-1 text-lg text-slate-200">{campaign.title}</p>
                  </div>
                  <StatusPill status={campaign.status} />
                </div>
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300">{campaign.description}</p>
                <Link className="mt-5 inline-flex text-sm font-semibold text-orange-200 hover:text-orange-100" to={`/workspace/campaigns/${campaign.id}`}>Open campaign →</Link>
              </div>
            ))}
          </div>
        </section>

        <section id="content" className="mt-6 scroll-mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Content operations</p>
              <h2 className="mt-2 text-2xl font-semibold">Independent language variants</h2>
            </div>
            <p className="text-sm text-slate-400">Each variant carries its own review path.</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {state.variants.map((variant) => {
              const approval = variantApproval.get(variant.id)
              const campaign = campaignById.get(variant.campaign_id)
              return (
                <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5" key={variant.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">{variant.locale}</p>
                      <Link className="mt-2 block text-lg font-semibold hover:text-orange-200" to={`/workspace/variants/${variant.id}`}>{variant.working_title}</Link>
                      <p className="mt-1 text-xs text-slate-500">{campaign?.code} · {variant.code}</p>
                    </div>
                    <StatusPill status={variant.status} />
                  </div>
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Approval</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      {approval ? <StatusPill status={approval.status} /> : <span className="text-sm text-slate-400">Not requested</span>}
                      {approval?.reviewed_at && <span className="text-xs text-slate-500">Reviewed</span>}
                    </div>
                    {approval?.feedback && <p className="mt-3 text-sm text-slate-300">{approval.feedback}</p>}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
