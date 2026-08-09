import { useEffect, useState } from 'react'
import ContentAreaTabs from '../../components/admin/ContentAreaTabs'
import { supabase } from '../../lib/supabase'

const OUTCOMES = ['worked', 'flat', 'flopped']

export default function PublishedPostsPage() {
  const [state, setState] = useState({ loading: true, error: '', workspaceId: null, posts: [] })

  useEffect(() => {
    let active = true

    async function load() {
      const membership = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('status', 'active')
        .order('created_at')
        .limit(1)
        .single()

      if (membership.error) throw membership.error

      const result = await supabase
        .from('published_posts')
        .select('id, platform, published_at, language, source, outcome_score, outcome_note, outcome_recorded_at, external_url')
        .eq('workspace_id', membership.data.workspace_id)
        .order('published_at', { ascending: false })

      if (result.error) throw result.error
      if (active) {
        setState({
          loading: false,
          error: '',
          workspaceId: membership.data.workspace_id,
          posts: result.data || [],
        })
      }
    }

    load().catch(error => {
      if (active) setState({ loading: false, error: error.message, workspaceId: null, posts: [] })
    })

    return () => { active = false }
  }, [])

  function changeDraft(id, field, value) {
    setState(current => ({
      ...current,
      posts: current.posts.map(post => post.id === id ? { ...post, [field]: value } : post),
    }))
  }

  async function saveOutcome(post) {
    changeDraft(post.id, 'saving', true)
    changeDraft(post.id, 'saveError', '')

    const outcomeRecordedAt = post.outcome_score ? new Date().toISOString() : null
    const result = await supabase
      .from('published_posts')
      .update({
        outcome_score: post.outcome_score || null,
        outcome_note: post.outcome_note?.trim() || null,
        outcome_recorded_at: outcomeRecordedAt,
      })
      .eq('id', post.id)
      .eq('workspace_id', state.workspaceId)
      .select('outcome_score, outcome_note, outcome_recorded_at')
      .single()

    if (result.error) {
      setState(current => ({
        ...current,
        posts: current.posts.map(item => item.id === post.id
          ? { ...item, saving: false, saveError: result.error.message }
          : item),
      }))
      return
    }

    setState(current => ({
      ...current,
      posts: current.posts.map(item => item.id === post.id
        ? { ...item, ...result.data, saving: false, saveError: '', saved: true }
        : item),
    }))
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Content</p>
        <h1 className="mt-2 text-xl font-semibold text-white">Published posts</h1>
        <p className="mt-1 text-sm text-gray-400">A durable record of posts published by any source.</p>
      </div>

      <ContentAreaTabs active="publish-log" />

      {state.loading && <p className="text-sm text-gray-500">Loading published posts…</p>}
      {state.error && <p role="alert" className="text-sm text-rose-300">{state.error}</p>}
      {!state.loading && !state.error && state.posts.length === 0 && (
        <p className="text-sm text-gray-500">No publish events recorded yet.</p>
      )}

      {!state.loading && !state.error && state.posts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="min-w-full divide-y divide-gray-800 text-left text-sm">
            <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950/40 text-gray-300">
              {state.posts.map(post => (
                <tr key={post.id}>
                  <td className="px-4 py-4 font-medium capitalize text-white">{post.platform}</td>
                  <td className="whitespace-nowrap px-4 py-4">{formatPublishedAt(post.published_at)}</td>
                  <td className="px-4 py-4 uppercase">{post.language || '—'}</td>
                  <td className="px-4 py-4">{post.source}</td>
                  <td className="min-w-80 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Outcome for ${post.platform} post`}
                        value={post.outcome_score || ''}
                        onChange={event => changeDraft(post.id, 'outcome_score', event.target.value)}
                        className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-2 text-sm text-white"
                      >
                        <option value="">Not rated</option>
                        {OUTCOMES.map(outcome => <option key={outcome} value={outcome}>{outcome}</option>)}
                      </select>
                      <input
                        aria-label={`Outcome note for ${post.platform} post`}
                        value={post.outcome_note || ''}
                        onChange={event => changeDraft(post.id, 'outcome_note', event.target.value)}
                        placeholder="Optional note"
                        className="min-w-40 flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                      />
                      <button
                        type="button"
                        disabled={post.saving}
                        onClick={() => saveOutcome(post)}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {post.saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                    {post.saveError && <p role="alert" className="mt-2 text-xs text-rose-300">{post.saveError}</p>}
                    {post.saved && !post.saveError && <p className="mt-2 text-xs text-emerald-400">Outcome saved.</p>}
                  </td>
                  <td className="px-4 py-4">
                    {post.external_url
                      ? <a className="text-indigo-300 hover:text-indigo-200" href={post.external_url} target="_blank" rel="noreferrer">Open</a>
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatPublishedAt(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
