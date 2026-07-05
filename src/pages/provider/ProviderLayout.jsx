import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import BottomNav from '../../components/BottomNav'
import OfflineBanner from '../../components/OfflineBanner'
import AppButton from '../../components/AppButton'

const NAV_ITEMS = [
  { to: '/provider', end: true, icon: 'dashboard', label: 'Dashboard' },
  { to: '/provider/patients', icon: 'group', label: 'Patients' },
  { to: '/provider/appointments', icon: 'calendar_month', label: 'Schedule' },
  { to: '/provider/messages', icon: 'chat', label: 'Messages' },
  { to: '/provider/profile', icon: 'person', label: 'Profile' },
]

// A provider account must be approved (status = 'active') by an admin. A pending
// or deactivated account is blocked from the portal. Status is admin-controlled
// (enforced in the DB), and an unknown status fails open so accounts without a
// providers row yet are not locked out.
function ProviderInactiveNotice({ status, onSignOut }) {
  const pending = status === 'pending'
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-6 text-center">
      <span className="material-symbols-outlined text-primary text-5xl mb-4">
        {pending ? 'hourglass_top' : 'lock'}
      </span>
      <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
        {pending ? 'Awaiting approval' : 'Account inactive'}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        {pending
          ? 'Your provider account is pending approval by the hospital administrator. You will get access once it is activated.'
          : 'Your provider account is not active. Please contact the hospital administrator.'}
      </p>
      <AppButton variant="ghost" onClick={onSignOut}>
        <span className="material-symbols-outlined text-xl">logout</span>
        Sign Out
      </AppButton>
    </div>
  )
}

export default function ProviderLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  if (profile?.role === 'provider' && profile.status && profile.status !== 'active') {
    return <ProviderInactiveNotice status={profile.status} onSignOut={async () => { await signOut(); navigate('/login') }} />
  }

  return (
    // On desktop the app is a centered column; give the surrounding page a
    // darker in-palette field so the column no longer melts into the background.
    <div className="min-h-screen md:bg-[#ebe6e9] dark:md:bg-black">
      {/* App column: framed with a border + shadow on desktop for clear contrast. */}
      <div className="max-w-2xl mx-auto min-h-screen bg-background-light dark:bg-background-dark relative md:border-x md:border-[#e2dce0] dark:md:border-gray-800 md:shadow-xl">
        <OfflineBanner />
        <main className="pb-20">
          <Outlet />
        </main>
        <BottomNav items={NAV_ITEMS} />
      </div>
    </div>
  )
}
