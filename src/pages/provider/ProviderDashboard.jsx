import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { SEED_APPOINTMENTS, SEED_PATIENTS, SEED_MESSAGES } from '../../data/seedData'
import { formatDate, formatTime } from '../../utils/dateHelpers'
import AppCard from '../../components/AppCard'
import AppointmentCard from '../../components/AppointmentCard'

export default function ProviderDashboard() {
  const { profile, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const firstName = (profile?.name || 'Doctor').split(' ').slice(-1)[0]

  const [myAppts, setMyAppts] = useState(() =>
    isDemoMode
      ? SEED_APPOINTMENTS.filter(a => a.provider_id === (profile?.id || 'provider-1') && a.status === 'upcoming')
          .sort((a, b) => new Date(a.datetime) - new Date(b.datetime)).slice(0, 5)
      : []
  )
  const [patientCount, setPatientCount] = useState(() =>
    isDemoMode ? SEED_PATIENTS.filter(p => p.assigned_provider_id === (profile?.id || 'provider-1')).length : 0
  )
  const [unreadCount, setUnreadCount] = useState(() =>
    isDemoMode ? SEED_MESSAGES.filter(m => m.receiver_id === (profile?.id || 'provider-1') && !m.read_at).length : 0
  )

  useEffect(() => {
    if (isDemoMode || !profile) return
    async function load() {
      const [
        { data: appts },
        { count: pCount },
        { count: uCount },
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('*, patient:users!appointments_patient_id_fkey(name)')
          .eq('provider_id', profile.id)
          .eq('status', 'upcoming')
          .order('datetime', { ascending: true })
          .limit(5),
        supabase
          .from('patient_profiles')
          .select('user_id', { count: 'exact', head: true })
          .eq('assigned_provider_id', profile.id),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', profile.id)
          .is('read_at', null),
      ])
      if (appts) setMyAppts(appts.map(a => ({ ...a, patient_name: a.patient?.name || 'Patient' })))
      setPatientCount(pCount || 0)
      setUnreadCount(uCount || 0)
    }
    load()
  }, [profile, isDemoMode])

  const todayCount = myAppts.filter(a => new Date(a.datetime).toDateString() === new Date().toDateString()).length

  const stats = [
    { icon: 'calendar_month', label: "Today's Appts", value: todayCount,   color: 'text-primary bg-lavender-soft' },
    { icon: 'group',          label: 'My Patients',   value: patientCount,  color: 'text-teal-700 bg-mint' },
    { icon: 'chat',           label: 'Unread Messages', value: unreadCount, color: 'text-orange-600 bg-orange-100' },
  ]

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Welcome, {firstName}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-card-dark rounded-xl p-3 shadow-card text-center">
            <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center mx-auto mb-2`}>
              <span className="material-symbols-outlined text-xl">{s.icon}</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Upcoming Appointments</h3>
          <button onClick={() => navigate('/provider/appointments')} className="text-xs text-primary font-semibold">View all</button>
        </div>
        {myAppts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No upcoming appointments.</p>
        ) : (
          <div className="space-y-3">
            {myAppts.slice(0, 3).map(a => <AppointmentCard key={a.id} appointment={a} showPatient />)}
          </div>
        )}
      </div>

      {unreadCount > 0 && (
        <button
          onClick={() => navigate('/provider/messages')}
          className="w-full flex items-center justify-between bg-white dark:bg-card-dark rounded-xl p-4 shadow-card hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">chat</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">New messages</p>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </button>
      )}
    </div>
  )
}
