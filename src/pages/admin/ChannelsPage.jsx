import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
      Loading channels…
    </div>
  )
}

function Detail({ label, value }) {
  if (!value) return null

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{value}</p>
    </div>
  )
}

export default function ChannelsPage() {
  const [state, setState] = useState({ loading: true, error: '', channels: [] })

  useEffect(() => {
    let active = true

    async function loadChannels() {
      const membershipResult = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)

      if (membershipResult.error) throw membershipResult.error
      const membership = membershipResult.data?.[0]
      if (!membership) throw new Error('No active workspace membership was found for this account.')

      const channelsResult = await supabase
        .from('channels')
        .select('id, name, slug, audience, voice, formats, production_requirements, revenue_goal, success_metrics')
        .eq('workspace_id', membership.workspace_id)
        .order('name')

      if (channelsResult.error) throw channelsResult.error

      if (active) {
        setState({ loading: false, error: '', channels: channelsResult.data || [] })
      }
    }

    loadChannels().catch((error) => {
      if (active) setState({ loading: false, error: error.message || 'Unable to load channels.', channels: [] })
    })

    return () => { active = false }
  }, [])

  if (state.loading) return <LoadingState />

  if (state.error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white md:px-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-300/20 bg-rose-950/30 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-200">Channels unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold">We couldn’t load your channels.</h1>
          <p className="mt-3 text-slate-300">{state.error}</p>
          <Link className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950" to="/admin">
            Return to admin
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-white md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <Link className="text-sm font-semibold text-orange-300" to="/admin/workspace">← Workspace</Link>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">CWS Operating System</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">Channels</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">Keep each audience, voice, and production context distinct before campaign work begins.</p>
          </div>
          <Link className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-orange-300/60 hover:text-orange-200" to="/admin">
            Admin overview
          </Link>
        </header>

        {state.channels.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-slate-300">
            No channels have been created for this workspace yet.
          </div>
        ) : (
          <section className="mt-8 grid gap-6 lg:grid-cols-2" aria-label="Workspace channels">
            {state.channels.map((channel) => (
              <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6" key={channel.id}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">{channel.slug}</p>
                    <h2 className="mt-2 text-3xl font-semibold">{channel.name}</h2>
                  </div>
                  <span className="text-2xl text-orange-300" aria-hidden="true">◌</span>
                </div>

                <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2">
                  <Detail label="Audience" value={channel.audience} />
                  <Detail label="Voice" value={channel.voice} />
                  <Detail label="Production requirements" value={channel.production_requirements} />
                  <Detail label="Revenue goal" value={channel.revenue_goal} />
                  <Detail label="Success metrics" value={channel.success_metrics} />
                </div>

                {channel.formats?.length > 0 && (
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Formats</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {channel.formats.map((format) => (
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300" key={format}>
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
