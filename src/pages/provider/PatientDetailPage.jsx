import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { SEED_PATIENTS, SEED_APPOINTMENTS, SEED_MEDICAL_RECORDS } from '../../data/seedData'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../utils/dateHelpers'
import PageHeader from '../../components/PageHeader'
import AppCard from '../../components/AppCard'
import AppButton from '../../components/AppButton'
import AppointmentCard from '../../components/AppointmentCard'

export default function PatientDetailPage() {
  const { id } = useParams()
  const { profile, isDemoMode } = useAuth()
  const [tab, setTab] = useState('passport')
  const seedPatient = isDemoMode ? SEED_PATIENTS.find(p => p.id === id) ?? null : null
  const [patient, setPatient] = useState(() => seedPatient)
  const [appointments, setAppointments] = useState(() => isDemoMode ? SEED_APPOINTMENTS.filter(a => a.patient_id === id) : [])
  const [records, setRecords] = useState(() => isDemoMode ? SEED_MEDICAL_RECORDS.filter(r => r.patient_id === id) : [])
  const [loadingPatient, setLoadingPatient] = useState(!isDemoMode)
  const [recordForm, setRecordForm] = useState({ visit_date: '', bp_systolic: '', bp_diastolic: '', weight_kg: '', notes: '', lab_results: '' })
  const [saving, setSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    gestational_week: seedPatient?.gestational_week ?? '',
    due_date: seedPatient?.due_date ?? '',
    blood_type: seedPatient?.blood_type ?? '',
    gravida: seedPatient?.gravida ?? '',
    para: seedPatient?.para ?? '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsSent, setSmsSent] = useState(false)

  useEffect(() => {
    if (isDemoMode || !id) return
    async function load() {
      setLoadingPatient(true)
      const [
        { data: userData },
        { data: ppData },
        { data: apptData },
        { data: recData },
      ] = await Promise.all([
        supabase.from('users').select('id, name, phone, email, avatar_url').eq('id', id).single(),
        supabase.from('patient_profiles').select('gestational_week, due_date, blood_type, gravida, para').eq('user_id', id).single(),
        supabase.from('appointments')
          .select('*, provider:users!appointments_provider_id_fkey(name)')
          .eq('patient_id', id)
          .order('datetime', { ascending: false }),
        supabase.from('medical_records').select('*').eq('patient_id', id).order('visit_date', { ascending: false }),
      ])
      const merged = { ...userData, ...(ppData || {}) }
      if (userData) setPatient(merged)
      setProfileForm({
        gestational_week: ppData?.gestational_week ?? '',
        due_date: ppData?.due_date ?? '',
        blood_type: ppData?.blood_type ?? '',
        gravida: ppData?.gravida ?? '',
        para: ppData?.para ?? '',
      })
      setAppointments((apptData || []).map(a => ({ ...a, provider_name: a.provider?.name || 'Provider' })))
      setRecords(recData || [])
      setLoadingPatient(false)
    }
    load()
  }, [id, isDemoMode])

  async function saveRecord(e) {
    e.preventDefault()
    setSaving(true)
    const newRecord = { id: `rec-${Date.now()}`, patient_id: id, provider_id: profile?.id || 'provider-1', ...recordForm }
    if (!isDemoMode) {
      await supabase.from('medical_records').insert({ patient_id: id, provider_id: profile.id, ...recordForm })
    }
    setRecords(prev => [newRecord, ...prev])
    setRecordForm({ visit_date: '', bp_systolic: '', bp_diastolic: '', weight_kg: '', notes: '', lab_results: '' })
    setSaving(false)
    setTab('passport')
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    const updates = {
      gestational_week: profileForm.gestational_week !== '' ? Number(profileForm.gestational_week) : null,
      due_date: profileForm.due_date || null,
      blood_type: profileForm.blood_type || null,
      gravida: profileForm.gravida !== '' ? Number(profileForm.gravida) : null,
      para: profileForm.para !== '' ? Number(profileForm.para) : null,
    }
    if (!isDemoMode) {
      await supabase.from('patient_profiles').update(updates).eq('user_id', id)
    }
    setPatient(prev => ({ ...prev, ...updates }))
    setSavingProfile(false)
    setTab('passport')
  }

  async function triggerSMS() {
    setSmsLoading(true)
    const upcomingAppt = appointments.find(a => a.status === 'upcoming')
    if (!upcomingAppt) { alert('No upcoming appointment to send reminder for.'); setSmsLoading(false); return }
    if (!isDemoMode) {
      await supabase.functions.invoke('send-reminders', { body: { appointmentId: upcomingAppt.id } })
    }
    setSmsSent(true)
    setSmsLoading(false)
    setTimeout(() => setSmsSent(false), 3000)
  }

  if (loadingPatient) return <div className="p-8 text-center text-gray-500">Loading patient…</div>
  if (!patient) return <div className="p-8 text-center text-gray-500">Patient not found.</div>

  return (
    <div>
      <PageHeader title={patient.name} backButton action={
        <button onClick={triggerSMS} disabled={smsLoading}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50">
          <span className="material-symbols-outlined text-sm">sms</span>
          {smsLoading ? 'Sending...' : smsSent ? 'Sent ✓' : 'Send SMS'}
        </button>
      } />

      {/* Header */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-4 text-white flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
            {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-lg">{patient.name}</p>
            <p className="text-sm opacity-80">
              {patient.gestational_week ? `Week ${patient.gestational_week}` : 'No gestational data'}
              {patient.blood_type ? ` · ${patient.blood_type}` : ''}
            </p>
            {patient.due_date && <p className="text-xs opacity-70">Due: {formatDate(patient.due_date)}</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {['passport', 'appointments', 'add record', 'edit profile'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${tab === t ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-card-dark text-gray-500 hover:bg-gray-200'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8">
        {tab === 'passport' && (
          <div className="space-y-3">
            {records.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No records yet.</p>
              : records.map(r => (
                <AppCard key={r.id} className="p-4 space-y-2">
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{formatDate(r.visit_date)}</p>
                  <div className="flex gap-2 flex-wrap">
                    {(r.bp_systolic || r.bp_diastolic) && (
                      <span className="bg-lavender-soft dark:bg-primary/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium">
                        BP {r.bp_systolic}/{r.bp_diastolic}
                      </span>
                    )}
                    {r.weight_kg && (
                      <span className="bg-mint text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">{r.weight_kg} kg</span>
                    )}
                  </div>
                  {r.notes && <p className="text-sm text-gray-600 dark:text-gray-400">{r.notes}</p>}
                  {r.lab_results && <p className="text-xs text-gray-500 bg-gray-50 dark:bg-background-dark rounded p-2">{r.lab_results}</p>}
                </AppCard>
              ))}
          </div>
        )}

        {tab === 'appointments' && (
          <div className="space-y-3">
            {appointments.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No appointments.</p>
              : appointments.map(a => <AppointmentCard key={a.id} appointment={a} showPatient={false} />)}
          </div>
        )}

        {tab === 'add record' && (
          <form onSubmit={saveRecord} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Visit Date</label>
              <input type="date" value={recordForm.visit_date} onChange={e => setRecordForm(f => ({ ...f, visit_date: e.target.value }))} required
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Systolic BP</label>
                <input type="number" value={recordForm.bp_systolic} onChange={e => setRecordForm(f => ({ ...f, bp_systolic: e.target.value }))} placeholder="120"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Diastolic BP</label>
                <input type="number" value={recordForm.bp_diastolic} onChange={e => setRecordForm(f => ({ ...f, bp_diastolic: e.target.value }))} placeholder="80"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Weight (kg)</label>
              <input type="number" step="0.1" value={recordForm.weight_kg} onChange={e => setRecordForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="65.0"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
              <textarea value={recordForm.notes} onChange={e => setRecordForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Clinical notes..."
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Lab Results</label>
              <textarea value={recordForm.lab_results} onChange={e => setRecordForm(f => ({ ...f, lab_results: e.target.value }))} rows={2} placeholder="e.g. Hb: 11.2 g/dL..."
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            <AppButton type="submit" loading={saving} className="w-full justify-center">Save Record</AppButton>
          </form>
        )}

        {tab === 'edit profile' && (
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Gestational Week</label>
                <input type="number" min={1} max={42} value={profileForm.gestational_week} onChange={e => setProfileForm(f => ({ ...f, gestational_week: e.target.value }))} placeholder="e.g. 24"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Due Date</label>
                <input type="date" value={profileForm.due_date} onChange={e => setProfileForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Blood Type</label>
                <select value={profileForm.blood_type} onChange={e => setProfileForm(f => ({ ...f, blood_type: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Select…</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Gravida</label>
                <input type="number" min={0} value={profileForm.gravida} onChange={e => setProfileForm(f => ({ ...f, gravida: e.target.value }))} placeholder="0"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Para</label>
                <input type="number" min={0} value={profileForm.para} onChange={e => setProfileForm(f => ({ ...f, para: e.target.value }))} placeholder="0"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <AppButton type="submit" loading={savingProfile} className="w-full justify-center">Update Patient Profile</AppButton>
          </form>
        )}
      </div>
    </div>
  )
}
