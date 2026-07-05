import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { SEED_APPOINTMENTS, SEED_PROVIDERS } from '../../data/seedData'
import { useNetwork } from '../../hooks/useNetwork'
import { formatDate, formatTime } from '../../utils/dateHelpers'
import PageHeader from '../../components/PageHeader'
import AppointmentCard from '../../components/AppointmentCard'
import AppButton from '../../components/AppButton'
import ErrorBanner from '../../components/ErrorBanner'
import SkeletonCard from '../../components/SkeletonCard'
import EmptyState from '../../components/EmptyState'

export default function AppointmentsPage() {
  const { profile, isDemoMode } = useAuth()
  const online = useNetwork()
  const [appointments, setAppointments] = useState([])
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBook, setShowBook] = useState(false)
  const [bookForm, setBookForm] = useState({ provider_id: '', date: '', time: '09:00', location: '' })
  const [booking, setBooking] = useState(false)
  const [bookError, setBookError] = useState('')
  const [bookSuccess, setBookSuccess] = useState(false)
  const [manageAppt, setManageAppt] = useState(null)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    if (isDemoMode) { setProviders(SEED_PROVIDERS); return }
    async function fetchProviders() {
      const { data: users } = await supabase.from('users').select('id, name').eq('role', 'provider')
      if (!users?.length) return
      const { data: details } = await supabase.from('providers').select('user_id, specialty, clinic_name').in('user_id', users.map(u => u.id))
      setProviders(users.map(u => ({
        id: u.id,
        name: u.name,
        specialty: details?.find(d => d.user_id === u.id)?.specialty || '',
        clinic_name: details?.find(d => d.user_id === u.id)?.clinic_name || '',
      })))
    }
    fetchProviders()
  }, [isDemoMode])

  async function load() {
    if (!online) { setError('This feature needs an internet connection.'); setLoading(false); return }
    if (!profile?.id) { setLoading(false); return }
    setError(null); setLoading(true)
    try {
      if (isDemoMode) {
        const pid = profile?.id
        setAppointments(SEED_APPOINTMENTS.filter(a => a.patient_id === pid))
      } else {
        const { data, error: err } = await supabase.from('appointments').select('*').eq('patient_id', profile.id).order('datetime', { ascending: false })
        if (err) throw err
        setAppointments(data || [])
      }
    } catch {
      setError('We couldn\'t load your appointments. Please check your connection and try again.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [profile])

  async function bookAppointment(e) {
    e.preventDefault()
    if (!online) { setBookError('This feature needs an internet connection.'); return }
    setBookError(''); setBooking(true)
    try {
      const provider = providers.find(p => p.id === bookForm.provider_id) || {}
      const datetime = `${bookForm.date}T${bookForm.time}:00Z`
      const newAppt = {
        id: `appt-${Date.now()}`, patient_id: profile.id, patient_name: profile.name,
        provider_id: bookForm.provider_id, provider_name: provider.name || bookForm.provider_id,
        datetime, status: 'upcoming', location: bookForm.location || provider.clinic_name || '',
        notes: '', reminder_sent: false,
      }
      if (isDemoMode) {
        setAppointments(prev => [...prev, newAppt])
      } else {
        const { data, error: err } = await supabase.from('appointments').insert({
          patient_id: profile.id, provider_id: bookForm.provider_id,
          datetime, status: 'upcoming', location: bookForm.location, reminder_sent: false,
        }).select().single()
        if (err) throw err
        setAppointments(prev => [...prev, data])
      }
      setBookSuccess(true)
      setTimeout(() => { setShowBook(false); setBookSuccess(false) }, 2000)
    } catch (e) {
      setBookError(e.message || 'Booking failed. Please try again.')
    }
    setBooking(false)
  }

  async function cancelAppointment(appt) {
    if (!online) { alert('This feature needs an internet connection.'); return }
    if (!isDemoMode) await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appt.id)
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'cancelled' } : a))
    setManageAppt(null)
  }

  const filtered = appointments.filter(a =>
    tab === 'upcoming' ? a.status === 'upcoming' : tab === 'completed' ? a.status === 'completed' : a.status === 'cancelled'
  ).sort((a, b) => new Date(a.datetime) - new Date(b.datetime))

  return (
    <div>
      <PageHeader title="Appointments" action={
        <button onClick={() => setShowBook(true)} className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors">
          <span className="material-symbols-outlined text-xl">add</span>
        </button>
      } />

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {['upcoming', 'completed', 'cancelled'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition-colors ${tab === t ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-card-dark text-gray-500 dark:text-gray-400 hover:bg-gray-200'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 space-y-3">
        {loading ? <><SkeletonCard /><SkeletonCard /></>
          : error ? <ErrorBanner message={error} onRetry={load} />
          : filtered.length === 0 ? <EmptyState icon="calendar_month" title={`No ${tab} appointments`} message="Tap the + button to book one." />
          : filtered.map(a => <AppointmentCard key={a.id} appointment={a} onAction={setManageAppt} />)}
      </div>

      {/* Book Appointment Modal */}
      {showBook && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setShowBook(false)}>
          <div className="bg-white dark:bg-card-dark rounded-t-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 dark:text-gray-100">Book Appointment</h2>
              <button onClick={() => setShowBook(false)}>
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>
            {bookSuccess ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-bold text-gray-800 dark:text-white">Appointment booked!</p>
              </div>
            ) : (
              <form onSubmit={bookAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Provider</label>
                  <select value={bookForm.provider_id} onChange={e => setBookForm(f => ({ ...f, provider_id: e.target.value }))} required
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select provider</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name} – {p.specialty}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                    <input type="date" value={bookForm.date} onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))} required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Time</label>
                    <input type="time" value={bookForm.time} onChange={e => setBookForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                  <input type="text" value={bookForm.location} onChange={e => setBookForm(f => ({ ...f, location: e.target.value }))} placeholder="Health facility name"
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                {bookError && <ErrorBanner message={bookError} />}
                <AppButton type="submit" loading={booking} className="w-full justify-center">Confirm Booking</AppButton>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manage Appointment Modal */}
      {manageAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setManageAppt(null)}>
          <div className="bg-white dark:bg-card-dark rounded-t-2xl w-full max-w-md p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-gray-800 dark:text-white">Manage Appointment</h2>
            <p className="text-sm text-gray-500">{formatDate(manageAppt.datetime)} at {formatTime(manageAppt.datetime)}</p>
            <AppButton variant="danger" className="w-full justify-center" onClick={() => cancelAppointment(manageAppt)}>
              Cancel Appointment
            </AppButton>
            <AppButton variant="ghost" className="w-full justify-center" onClick={() => setManageAppt(null)}>Close</AppButton>
          </div>
        </div>
      )}
    </div>
  )
}
