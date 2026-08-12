import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GeneratedDraftReviewCard from '../../components/admin/GeneratedDraftReviewCard'
import { supabase } from '../../lib/supabase'

export default function AgentRunsPage() {
  const [state, setState] = useState({ runs: [], campaigns: [], error: '' })
  const [topic, setTopic] = useState('Why a clear website message matters for local businesses')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(null)

  const load = useCallback(async () => {
    const m = await supabase.from('workspace_members').select('workspace_id').eq('status', 'active').order('created_at').limit(1).single()
    if (m.error) return setState({ runs: [], campaigns: [], error: m.error.message })
    const [runsResult, campaignsResult] = await Promise.all([
      supabase.from('agent_runs').select('id, agent_key, command_level, status, input, output, error_message, created_at').eq('workspace_id', m.data.workspace_id).order('created_at', { ascending: false }),
      supabase.from('campaigns').select('id, channel_id, code, title').eq('workspace_id', m.data.workspace_id).order('created_at', { ascending: false }),
    ])
    const error = runsResult.error || campaignsResult.error
    if (error) setState({ runs: [], campaigns: [], error: error.message })
    else setState({ runs: runsResult.data || [], campaigns: campaignsResult.data || [], error: '' })
  }, [])

  useEffect(() => { load() }, [load])

  async function generate(e) {
    e.preventDefault()
    setGenerating(true)
    setGenerated(null)
    setState((current) => ({ ...current, error: '' }))

    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      setState((current) => ({ ...current, error: 'Your session expired. Sign in again.' }))
      setGenerating(false)
      return
    }

    try {
      const response = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_slug: 'cicero-web-studio',
          language: 'en',
          topic,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Draft generation failed.')
      setGenerated(result.output)
      await load()
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Draft generation failed.',
      }))
    } finally {
      setGenerating(false)
    }
  }

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-5xl"><Link className="text-sm font-semibold text-orange-300" to="/admin/workspace">← Workspace</Link><p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Operations</p><h1 className="mt-3 text-4xl font-semibold">Agent runs</h1><p className="mt-3 text-slate-400">Generate a brief-grounded proposal and review the recorded agent activity.</p><form onSubmit={generate} className="mt-8 rounded-3xl border border-orange-300/20 bg-orange-300/[0.06] p-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">Non-publishing test</p><h2 className="mt-2 text-2xl font-semibold">Cicero Web Studio · English</h2><p className="mt-2 text-sm text-slate-400">Uses the active English channel brief. The result is saved for review and is never scheduled or published.</p><label className="mt-5 block text-sm font-semibold" htmlFor="generation-topic">Topic</label><textarea id="generation-topic" required maxLength="500" rows="3" value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white" /><button disabled={generating} className="mt-4 rounded-full bg-orange-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-wait disabled:opacity-60">{generating ? 'Generating…' : 'Generate review draft'}</button></form>{state.error && <p role="alert" className="mt-6 text-rose-300">{state.error}</p>}{generated && <section className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.05] p-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Needs review · Brief v{generated.brief_version}</p><h2 className="mt-2 text-2xl font-semibold">Generated draft</h2><p className="mt-4 whitespace-pre-wrap text-slate-200">{generated.draft_text}</p></section>}<div className="mt-8 space-y-4">{state.runs.length ? state.runs.map(run => run.agent_key === 'channel-draft-generator' && run.output?.draft_text ? <GeneratedDraftReviewCard key={run.id} run={run} campaigns={state.campaigns} onReviewed={load} /> : <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5" key={run.id}><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="font-semibold">{run.agent_key}</p><p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{run.command_level} · {run.status}</p></div><time className="text-xs text-slate-500">{new Date(run.created_at).toLocaleString()}</time></div>{run.error_message && <p className="mt-3 text-sm text-rose-300">{run.error_message}</p>}</article>) : <p className="text-slate-500">No agent runs recorded yet.</p>}</div></div></main>
}
