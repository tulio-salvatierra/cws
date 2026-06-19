export default function DeliverablesChecklist({ deliverables, onToggle, compact = false }) {
  if (!deliverables?.length) {
    return <p className="text-sm text-zinc-500">No deliverables have been added yet.</p>
  }

  return (
    <ul className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
      {deliverables.map((item) => (
        <li
          key={item.id}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm"
        >
          <label className="flex min-h-10 items-center gap-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={item.completed}
              disabled={!onToggle}
              readOnly={!onToggle}
              onChange={() => onToggle?.(item.id)}
              className="h-4 w-4 flex-shrink-0 accent-orange-600"
            />
            <span className={item.completed ? 'text-zinc-500 line-through' : 'text-zinc-800'}>
              {item.label}
            </span>
          </label>
        </li>
      ))}
    </ul>
  )
}
