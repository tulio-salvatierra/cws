import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../Hooks/useAuth'
import './admin-theme.css'

const NAV = [
  { to: '/admin', label: 'CEO Today', end: true },
  { to: '/admin/sales', label: 'Sales' },
  { to: '/admin/marketing', label: 'Marketing' },
  { to: '/admin/operations', label: 'Operations' },
  { to: '/admin/accounting', label: 'Accounting' },
  { to: '/admin/compliance', label: 'Compliance' },
]

export default function AdminLayout({ children }) {
  const { signOut } = useAuth()

  useEffect(() => {
    const previous = document.title
    document.title = 'CWS OS · Admin'
    return () => { document.title = previous }
  }, [])

  return (
    <div className="cws-admin min-h-screen text-white flex flex-col md:flex-row">
      {/* Sidebar: pinned on desktop, a sticky top bar on phones */}
      <aside className="cws-admin-sidebar sticky top-0 z-30 w-full md:w-60 md:h-screen flex-shrink-0 flex flex-col gap-4 md:gap-8 px-3 py-3 md:px-4 md:py-7 md:overflow-y-auto">
        <div className="flex items-center gap-3 px-2">
          <div className="cws-admin-mark" aria-hidden="true">C</div>
          <div className="flex flex-col leading-tight">
            <span className="cws-admin-display text-[15px] font-semibold tracking-wide">CWS OS</span>
            <span className="text-[11px] text-[#8b93a1]">Cicero Web Studio</span>
          </div>
        </div>
        <nav aria-label="Admin" className="flex flex-row md:flex-col gap-1 overflow-x-auto">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `cws-admin-nav whitespace-nowrap ${isActive ? 'is-active' : ''}`}
            >
              <span className="cws-admin-dot" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="cws-admin-glass hidden md:flex mt-auto flex-col gap-1 rounded-2xl p-3">
          <span className="text-[11px] uppercase tracking-[0.12em] text-[#8b93a1]">Signed in</span>
          <button
            onClick={signOut}
            className="text-left text-xs text-[#a6adb9] hover:text-white py-1 transition-colors"
          >
            Sign out
          </button>
        </div>
        <button
          onClick={signOut}
          className="md:hidden absolute right-3 top-4 text-xs text-[#a6adb9] hover:text-white"
        >
          Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
