import PlatformBadge from './PlatformBadge'

export default function DraftCard({ draft, onApprove, onReject, onExpand }) {
  const imageUrl = draft.platform_posts?.[0]?.image_url

  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors">
      {/* Thumbnail */}
      <div
        className="w-14 h-14 rounded-lg bg-gray-800 flex-shrink-0 bg-cover bg-center cursor-pointer"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
        onClick={() => onExpand(draft)}
        aria-label="Expand post preview"
      />

      {/* Main content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onExpand(draft)}>
        <p className="text-white text-sm font-medium truncate">{draft.topic}</p>
        <div className="flex gap-1 mt-1 flex-wrap">
          {draft.platform_posts?.map(pp => (
            <PlatformBadge key={pp.id} platform={pp.platform} />
          ))}
        </div>
        {draft.keywords?.length > 0 && (
          <p className="text-gray-500 text-xs mt-1 truncate">
            {draft.keywords.join(' · ')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          aria-label="Approve"
          onClick={() => onApprove(draft.id)}
          className="bg-green-900 hover:bg-green-800 text-green-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          ✓ Approve
        </button>
        <button
          aria-label="Edit"
          onClick={() => onExpand(draft)}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
        >
          ✎ Edit
        </button>
        <button
          aria-label="Reject"
          onClick={() => onReject(draft.id)}
          className="bg-red-950 hover:bg-red-900 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
