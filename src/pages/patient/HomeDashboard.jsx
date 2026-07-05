import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { SEED_APPOINTMENTS, SEED_PATIENTS } from '../../data/seedData'
import { useNetwork } from '../../hooks/useNetwork'
import { getTrimester, weeklyTip } from '../../utils/trimester'
import { formatDate, formatTime, daysUntil } from '../../utils/dateHelpers'
import AppCard from '../../components/AppCard'
import HealthTipCard from '../../components/HealthTipCard'
import SkeletonCard from '../../components/SkeletonCard'
import ErrorBanner from '../../components/ErrorBanner'
import EmergencyButton from '../../components/EmergencyButton'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomeDashboard() {
  const { profile, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const online = useNetwork()
  const [nextAppt, setNextAppt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const patientData = isDemoMode
    ? SEED_PATIENTS.find(p => p.email === profile?.email) || SEED_PATIENTS[0]
    : profile

  const week = patientData?.gestational_week || profile?.gestational_week || 12
  const trimester = getTrimester(week)
  const tip = weeklyTip(week)
  const firstName = (profile?.name || 'Mama').split(' ')[0]

  async function loadNextAppt() {
    if (!profile?.id) { setLoading(false); return }
    setError(null)
    setLoading(true)
    try {
      if (!online) throw new Error('offline')
      if (isDemoMode) {
        const pid = patientData?.id || profile?.id
        const upcoming = SEED_APPOINTMENTS.filter(a => a.patient_id === pid && a.status === 'upcoming')
          .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
        setNextAppt(upcoming[0] || null)
      } else {
        const { data, error: err } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', profile.id)
          .eq('status', 'upcoming')
          .order('datetime', { ascending: true })
          .limit(1)
          .single()
        if (err && err.code !== 'PGRST116') throw err
        setNextAppt(data)
      }
    } catch (e) {
      if (e.message !== 'offline') setError('We couldn\'t load your appointments. Please check your connection and try again.')
    }
    setLoading(false)
  }

  useEffect(() => { loadNextAppt() }, [profile])

  const QUICK_ACTIONS = [
    { icon: 'calendar_add_on', label: 'Book Appointment', to: '/patient/appointments' },
    { icon: 'chat', label: 'Messages', to: '/patient/messages' },
    { icon: 'menu_book', label: 'Knowledge Hub', to: '/patient/hub' },
    { icon: 'folder_shared', label: 'My Records', to: '/patient/passport' },
  ]

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
          {greeting()}, {firstName} 🌸
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Week {week} of your pregnancy</p>
      </div>

      {/* Next Appointment */}
      {loading ? (
        <SkeletonCard lines={4} />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadNextAppt} />
      ) : nextAppt ? (
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-xl">calendar_month</span>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Next Appointment</p>
          </div>
          <p className="font-bold text-lg">{nextAppt.provider_name}</p>
          <p className="text-sm opacity-90 mt-1">{formatDate(nextAppt.datetime)}</p>
          <p className="text-sm opacity-90">{formatTime(nextAppt.datetime)} · {nextAppt.location}</p>
          {daysUntil(nextAppt.datetime) !== null && (
            <div className="mt-3 bg-white/20 rounded-lg px-3 py-1.5 inline-block">
              <p className="text-xs font-bold">
                {daysUntil(nextAppt.datetime) === 0 ? '📅 Today!'
                  : daysUntil(nextAppt.datetime) === 1 ? '⏰ Tomorrow'
                  : `📅 In ${daysUntil(nextAppt.datetime)} days`}
              </p>
            </div>
          )}
        </div>
      ) : (
        !online ? (
          <AppCard className="p-4">
            <p className="text-sm text-gray-500 text-center">This feature needs an internet connection.</p>
          </AppCard>
        ) : (
          <AppCard className="p-4">
            <p className="text-sm text-gray-500 text-center">No upcoming appointments. Book one below!</p>
          </AppCard>
        )
      )}

      {/* Weekly Tip */}
      <HealthTipCard tip={tip} trimester={trimester} />

      {/* Quick Actions */}
      <div>
        <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(a => (
            <button key={a.to} onClick={() => navigate(a.to)}
              className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-card dark:shadow-card-dark flex flex-col items-center gap-2 hover:shadow-md active:scale-95 transition-all">
              <div className="w-10 h-10 rounded-full bg-lavender-soft dark:bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">{a.icon}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 text-center">{a.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Alert */}
      <div>
        <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-3">Need Help?</h3>
        <EmergencyButton />
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
          Tap to notify your emergency contact immediately
        </p>
      </div>
    </div>
  )
}
