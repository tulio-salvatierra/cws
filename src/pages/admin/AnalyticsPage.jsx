// src/pages/admin/AnalyticsPage.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const PLATFORM_LABELS = {
  instagram: 'Instagram', facebook: 'Facebook', x: 'X (Twitter)',
  linkedin: 'LinkedIn', pinterest: 'Pinterest', whatsapp: 'WhatsApp', youtube: 'YouTube',
}

const STATUS_STYLES = {
  draft:          'bg-gray-800 text-gray-400',
  review_pending: 'bg-orange-900/70 text-orange-300',
  approved:       'bg-yellow-900/70 text-yellow-300',
  scheduled:      'bg-indigo-900/70 text-indigo-300',
  published:      'bg-green-900/70 text-green-300',
  rejected:       'bg-red-900/70 text-red-400',
}

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [draftCounts, setDraftCounts] = useState({})
  const [platformStats, setPlatformStats] = useState([])
  const [recentDrafts, setRecentDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const [draftsRes, postsRes, recentRes] = await Promise.all([
        supabase.from('content_drafts').select('status'),
        supabase.from('platform_posts').select('platform, status'),
        supabase
          .from('content_drafts')
          .select('id, topic, status, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      if (draftsRes.error || postsRes.error || recentRes.error) {
        setError((draftsRes.error || postsRes.error || recentRes.error).message)
        setLoading(false)
        return
      }

      // Count drafts by status
      const counts = {}
      draftsRes.data.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1 })
      setDraftCounts(counts)

      // Aggregate platform stats
      const platMap = {}
      postsRes.data.forEach(p => {
        if (!platMap[p.platform]) platMap[p.platform] = { total: 0, scheduled: 0, published: 0 }
        platMap[p.platform].total++
        if (p.status === 'scheduled') platMap[p.platform].scheduled++
        if (p.status === 'published') platMap[p.platform].published++
      })
      const sorted = Object.entries(platMap)
        .map(([platform, c]) => ({ platform, ...c }))
        .sort((a, b) => b.total - a.total)
      setPlatformStats(sorted)

      setRecentDrafts(recentRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const total     = Object.values(draftCounts).reduce((a, b) => a + b, 0)
  const published = draftCounts['published'] || 0
  const scheduled = draftCounts['scheduled'] || 0
  const pending   = draftCounts['review_pending'] || 0

  // Max total for bar widths
  const maxPlatTotal = Math.max(...platformStats.map(p => p.total), 1)

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-white text-lg font-semibold mb-6">Analytics</h1>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {error   && <p className="text-red-400 text-sm">Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard label="Total Drafts"    value={total}     color="text-white" />
            <StatCard label="Pending Review"  value={pending}   color="text-orange-400"
              sub={pending > 0 ? 'Waiting for approval' : 'All clear'} />
            <StatCard label="Scheduled"       value={scheduled} color="text-indigo-400"
              sub="Posts in queue" />
            <StatCard label="Published"       value={published} color="text-green-400"
              sub="All time" />
          </div>

          {/* ── Status funnel ── */}
          <section className="mb-8">
            <h2 className="text-white text-sm font-semibold mb-3">Draft Funnel</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              {['draft', 'review_pending', 'approved', 'scheduled', 'published', 'rejected'].map(s => {
                const n = draftCounts[s] || 0
                const pct = total > 0 ? (n / total) * 100 : 0
                return (
                  <div key={s} className="flex items-center gap-4 px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded w-28 text-center flex-shrink-0 ${STATUS_STYLES[s]}`}>
                      {s.replace('_', ' ')}
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs w-6 text-right">{n}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Platform breakdown ── */}
          <section className="mb-8">
            <h2 className="text-white text-sm font-semibold mb-3">Platform Breakdown</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              {platformStats.length === 0 && (
                <p className="px-4 py-4 text-gray-500 text-sm">No platform posts yet.</p>
              )}
              {platformStats.map(({ platform, total: t, scheduled: s, published: p }) => (
                <div key={platform} className="px-4 py-3 flex items-center gap-4">
                  <span className="text-gray-200 text-sm w-28 flex-shrink-0">
                    {PLATFORM_LABELS[platform] ?? platform}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600/60 rounded-full"
                      style={{ width: `${(t / maxPlatTotal) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-3 text-xs flex-shrink-0">
                    <span className="text-indigo-400">{s} sched</span>
                    <span className="text-green-400">{p} pub</span>
                    <span className="text-gray-600">{t} total</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Recent activity ── */}
          <section>
            <h2 className="text-white text-sm font-semibold mb-3">Recent Drafts</h2>
            <div className="flex flex-col gap-1.5">
              {recentDrafts.map(d => (
                <div
                  key={d.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-3"
                >
                  <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${STATUS_STYLES[d.status] ?? 'bg-gray-800 text-gray-400'}`}>
                    {d.status?.replace('_', ' ')}
                  </span>
                  <p className="text-gray-200 text-sm flex-1 truncate min-w-0">{d.topic}</p>
                  <p className="text-gray-600 text-xs flex-shrink-0">
                    {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
