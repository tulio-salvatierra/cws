import { NavLink } from 'react-router-dom'
import { useAuth } from '../../Hooks/useAuth'

const NAV = [
  { to: '/admin', label: '📋 Queue', end: true },
  { to: '/admin/clients', label: 'Clients' },
  { to: '/admin/calendar', label: '📅 Calendar' },
  { to: '/admin/keywords', label: '🔑 Keywords' },
  { to: '/admin/analytics', label: '📊 Analytics' },
  { to: '/admin/settings', label: '⚙️ Settings' },
]

export default function AdminLayout({ children }) {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-52 flex-shrink-0 border-b border-gray-800 md:border-b-0 md:border-r flex flex-col py-4 md:py-6 px-3">
        <div className="text-indigo-400 font-bold text-sm px-3 mb-3 md:mb-6 tracking-wide uppercase">
          Cicero Admin
        </div>
        <nav className="flex flex-row md:flex-col gap-1 flex-1 overflow-x-auto">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="mt-2 md:mt-0 text-gray-500 hover:text-gray-300 text-xs px-3 py-2 text-left transition-colors"
        >
          Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
