import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import OfflineBanner from '../../components/OfflineBanner'

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: 'dashboard', label: 'Overview' },
  { to: '/admin/providers', icon: 'group', label: 'Providers' },
  { to: '/admin/patients', icon: 'pregnant_woman', label: 'Patients' },
  { to: '/admin/content', icon: 'menu_book', label: 'Content' },
  { to: '/admin/analytics', icon: 'analytics', label: 'Analytics' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function logout() { await signOut(); navigate('/login') }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      <OfflineBanner />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-card-dark border-r border-gray-100 dark:border-gray-700 flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">favorite</span>
            </div>
            <div>
              <p className="font-extrabold text-gray-900 dark:text-white">MHealth</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${isActive ? 'bg-lavender-soft dark:bg-primary/20 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-background-dark'}`
              }>
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Dark Mode</span>
            <button onClick={toggle} className={`w-9 h-5 rounded-full transition-colors ${dark ? 'bg-primary' : 'bg-gray-300'} relative`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors w-full">
            <span className="material-symbols-outlined text-xl">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white dark:bg-card-dark border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(v => !v)}>
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">menu</span>
          </button>
          <p className="font-bold text-gray-800 dark:text-white">Admin</p>
          <div className="w-9" />
        </header>
        <main className="p-4 lg:p-8 max-w-6xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
