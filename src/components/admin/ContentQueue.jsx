import { useState } from 'react'
import { useDrafts } from '../../hooks/useDrafts'
import DraftCard from './DraftCard'
import SlideOver from './SlideOver'
import GenerateButton from './GenerateButton'

export default function ContentQueue() {
  const { drafts, loading, error, approveDraft, rejectDraft } = useDrafts('pending_review')
  const [expandedDraft, setExpandedDraft] = useState(null)

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading queue…</div>
  if (error)   return <div className="p-6 text-red-400 text-sm">Error: {error}</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-lg font-semibold">
          Content Queue
          {drafts.length > 0 && (
            <span className="ml-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {drafts.length}
            </span>
          )}
        </h1>
        <GenerateButton webhookUrl={import.meta.env.VITE_N8N_WF2_WEBHOOK_URL} />
      </div>

      {drafts.length === 0 ? (
        <p className="text-gray-500 text-sm">No drafts pending review.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {drafts.map(draft => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onApprove={id => approveDraft(id, null)}
              onReject={rejectDraft}
              onExpand={setExpandedDraft}
            />
          ))}
        </div>
      )}

      {expandedDraft && (
        <SlideOver
          draft={expandedDraft}
          onClose={() => setExpandedDraft(null)}
          onApprove={id => { approveDraft(id, null); setExpandedDraft(null) }}
          onReject={id => { rejectDraft(id); setExpandedDraft(null) }}
        />
      )}
    </div>
  )
}
