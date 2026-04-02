import { useState } from 'react'
import { useKeywords } from '../../Hooks/useKeywords'

export default function KeywordsPage() {
  const {
    suggested, active, blocked, loading, error,
    approveKeyword, rejectKeyword, blockKeyword, unblockKeyword,
    updatePriority, addKeyword,
  } = useKeywords()

  const [showBlocked, setShowBlocked] = useState(false)
  const [newTerm, setNewTerm] = useState('')
  const [newPriority, setNewPriority] = useState(3)

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading keywords…</div>
  if (error)   return <div className="p-6 text-red-400 text-sm">Error: {error}</div>

  async function handleAdd(e) {
    e.preventDefault()
    if (!newTerm.trim()) return
    await addKeyword({ term: newTerm.trim(), priority: newPriority })
    setNewTerm('')
    setNewPriority(3)
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-white text-lg font-semibold mb-6">Keyword Strategy</h1>

      {/* AI Suggestions */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-white text-sm font-semibold">AI Suggestions</h2>
          {suggested.length > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {suggested.length}
            </span>
          )}
        </div>
        {suggested.length === 0 ? (
          <p className="text-gray-500 text-sm">No suggestions pending — WF5 runs every Monday.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {suggested.map(kw => (
              <div
                key={kw.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{kw.term}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Priority {kw.priority} · {kw.rationale || 'AI suggested'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    aria-label="Approve"
                    onClick={() => approveKeyword(kw.id)}
                    className="bg-green-900 hover:bg-green-800 text-green-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    aria-label="Reject"
                    onClick={() => rejectKeyword(kw.id)}
                    className="bg-red-950 hover:bg-red-900 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Keywords */}
      <section className="mb-8">
        <h2 className="text-white text-sm font-semibold mb-3">Active Keywords</h2>
        <form onSubmit={handleAdd} className="flex gap-2 mb-3">
          <input
            value={newTerm}
            onChange={e => setNewTerm(e.target.value)}
            placeholder="Add keyword…"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
          <select
            value={newPriority}
            onChange={e => setNewPriority(Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>P{n}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Add
          </button>
        </form>

        {active.length === 0 ? (
          <p className="text-gray-500 text-sm">No active keywords yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left py-2">Term</th>
                <th className="text-left py-2 w-24">Priority</th>
                <th className="text-left py-2 w-16">Uses</th>
                <th className="text-right py-2 w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {active.map(kw => (
                <tr key={kw.id} className="border-b border-gray-900">
                  <td className="py-2 text-white">{kw.term}</td>
                  <td className="py-2">
                    <select
                      value={kw.priority}
                      onChange={e => updatePriority(kw.id, Number(e.target.value))}
                      className="bg-gray-900 border border-gray-800 rounded px-1 py-0.5 text-gray-300 text-xs"
                    >
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>P{n}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 text-gray-500">{kw.use_count ?? 0}</td>
                  <td className="py-2 text-right">
                    <button
                      aria-label="Block"
                      onClick={() => blockKeyword(kw.id)}
                      className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                    >
                      Block
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Blocked Keywords */}
      <section>
        <button
          aria-label="Toggle suppressed keywords"
          onClick={() => setShowBlocked(b => !b)}
          className="text-gray-500 hover:text-gray-300 text-sm font-semibold mb-3 flex items-center gap-1"
        >
          {showBlocked ? '▾' : '▸'} Blocked Keywords ({blocked.length})
        </button>
        {showBlocked && (
          <div className="flex flex-col gap-1">
            {blocked.map(kw => (
              <div
                key={kw.id}
                className="flex items-center justify-between px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg"
              >
                <span className="text-gray-500 text-sm line-through">{kw.term}</span>
                <button
                  onClick={() => unblockKeyword(kw.id)}
                  className="text-gray-500 hover:text-green-400 text-xs transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
