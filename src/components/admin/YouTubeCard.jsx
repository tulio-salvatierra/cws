import { useState } from 'react'

export default function YouTubeCard({ draft, onMarkUploaded }) {
  const ytPost = draft.platform_posts?.find(pp => pp.platform === 'youtube')
  let metadata = { title: '', description: '', tags: '' }
  try {
    metadata = JSON.parse(ytPost?.copy || '{}')
  } catch {
    // keep defaults
  }

  const [copied, setCopied] = useState(null)

  async function copy(text, field) {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const tags = metadata.tags
    ? metadata.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  return (
    <div className="bg-gray-900 border border-purple-900 rounded-xl px-4 py-4">
      {/* Thumbnail + Title */}
      <div className="flex gap-4 mb-3">
        {ytPost?.image_url && (
          <div
            className="w-24 h-16 rounded-lg bg-gray-800 flex-shrink-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${ytPost.image_url})` }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Title</p>
          <div className="flex gap-2 items-start">
            <p className="text-white text-sm font-medium flex-1">{metadata.title}</p>
            <button
              onClick={() => copy(metadata.title, 'title')}
              className="text-gray-500 hover:text-gray-300 text-xs shrink-0 transition-colors"
            >
              {copied === 'title' ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Description</p>
          <button
            onClick={() => copy(metadata.description, 'desc')}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            {copied === 'desc' ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
          {metadata.description}
        </p>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Tags</p>
          <button
            onClick={() => copy(metadata.tags, 'tags')}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            {copied === 'tags' ? '✓ Copied' : 'Copy all'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, i) => (
            <span key={i} className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      <button
        aria-label="Mark as Uploaded"
        onClick={() => onMarkUploaded(ytPost.id)}
        className="w-full bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
      >
        ✓ Mark as Uploaded
      </button>
    </div>
  )
}
