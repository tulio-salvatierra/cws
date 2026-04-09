import { useState } from 'react'

export default function SlideOver({ draft, onClose, onApprove, onReject }) {
  const [activeTab, setActiveTab] = useState(draft.platform_posts?.[0]?.platform ?? 'instagram')
  const activePost = draft.platform_posts?.find(pp => pp.platform === activeTab)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60"
        data-testid="backdrop"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-gray-900 border-l border-gray-800 h-full overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold text-sm pr-4">{draft.topic}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none flex-shrink-0">✕</button>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-1 px-6 pt-4 overflow-x-auto">
          {draft.platform_posts?.map(pp => (
            <button
              key={pp.platform}
              role="tab"
              aria-label={pp.platform}
              aria-selected={activeTab === pp.platform}
              onClick={() => setActiveTab(pp.platform)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === pp.platform
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {pp.platform.charAt(0).toUpperCase() + pp.platform.slice(1)}
            </button>
          ))}
        </div>

        {/* Platform content */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          {/* Image preview */}
          {activePost?.image_url ? (
            <img
              src={activePost.image_url}
              alt="Post visual"
              className="rounded-xl w-full object-cover max-h-48"
            />
          ) : (
            <div className="rounded-xl bg-gray-800 h-32 flex items-center justify-center text-gray-600 text-sm">
              No image yet
            </div>
          )}

          {/* Copy */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2 font-semibold">Copy</p>
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {activePost?.copy ?? '—'}
            </p>
          </div>

          {/* Keywords */}
          {draft.keywords?.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2 font-semibold">Keywords</p>
              <div className="flex flex-wrap gap-2">
                {draft.keywords.map(kw => (
                  <span key={kw} className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            onClick={() => onApprove(draft.id)}
            className="flex-1 bg-green-700 hover:bg-green-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onReject(draft.id)}
            className="flex-1 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg py-2 text-sm font-medium transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
