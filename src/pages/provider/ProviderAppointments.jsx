import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { SEED_APPOINTMENTS, SEED_PATIENTS } from '../../data/seedData'
import { HOSPITAL } from '../../config/hospital'
import { formatDate, formatTime } from '../../utils/dateHelpers'
import PageHeader from '../../components/PageHeader'
import AppointmentCard from '../../components/AppointmentCard'
import AppButton from '../../components/AppButton'
import EmptyState from '../../components/EmptyState'

const EMPTY_FORM = { patient_id: '', date: '', time: '', location: '' }

export default function ProviderAppointments() {
  const { profile, isDemoMode } = useAuth()
  const [appointments, setAppointments] = useState(() =>
    isDemoMode
      ? SEED_APPOINTMENTS.filter(a => a.provider_id === (profile?.id || 'provider-1'))
          .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      : []
  )
  const [patients, setPatients] = useState(() =>
    isDemoMode
      ? SEED_PATIENTS.filter(p => p.assigned_provider_id === (profile?.id || 'provider-1'))
      : []
  )
  const [tab, setTab] = useState('upcoming')
  const [managing, setManaging] = useState(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleForm, setScheduleForm] = useState(EMPTY_FORM)
  const [scheduleSaving, setScheduleSaving] = useState(false)

  useEffect(() => {
    if (isDemoMode || !profile) return

    // fetch appointments
    supabase
      .from('appointments')
      .select('*, patient:users!appointments_patient_id_fkey(name)')
      .eq('provider_id', profile.id)
      .order('datetime', { ascending: true })
      .then(({ data }) => {
        if (data) setAppointments(data.map(a => ({ ...a, patient_name: a.patient?.name || 'Patient' })))
      })

    // fetch assigned patients for the scheduler
    async function loadPatients() {
      const { data: profiles } = await supabase
        .from('patient_profiles')
        .select('user_id')
        .eq('assigned_provider_id', profile.id)
      if (!profiles?.length) return
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', profiles.map(p => p.user_id))
      setPatients(users || [])
    }
    loadPatients()
  }, [profile, isDemoMode])

  const filtered = appointments.filter(a => a.status === tab)

  async function markComplete(appt) {
    setSaving(true)
    const updated = { ...appt, status: 'completed', notes }
    if (!isDemoMode) {
      await supabase.from('appointments').update({ status: 'completed', notes }).eq('id', appt.id)
    }
    setAppointments(prev => prev.map(a => a.id === appt.id ? updated : a))
    setManaging(null)
    setNotes('')
    setSaving(false)
  }

  async function cancelAppt(appt) {
    if (!isDemoMode) await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appt.id)
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'cancelled' } : a))
    setManaging(null)
  }

  async function scheduleAppt(e) {
    e.preventDefault()
    setScheduleSaving(true)

    const datetime = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString()
    const patient = patients.find(p => p.id === scheduleForm.patient_id)

    if (isDemoMode) {
      const newAppt = {
        id: `appt-${Date.now()}`,
        patient_id: scheduleForm.patient_id,
        patient_name: patient?.name || 'Patient',
        provider_id: profile?.id || 'provider-1',
        datetime,
        status: 'upcoming',
        location: scheduleForm.location || HOSPITAL.name,
        notes: '',
        reminder_sent: false,
      }
      setAppointments(prev =>
        [...prev, newAppt].sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      )
    } else {
      const { data } = await supabase
        .from('appointments')
        .insert({
          patient_id: scheduleForm.patient_id,
          provider_id: profile.id,
          datetime,
          location: scheduleForm.location || HOSPITAL.name,
          status: 'upcoming',
        })
        .select('*, patient:users!appointments_patient_id_fkey(name)')
        .single()

      if (data) {
        const newAppt = { ...data, patient_name: data.patient?.name || patient?.name || 'Patient' }
        setAppointments(prev =>
          [...prev, newAppt].sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
        )
      }
    }

    setScheduleSaving(false)
    setScheduleForm(EMPTY_FORM)
    setScheduling(false)
    setTab('upcoming')
  }

  // today's date as min for the date picker
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <PageHeader
        title="Appointments"
        action={
          <button
            onClick={() => setScheduling(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            title="Schedule appointment"
          >
            <span className="material-symbols-outlined text-primary text-xl">add</span>
          </button>
        }
      />
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {['upcoming', 'completed', 'cancelled'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition-colors ${tab === t ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-card-dark text-gray-500 hover:bg-gray-200'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 space-y-3">
        {filtered.length === 0 ? <EmptyState icon="calendar_month" title={`No ${tab} appointments`} />
          : filtered.map(a => (
            <AppointmentCard key={a.id} appointment={a} showPatient
              onAction={tab === 'upcoming' ? setManaging : undefined} />
          ))}
      </div>

      {/* Schedule new appointment modal */}
      {scheduling && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setScheduling(false)}>
          <div className="bg-white dark:bg-card-dark rounded-t-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 dark:text-white">Schedule Appointment</h2>
              <button onClick={() => setScheduling(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={scheduleAppt} className="space-y-4">
              {/* Patient selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Patient</label>
                {patients.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No assigned patients found.</p>
                ) : (
                  <select
                    required
                    value={scheduleForm.patient_id}
                    onChange={e => setScheduleForm(f => ({ ...f, patient_id: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select a patient…</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  min={today}
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Time</label>
                <input
                  type="time"
                  required
                  value={scheduleForm.time}
                  onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Location <span className="font-normal text-gray-400">(optional room — defaults to {HOSPITAL.name})</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clinic Room 3"
                  value={scheduleForm.location}
                  onChange={e => setScheduleForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <AppButton variant="ghost" type="button" onClick={() => setScheduling(false)} className="flex-1 justify-center">
                  Cancel
                </AppButton>
                <AppButton
                  type="submit"
                  loading={scheduleSaving}
                  disabled={patients.length === 0}
                  className="flex-1 justify-center"
                >
                  <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                  Schedule
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage existing appointment modal */}
      {managing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setManaging(null)}>
          <div className="bg-white dark:bg-card-dark rounded-t-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-gray-800 dark:text-white">Manage Appointment</h2>
            <p className="text-sm text-gray-500">{managing.patient_name} · {formatDate(managing.datetime)} at {formatTime(managing.datetime)}</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Visit Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add notes from this visit..."
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            <AppButton loading={saving} className="w-full justify-center" onClick={() => markComplete(managing)}>
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Mark as Completed
            </AppButton>
            <AppButton variant="danger" className="w-full justify-center" onClick={() => cancelAppt(managing)}>Cancel Appointment</AppButton>
            <AppButton variant="ghost" className="w-full justify-center" onClick={() => setManaging(null)}>Close</AppButton>
          </div>
        </div>
      )}
    </div>
  )
}
