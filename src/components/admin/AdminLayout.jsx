import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV = [
  { to: '/admin', label: '📋 Queue', end: true },
  { to: '/admin/calendar', label: '📅 Calendar' },
  { to: '/admin/keywords', label: '🔑 Keywords' },
  { to: '/admin/analytics', label: '📊 Analytics' },
  { to: '/admin/settings', label: '⚙️ Settings' },
]

export default function AdminLayout({ children }) {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 border-r border-gray-800 flex flex-col py-6 px-3">
        <div className="text-indigo-400 font-bold text-sm px-3 mb-6 tracking-wide uppercase">
          Cicero Admin
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm transition-colors ${
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
          className="text-gray-500 hover:text-gray-300 text-xs px-3 py-2 text-left transition-colors"
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
