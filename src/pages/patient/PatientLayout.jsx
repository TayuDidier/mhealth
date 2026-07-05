import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import BottomNav from '../../components/BottomNav'
import OfflineBanner from '../../components/OfflineBanner'

const NAV_ITEMS = [
  { to: '/patient', end: true, icon: 'home', label: 'Home' },
  { to: '/patient/appointments', icon: 'calendar_month', label: 'Appointments' },
  { to: '/patient/hub', icon: 'menu_book', label: 'Knowledge' },
  { to: '/patient/messages', icon: 'chat', label: 'Messages' },
  { to: '/patient/profile', icon: 'person', label: 'Profile' },
]

export default function PatientLayout() {
  const { profile, isDemoMode } = useAuth()

  if (!isDemoMode && profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    // On desktop the app is a centered column; give the surrounding page a
    // darker in-palette field so the column no longer melts into the background.
    <div className="min-h-screen md:bg-[#ebe6e9] dark:md:bg-black">
      {/* App column: framed with a border + shadow on desktop for clear contrast. */}
      <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark relative md:border-x md:border-[#e2dce0] dark:md:border-gray-800 md:shadow-xl">
        <OfflineBanner />
        <main className="pb-20">
          <Outlet />
        </main>
        <BottomNav items={NAV_ITEMS} />
      </div>
    </div>
  )
}
