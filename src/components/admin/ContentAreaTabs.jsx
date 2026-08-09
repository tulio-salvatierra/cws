export default function ContentAreaTabs({ active }) {
  const tabs = [
    { id: 'queue', label: 'Legacy queue', href: '/admin/legacy-queue' },
    { id: 'publish-log', label: 'Publish log', href: '/admin/published' },
  ]

  return (
    <nav aria-label="Content area" className="mb-6 flex gap-2 border-b border-gray-800 pb-3">
      {tabs.map(tab => (
        <a
          key={tab.id}
          href={tab.href}
          aria-current={active === tab.id ? 'page' : undefined}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab.id
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
