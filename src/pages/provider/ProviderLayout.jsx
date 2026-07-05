import { Outlet } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'
import OfflineBanner from '../../components/OfflineBanner'

const NAV_ITEMS = [
  { to: '/provider', end: true, icon: 'dashboard', label: 'Dashboard' },
  { to: '/provider/patients', icon: 'group', label: 'Patients' },
  { to: '/provider/appointments', icon: 'calendar_month', label: 'Schedule' },
  { to: '/provider/messages', icon: 'chat', label: 'Messages' },
  { to: '/provider/profile', icon: 'person', label: 'Profile' },
]

export default function ProviderLayout() {
  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-background-light dark:bg-background-dark">
      <OfflineBanner />
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav items={NAV_ITEMS} />
    </div>
  )
}
