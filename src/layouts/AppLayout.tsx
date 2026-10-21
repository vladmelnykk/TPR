import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

const NAV_ITEMS = [
  { to: '/', label: 'Аналіз альтернатив в умовах невизначеності', active: true },
  { to: '/risk', label: 'Вибір рішення в умовах ризику', active: true },
  { to: '/group-decisions', label: 'Групове прийняття рішень', active: true }
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* ─── Sidebar (desktop) ─── */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <SidebarContent />
      </aside>

      {/* ─── Mobile sidebar overlay ─── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex h-full w-64 flex-col bg-white dark:bg-gray-900 shadow-xl">
            <button
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Закрити меню"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ─── Main ─── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 md:px-6">
          <button
            className="md:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Відкрити меню"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/* ─── Sidebar content ─── */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 px-5 py-5">
        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 opacity-0">
          Аналіз рішень
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ to, label, active }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : active
                    ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    : 'text-gray-400 dark:text-gray-600 cursor-default'
              }`
            }
          >
            <span
              className={`mr-2 h-2 w-2 rounded-full ${
                active ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />
            {label}
            {!active && (
              <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600">
                скоро
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
