import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function formatAgentLabel(agentKey) {
  return String(agentKey || 'unknown').replaceAll('-', ' ').replaceAll('_', ' ')
}

function getProposalSummary(output) {
  if (!output || typeof output !== 'object' || Array.isArray(output)) return 'No summary provided.'

  const candidates = [
    output.summary,
    output.title,
    output.message,
    output.recommendation,
    output.proposal?.summary,
  ]
  const summary = candidates.find((value) => typeof value === 'string' && value.trim())
  if (summary) return summary.trim()

  return JSON.stringify(output, null, 2)
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
      Loading pending proposals...
    </div>
  )
}

export default function AgentProposalsPage() {
  const [state, setState] = useState({ loading: true, error: '', proposals: [] })
  const [discussingId, setDiscussingId] = useState('')

  useEffect(() => {
    let active = true

    async function loadProposals() {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Your session expired. Sign in again.')

      const response = await fetch('/api/agent-proposals', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load pending proposals.')

      if (active) {
        setState({ loading: false, error: '', proposals: result.proposals || [] })
      }
    }

    loadProposals().catch((error) => {
      if (active) {
        setState({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load pending proposals.',
          proposals: [],
        })
      }
    })

    return () => { active = false }
  }, [])

  async function markDiscussed(proposalId) {
    setDiscussingId(proposalId)
    setState((current) => ({ ...current, error: '' }))

    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Your session expired. Sign in again.')

      const response = await fetch('/api/agent-proposals', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposal_id: proposalId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to mark proposal discussed.')

      setState((current) => ({
        ...current,
        proposals: current.proposals.filter((proposal) => proposal.id !== proposalId),
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to mark proposal discussed.',
      }))
    } finally {
      setDiscussingId('')
    }
  }

  if (state.loading) return <LoadingState />

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12">
      <div className="mx-auto max-w-5xl">
        <Link className="text-sm font-semibold text-orange-300" to="/admin/workspace">← Workspace</Link>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Items Deserving Attention</p>
        <h1 className="mt-3 text-4xl font-semibold">Pending proposals</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Agent proposals waiting for CEO review.</p>

        {state.error && <p role="alert" className="mt-6 text-rose-300">{state.error}</p>}

        {!state.error && (
          <section className="mt-8 space-y-4" aria-label="Pending agent proposals">
            {state.proposals.length ? state.proposals.map((proposal) => (
              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5" key={proposal.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Source</p>
                    <h2 className="mt-1 text-lg font-semibold capitalize">{formatAgentLabel(proposal.agent_key)}</h2>
                  </div>
                  <time className="text-xs text-slate-500" dateTime={proposal.created_at}>
                    {new Date(proposal.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                  {getProposalSummary(proposal.output)}
                </p>
                <button
                  type="button"
                  disabled={discussingId === proposal.id}
                  onClick={() => markDiscussed(proposal.id)}
                  className="mt-5 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-orange-300/60 hover:text-orange-200 disabled:cursor-wait disabled:opacity-60"
                >
                  {discussingId === proposal.id ? 'Marking...' : 'Mark discussed'}
                </button>
              </article>
            )) : <p className="text-slate-500">no pending proposals</p>}
          </section>
        )}
      </div>
    </main>
  )
}
