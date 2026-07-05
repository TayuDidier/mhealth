import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { SEED_MEDICAL_RECORDS, SEED_PATIENTS } from '../../data/seedData'
import { formatDate } from '../../utils/dateHelpers'
import PageHeader from '../../components/PageHeader'
import AppCard from '../../components/AppCard'
import SkeletonCard from '../../components/SkeletonCard'
import EmptyState from '../../components/EmptyState'

export default function HealthPassportPage() {
  const { profile, isDemoMode } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const patientData = isDemoMode ? SEED_PATIENTS.find(p => p.email === profile?.email) || SEED_PATIENTS[0] : profile

  useEffect(() => {
    if (isDemoMode) {
      setRecords(SEED_MEDICAL_RECORDS.filter(r => r.patient_id === patientData?.id))
      setLoading(false)
      return
    }
    supabase.from('medical_records').select('*').eq('patient_id', profile.id).order('visit_date', { ascending: false })
      .then(({ data }) => { setRecords(data || []); setLoading(false) })
  }, [profile])

  return (
    <div>
      <PageHeader title="Health Passport" backButton />

      <div className="px-4 pt-4 pb-8 space-y-5">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
              {(patientData?.name || 'P').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-bold">{patientData?.name || profile?.name}</p>
              <p className="text-xs opacity-80">Patient Health Record</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'water_drop', label: 'Blood Type', val: patientData?.blood_type || '—' },
              { icon: 'calendar_today', label: 'Due Date', val: patientData?.due_date ? formatDate(patientData.due_date) : '—' },
              { icon: 'pregnant_woman', label: 'Gravida', val: patientData?.gravida ?? '—' },
              { icon: 'child_care', label: 'Para', val: patientData?.para ?? '—' },
            ].map(item => (
              <div key={item.label} className="bg-white/15 rounded-lg px-3 py-2">
                <p className="text-xs opacity-75 mb-0.5">{item.label}</p>
                <p className="font-bold text-sm">{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Provider */}
        {patientData?.assigned_provider_name && (
          <AppCard className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">stethoscope</span>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assigned Provider</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{patientData.assigned_provider_name}</p>
              </div>
            </div>
          </AppCard>
        )}

        {/* Visit Timeline */}
        <div>
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-3">Visit History</h3>
          {loading ? <SkeletonCard lines={4} />
            : records.length === 0 ? <EmptyState icon="folder_shared" title="No records yet" message="Your visit records will appear here after your appointments." />
            : records.map(r => (
              <div key={r.id} className="relative pl-6 pb-6">
                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-primary" />
                <div className="absolute left-1.5 top-4 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                <AppCard className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{formatDate(r.visit_date)}</p>
                    <p className="text-xs text-gray-500">{r.weight_kg} kg</p>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="bg-lavender-soft dark:bg-primary/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium">
                      BP {r.bp_systolic}/{r.bp_diastolic}
                    </span>
                    <span className="bg-mint text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {r.weight_kg} kg
                    </span>
                  </div>
                  {r.notes && <p className="text-sm text-gray-600 dark:text-gray-400">{r.notes}</p>}
                  {r.lab_results && (
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer font-medium text-primary">View lab results</summary>
                      <p className="mt-1 bg-gray-50 dark:bg-background-dark rounded p-2">{r.lab_results}</p>
                    </details>
                  )}
                </AppCard>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
