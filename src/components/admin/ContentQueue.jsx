import { useState } from 'react'
import { useDrafts, useYouTubeDrafts } from '../../Hooks/useDrafts'
import DraftCard from './DraftCard'
import PublishedCard from './PublishedCard'
import YouTubeCard from './YouTubeCard'
import SlideOver from './SlideOver'
import GenerateButton from './GenerateButton'

export default function ContentQueue() {
  const [activeTab, setActiveTab] = useState('pending')
  const [expandedDraft, setExpandedDraft] = useState(null)

  const pending = useDrafts('review_pending')
  const published = useDrafts('published')
  const youtube = useYouTubeDrafts()

  function TabButton({ id, label, count, color }) {
    const isActive = activeTab === id
    const colors = {
      orange: isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white',
      green:  isActive ? 'bg-green-700 text-white'  : 'text-gray-400 hover:text-white',
      purple: isActive ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white',
    }
    return (
      <button
        onClick={() => setActiveTab(id)}
        aria-label={label}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${colors[color]}`}
      >
        {label}
        {count > 0 && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-700'}`}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-lg font-semibold">Content Queue</h1>
        <GenerateButton webhookUrl={import.meta.env.VITE_N8N_WF2_WEBHOOK_URL} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton id="pending"   label="Pending"   count={pending.drafts.length}   color="orange" />
        <TabButton id="published" label="Published" count={published.drafts.length} color="green"  />
        <TabButton id="youtube"   label="YouTube"   count={youtube.drafts.length}   color="purple" />
      </div>

      {/* Pending tab */}
      {activeTab === 'pending' && (
        <>
          {pending.loading && <p className="text-gray-500 text-sm">Loading…</p>}
          {pending.error   && <p className="text-red-400 text-sm">Error: {pending.error}</p>}
          {!pending.loading && !pending.error && pending.drafts.length === 0 && (
            <p className="text-gray-500 text-sm">No drafts pending review.</p>
          )}
          <div className="flex flex-col gap-3">
            {pending.drafts.map(draft => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onApprove={id => pending.approveDraft(id)}
                onReject={pending.rejectDraft}
                onExpand={setExpandedDraft}
              />
            ))}
          </div>
        </>
      )}

      {/* Published tab */}
      {activeTab === 'published' && (
        <>
          {published.loading && <p className="text-gray-500 text-sm">Loading…</p>}
          {published.error   && <p className="text-red-400 text-sm">Error: {published.error}</p>}
          {!published.loading && !published.error && published.drafts.length === 0 && (
            <p className="text-gray-500 text-sm">No published posts yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {published.drafts.map(draft => (
              <PublishedCard key={draft.id} draft={draft} />
            ))}
          </div>
        </>
      )}

      {/* YouTube tab */}
      {activeTab === 'youtube' && (
        <>
          {youtube.loading && <p className="text-gray-500 text-sm">Loading…</p>}
          {youtube.error   && <p className="text-red-400 text-sm">Error: {youtube.error}</p>}
          {!youtube.loading && !youtube.error && youtube.drafts.length === 0 && (
            <p className="text-gray-500 text-sm">No YouTube metadata ready.</p>
          )}
          <div className="flex flex-col gap-4">
            {youtube.drafts.map(draft => (
              <YouTubeCard
                key={draft.id}
                draft={draft}
                onMarkUploaded={youtube.markUploaded}
              />
            ))}
          </div>
        </>
      )}

      {/* SlideOver for pending draft preview */}
      {expandedDraft && (
        <SlideOver
          draft={expandedDraft}
          onClose={() => setExpandedDraft(null)}
          onApprove={id => { pending.approveDraft(id); setExpandedDraft(null) }}
          onReject={id => { pending.rejectDraft(id); setExpandedDraft(null) }}
        />
      )}
    </div>
  )
}
