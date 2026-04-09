// src/pages/admin/CalendarPage.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import PlatformBadge from '../../components/admin/PlatformBadge'

const STATUS_STYLES = {
  scheduled:  'bg-indigo-900/60 text-indigo-300',
  published:  'bg-green-900/60 text-green-300',
  failed:     'bg-red-900/60 text-red-400',
  draft:      'bg-gray-800 text-gray-400',
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDayHeader(iso) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function CalendarPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState(14) // days ahead

  useEffect(() => {
    async function load() {
      setLoading(true)
      const now = new Date()
      // Start from beginning of today
      now.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setDate(now.getDate() + range)

      const { data, error } = await supabase
        .from('platform_posts')
        .select('id, platform, copy, status, scheduled_at, draft_id, content_drafts(id, topic, image_url)')
        .not('scheduled_at', 'is', null)
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', end.toISOString())
        .order('scheduled_at', { ascending: true })

      if (error) setError(error.message)
      else setPosts(data || [])
      setLoading(false)
    }
    load()
  }, [range])

  // Group by calendar day string
  const grouped = posts.reduce((acc, post) => {
    const key = new Date(post.scheduled_at).toDateString()
    if (!acc[key]) acc[key] = { label: formatDayHeader(post.scheduled_at), posts: [] }
    acc[key].posts.push(post)
    return acc
  }, {})

  const totalScheduled = posts.filter(p => p.status === 'scheduled').length
  const totalPublished = posts.filter(p => p.status === 'published').length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-lg font-semibold">Calendar</h1>
          {!loading && (
            <p className="text-gray-500 text-xs mt-0.5">
              {totalScheduled} scheduled · {totalPublished} published
            </p>
          )}
        </div>
        <select
          value={range}
          onChange={e => setRange(Number(e.target.value))}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value={7}>Next 7 days</option>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
        </select>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {error   && <p className="text-red-400 text-sm">Error: {error}</p>}

      {!loading && !error && Object.keys(grouped).length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-10 text-center">
          <p className="text-gray-400 text-sm font-medium mb-1">No posts scheduled yet</p>
          <p className="text-gray-600 text-xs">
            Approve a draft in the Queue — WF5 will schedule posts the next weekday at 7 am CST.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {Object.entries(grouped).map(([dateKey, { label, posts: dayPosts }]) => (
          <div key={dateKey}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-gray-300 text-xs font-semibold uppercase tracking-wider">{label}</h2>
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-600 text-xs">{dayPosts.length} post{dayPosts.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex flex-col gap-2">
              {dayPosts.map(post => {
                const draft = Array.isArray(post.content_drafts)
                  ? post.content_drafts[0]
                  : post.content_drafts
                return (
                  <div
                    key={post.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-gray-700 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-10 h-10 rounded-lg bg-gray-800 flex-shrink-0 bg-cover bg-center"
                      style={draft?.image_url ? { backgroundImage: `url(${draft.image_url})` } : {}}
                    />

                    {/* Time */}
                    <span className="text-gray-500 text-xs w-16 flex-shrink-0 font-mono">
                      {formatTime(post.scheduled_at)}
                    </span>

                    {/* Platform */}
                    <div className="flex-shrink-0">
                      <PlatformBadge platform={post.platform} />
                    </div>

                    {/* Topic */}
                    <p className="text-gray-200 text-sm flex-1 truncate min-w-0">
                      {draft?.topic ?? '—'}
                    </p>

                    {/* Status */}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${STATUS_STYLES[post.status] ?? STATUS_STYLES.draft}`}>
                      {post.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
