function StatusBadge({ platform, status }) {
  const LABELS = {
    instagram: 'IG', facebook: 'FB', x: 'X',
    linkedin: 'LI', pinterest: 'PIN', whatsapp: 'WA', youtube: 'YT',
  }
  const label = LABELS[platform] ?? platform.toUpperCase()

  if (status === 'published') {
    return (
      <span className="bg-green-900 text-green-300 text-xs font-semibold px-2 py-0.5 rounded">
        {label} ✓
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="bg-red-900 text-red-300 text-xs font-semibold px-2 py-0.5 rounded">
        {label} ✗
      </span>
    )
  }
  if (status === 'scheduled') {
    return (
      <span className="bg-indigo-900 text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded">
        {label} ⏳
      </span>
    )
  }
  return (
    <span className="bg-gray-800 text-gray-400 text-xs font-semibold px-2 py-0.5 rounded">
      {label}
    </span>
  )
}

export default function PublishedCard({ draft }) {
  const imageUrl = draft.image_url
  const formattedDate = new Date(draft.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
      <div
        className="w-14 h-14 rounded-lg bg-gray-800 flex-shrink-0 bg-cover bg-center"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{draft.topic}</p>
        <p className="text-gray-500 text-xs mt-0.5">{formattedDate}</p>
        <div className="flex gap-1 mt-1 flex-wrap">
          {draft.platform_posts?.map(pp => (
            <StatusBadge key={pp.id} platform={pp.platform} status={pp.status} />
          ))}
        </div>
      </div>
    </div>
  )
}
